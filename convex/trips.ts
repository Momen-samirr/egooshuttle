import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { TRIP_DRIVER_VISIBILITY_THRESHOLD } from "../src/lib/constants";
import { getActiveSeatCount } from "./bookingDays";

const THRESHOLD = TRIP_DRIVER_VISIBILITY_THRESHOLD ?? 8;

// -------
// Get all trips (customer view - all non-cancelled)
// -------
export const getAllTrips = query({
  args: {
    origin: v.optional(v.string()),
    destination: v.optional(v.string()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let trips = await ctx.db
      .query("trips")
      .filter((q) => q.neq(q.field("status"), "cancelled"))
      .order("desc")
      .collect();

    if (args.origin) {
      trips = trips.filter((t) =>
        t.origin.toLowerCase().includes(args.origin!.toLowerCase())
      );
    }
    if (args.destination) {
      trips = trips.filter((t) =>
        t.destination.toLowerCase().includes(args.destination!.toLowerCase())
      );
    }
    if (args.date) {
      trips = trips.filter((t) =>
        t.departureTime.startsWith(args.date!)
      );
    }

    return trips;
  },
});

// -------
// Get unique origins for dropdown
// -------
export const getUniqueOrigins = query({
  args: {},
  handler: async (ctx) => {
    const trips = await ctx.db
      .query("trips")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const tripsAvail = await ctx.db
      .query("trips")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .collect();

    const allTrips = [...trips, ...tripsAvail];
    const origins = new Set(allTrips.map((t) => t.origin));
    return Array.from(origins).sort();
  },
});

// -------
// Search trips by origin/destination with live availability for today
// -------
export const searchTrips = query({
  args: {
    origins: v.optional(v.array(v.string())),
    destination: v.optional(v.string()),
    startTime: v.optional(v.string()), // e.g. "08:00"
    clientToday: v.string(), // e.g. "2026-04-07"
  },
  handler: async (ctx, args) => {
    let tripsQuery = ctx.db.query("trips");

    // Gather trips
    const allTrips = await tripsQuery.collect();
    let trips = allTrips.filter((t) => t.status !== "cancelled" && t.status !== "completed");

    if (args.origins && args.origins.length > 0) {
      const lowerOrigins = args.origins.map(o => o.toLowerCase());
      trips = trips.filter((t) => lowerOrigins.some(o => t.origin.toLowerCase().includes(o)));
    }
    if (args.destination) {
      trips = trips.filter((t) => t.destination.toLowerCase().includes(args.destination!.toLowerCase()));
    }
    if (args.startTime) {
      trips = trips.filter((t) => {
        // e.g. "16:10:00" >= "08:00" is a string match that holds correctly in ISO syntax
        const parsedNode = t.departureTime.slice(0, 5); // "16:10"
        return parsedNode >= args.startTime!;
      });
    }

    // Attach real-time seating configuration
    const augmentedTrips = await Promise.all(
      trips.map(async (trip) => {
        // Find capacity rules
        const capacity = trip.availableSeats + trip.bookedPassengers > 0
          ? trip.availableSeats + trip.bookedPassengers
          : 14;

        // Find how many seats are booked for today
        const booked = await getActiveSeatCount(ctx, trip._id, args.clientToday);
        const remaining = Math.max(0, capacity - booked);

        return {
          ...trip,
          todayAvailability: {
            date: args.clientToday,
            booked,
            remaining,
            capacity,
            isFull: remaining === 0,
          },
        };
      })
    );

    // If a trip is completely full, we could exclude it or just let UI grey it out.
    // UI greying out is better UX. Sort non-full first.
    return augmentedTrips.sort((a, b) => {
      if (a.todayAvailability.isFull && !b.todayAvailability.isFull) return 1;
      if (!a.todayAvailability.isFull && b.todayAvailability.isFull) return -1;
      return a.departureTime.localeCompare(b.departureTime); // Standard chronological sort
    });
  },
});

// -------
// Get highest-demand suggested trips (or fallback randomly)
// -------
export const getPopularTrips = query({
  args: { clientToday: v.string() },
  handler: async (ctx, args) => {
    // 1. Fetch valid trips
    const allTrips = await ctx.db.query("trips").collect();
    let validTrips = allTrips.filter((t) => t.status !== "cancelled" && t.status !== "completed");

    // 2. Sort by highest booked passengers natively
    validTrips.sort((a, b) => b.bookedPassengers - a.bookedPassengers);

    // 3. Extract the top 6 routes securely
    let topTrips = validTrips.slice(0, 6);

    // 4. In a barren scenario (zero bookings globally), fallback by shuffling using a standard random simulation
    if (topTrips.length > 0 && topTrips[0].bookedPassengers === 0) {
      topTrips = validTrips.sort(() => 0.5 - Math.random()).slice(0, 6); // standard pseudo shuffle fallback
    }

    // 5. Annotate real-time accurate counts explicitly
    return await Promise.all(
      topTrips.map(async (trip) => {
        const capacity = trip.availableSeats + trip.bookedPassengers > 0
          ? trip.availableSeats + trip.bookedPassengers
          : 14;
        
        const booked = await getActiveSeatCount(ctx, trip._id, args.clientToday);
        const remaining = Math.max(0, capacity - booked);

        return {
          ...trip,
          todayAvailability: {
            date: args.clientToday,
            booked,
            remaining,
            capacity,
            isFull: remaining === 0,
          },
        };
      })
    );
  },
});

// -------
// Get trips visible to drivers (bookedPassengers >= threshold)
// -------
export const getDriverVisibleTrips = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("trips")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .filter((q) => q.gte(q.field("bookedPassengers"), THRESHOLD))
      .collect();
  },
});

// -------
// Get a single trip by ID
// -------
export const getTripById = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.tripId);
  },
});

// -------
// Create a trip (Admin only)
// -------
export const createTrip = mutation({
  args: {
    origin: v.string(),
    destination: v.string(),
    departureTime: v.string(),
    availableSeats: v.number(),
    pricePerSeat: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("trips", {
      ...args,
      bookedPassengers: 0,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  },
});

// -------
// Batch Upload Trips (Admin only)
// -------
export const uploadTrips = mutation({
  args: {
    trips: v.array(
      v.object({
        tripCode: v.string(),
        origin: v.string(),
        destination: v.string(),
        departureTime: v.string(),
        endTime: v.optional(v.string()),
        availableSeats: v.number(),
        pricePerSeat: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let adminId = undefined;
    
    if (identity) {
      const appUser = await ctx.db
        .query("appUsers")
        .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();
      adminId = appUser?._id;
    }

    let inserted = 0;
    let skipped = 0;

    for (const trip of args.trips) {
      // Duplicate check 1: by tripCode
      const existingByCode = await ctx.db
        .query("trips")
        .withIndex("by_tripCode", (q) => q.eq("tripCode", trip.tripCode))
        .first();

      if (existingByCode) {
        skipped++;
        continue;
      }

      // Duplicate check 2: by origin + destination + departureTime
      const allMatchingTrips = await ctx.db
        .query("trips")
        .filter((q) =>
          q.and(
            q.eq(q.field("origin"), trip.origin),
            q.eq(q.field("destination"), trip.destination),
            q.eq(q.field("departureTime"), trip.departureTime)
          )
        )
        .first();

      if (allMatchingTrips) {
        skipped++;
        continue;
      }

      await ctx.db.insert("trips", {
        ...trip,
        bookedPassengers: 0,
        status: "pending",
        createdBy: adminId,
        createdAt: new Date().toISOString(),
      });
      inserted++;
    }

    return { success: true, count: inserted, skipped };
  },
});

// -------
// Driver accepts a trip
// -------
export const acceptTrip = mutation({
  args: {
    tripId: v.id("trips"),
    driverId: v.id("appUsers"),

  },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");
    if (trip.status !== "available") {
      throw new Error("Trip is no longer available");
    }
    if (trip.bookedPassengers < THRESHOLD) {
      throw new Error("Trip does not have enough passengers yet");
    }

    await ctx.db.patch(args.tripId, {
      status: "assigned",
      driverId: args.driverId,
    });

    return { success: true };
  },
});

// -------
// Update trip status (Admin)
// -------
export const updateTripStatus = mutation({
  args: {
    tripId: v.id("trips"),
    status: v.union(
      v.literal("pending"),
      v.literal("available"),
      v.literal("assigned"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tripId, { status: args.status });
    return { success: true };
  },
});

import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// ---------------------------------------------------------------------------
// Guard: verify caller is an admin
// ---------------------------------------------------------------------------
async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) throw new Error("Not authenticated");

  const appUser = await ctx.db
    .query("appUsers")
    .withIndex("by_userId", (q) => q.eq("userId", authUserId as Id<"users">))
    .unique();

  if (!appUser || appUser.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return appUser;
}

// ---------------------------------------------------------------------------
// getDashboardStats
// ---------------------------------------------------------------------------
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [assigned, pending, available, completed, cancelled] =
      await Promise.all([
        ctx.db.query("trips").withIndex("by_status", (q) => q.eq("status", "assigned")).collect(),
        ctx.db.query("trips").withIndex("by_status", (q) => q.eq("status", "pending")).collect(),
        ctx.db.query("trips").withIndex("by_status", (q) => q.eq("status", "available")).collect(),
        ctx.db.query("trips").withIndex("by_status", (q) => q.eq("status", "completed")).collect(),
        ctx.db.query("trips").withIndex("by_status", (q) => q.eq("status", "cancelled")).collect(),
      ]);

    const [onlineDrivers, pendingBookings] = await Promise.all([
      ctx.db.query("drivers").withIndex("by_availability", (q) => q.eq("isAvailable", true)).collect(),
      ctx.db.query("bookings").withIndex("by_status", (q) => q.eq("status", "pending")).collect(),
    ]);

    const totalResolved = completed.length + cancelled.length;
    const rate = totalResolved > 0
      ? ((completed.length / totalResolved) * 100).toFixed(1)
      : "100.0";

    return {
      activeTrips: assigned.length,
      onlineDrivers: onlineDrivers.length,
      pendingBookings: pendingBookings.length,
      completionRate: `${rate}%`,
      totalTrips: assigned.length + pending.length + available.length + completed.length,
    };
  },
});

// ---------------------------------------------------------------------------
// getAdminTrips — full listing with filters, search, dynamic seat counts
// ---------------------------------------------------------------------------
export const getAdminTrips = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("available"),
        v.literal("assigned"),
        v.literal("completed"),
        v.literal("cancelled")
      )
    ),
    origin: v.optional(v.string()),
    destination: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // 1. Fetch trips — use index if status filter provided
    let trips;
    if (args.status) {
      trips = await ctx.db
        .query("trips")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      trips = await ctx.db.query("trips").order("desc").collect();
    }

    // 2. Apply origin filter
    if (args.origin) {
      const lower = args.origin.toLowerCase();
      trips = trips.filter((t) => t.origin.toLowerCase().includes(lower));
    }

    // 3. Apply destination filter
    if (args.destination) {
      const lower = args.destination.toLowerCase();
      trips = trips.filter((t) => t.destination.toLowerCase().includes(lower));
    }

    // 4. Apply search (matches tripCode, origin, or destination)
    if (args.search) {
      const lower = args.search.toLowerCase();
      trips = trips.filter(
        (t) =>
          (t.tripCode?.toLowerCase().includes(lower) ?? false) ||
          t.origin.toLowerCase().includes(lower) ||
          t.destination.toLowerCase().includes(lower)
      );
    }

    // 5. Aggregate: batch-join dynamic booked counts from confirmed bookings
    const allConfirmedBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "confirmed"))
      .collect();

    // Build a map: tripId → total booked seats
    const bookedByTrip: Record<string, number> = {};
    for (const b of allConfirmedBookings) {
      const tid = b.tripId as string;
      bookedByTrip[tid] = (bookedByTrip[tid] || 0) + b.seatsBooked;
    }

    // Under-review & pending bookings also hold seats
    const pendingReviewBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    const underReviewBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "under_review"))
      .collect();

    const heldByTrip: Record<string, number> = {};
    for (const b of [...pendingReviewBookings, ...underReviewBookings]) {
      const tid = b.tripId as string;
      heldByTrip[tid] = (heldByTrip[tid] || 0) + b.seatsBooked;
    }

    // 6. Augment trips with dynamic data
    const augmented = trips.map((trip) => {
      const totalCapacity = trip.availableSeats + trip.bookedPassengers;
      const dynamicBooked = bookedByTrip[trip._id as string] || 0;
      const dynamicHeld = heldByTrip[trip._id as string] || 0;
      const dynamicAvailable = Math.max(0, totalCapacity - dynamicBooked - dynamicHeld);
      const isFull = dynamicAvailable === 0 && totalCapacity > 0;
      const occupancyPct = totalCapacity > 0 ? Math.round(((dynamicBooked + dynamicHeld) / totalCapacity) * 100) : 0;

      // Derive display status
      let displayStatus: string;
      if (isFull) {
        displayStatus = "full";
      } else if (trip.status === "cancelled") {
        displayStatus = "inactive";
      } else if (trip.status === "available" || trip.status === "assigned") {
        displayStatus = "active";
      } else {
        displayStatus = trip.status; // pending, completed
      }

      return {
        ...trip,
        totalCapacity,
        dynamicBooked,
        dynamicHeld,
        dynamicAvailable,
        isFull,
        occupancyPct,
        displayStatus,
      };
    });

    // 7. Sort: active/pending first, then by departure time
    augmented.sort((a, b) => {
      const priority: Record<string, number> = { active: 0, full: 1, pending: 2, completed: 3, inactive: 4 };
      const pA = priority[a.displayStatus] ?? 5;
      const pB = priority[b.displayStatus] ?? 5;
      if (pA !== pB) return pA - pB;
      return a.departureTime.localeCompare(b.departureTime);
    });

    return augmented;
  },
});

// ---------------------------------------------------------------------------
// getTripStats — aggregate counts for the stats cards
// ---------------------------------------------------------------------------
export const getTripStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const allTrips = await ctx.db.query("trips").collect();

    // Count confirmed bookings per trip for "full" detection
    const confirmedBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "confirmed"))
      .collect();

    const bookedByTrip: Record<string, number> = {};
    for (const b of confirmedBookings) {
      const tid = b.tripId as string;
      bookedByTrip[tid] = (bookedByTrip[tid] || 0) + b.seatsBooked;
    }

    let active = 0;
    let inactive = 0;
    let full = 0;
    let pending = 0;
    let assigned = 0;
    let completed = 0;

    for (const trip of allTrips) {
      const capacity = trip.availableSeats + trip.bookedPassengers;
      const booked = bookedByTrip[trip._id as string] || 0;
      const isFull = capacity > 0 && booked >= capacity;

      if (isFull) {
        full++;
      }

      switch (trip.status) {
        case "available":
          active++;
          break;
        case "assigned":
          assigned++;
          break;
        case "cancelled":
          inactive++;
          break;
        case "pending":
          pending++;
          break;
        case "completed":
          completed++;
          break;
      }
    }

    return {
      total: allTrips.length,
      active,
      inactive,
      full,
      pending,
      assigned,
      completed,
    };
  },
});

// ---------------------------------------------------------------------------
// updateTrip — admin partial update for trip fields
// ---------------------------------------------------------------------------
export const updateTrip = mutation({
  args: {
    tripId: v.id("trips"),
    origin: v.optional(v.string()),
    destination: v.optional(v.string()),
    departureTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    availableSeats: v.optional(v.number()),
    pricePerSeat: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("available"),
        v.literal("assigned"),
        v.literal("completed"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");

    const { tripId, ...updates } = args;

    // Build patch object — only include defined fields
    const patch: Record<string, any> = {};
    if (updates.origin !== undefined) patch.origin = updates.origin;
    if (updates.destination !== undefined) patch.destination = updates.destination;
    if (updates.departureTime !== undefined) patch.departureTime = updates.departureTime;
    if (updates.endTime !== undefined) patch.endTime = updates.endTime;
    if (updates.availableSeats !== undefined) {
      patch.availableSeats = updates.availableSeats;
      // Recalculate bookedPassengers if capacity changes
      // Keep bookedPassengers as-is; only availableSeats changes
    }
    if (updates.pricePerSeat !== undefined) patch.pricePerSeat = updates.pricePerSeat;
    if (updates.status !== undefined) patch.status = updates.status;

    if (Object.keys(patch).length === 0) {
      return { success: true, message: "No changes applied" };
    }

    await ctx.db.patch(args.tripId, patch);
    return { success: true };
  },
});

// ---------------------------------------------------------------------------
// getRecentTrips — last 20, with driver info joined
// ---------------------------------------------------------------------------
export const getRecentTrips = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const trips = await ctx.db.query("trips").order("desc").take(20);
    
    return await Promise.all(
      trips.map(async (trip) => {
        // --- Dynamic Passenger Count ---
        const confirmedBookings = await ctx.db
          .query("bookings")
          .withIndex("by_trip", (q) => q.eq("tripId", trip._id))
          .filter((q) => q.eq(q.field("status"), "confirmed"))
          .collect();
        
        const dynamicBookedCount = confirmedBookings.reduce((sum, b) => sum + b.seatsBooked, 0);

        let driverName: string | null = null;
        let driverVehicle: string | null = null;

        if (trip.driverId) {
          const driverUser = await ctx.db.get(trip.driverId);
          if (driverUser && "name" in driverUser) driverName = driverUser.name;

          const profile = await ctx.db
            .query("drivers")
            .withIndex("by_user", (q) => q.eq("userId", trip.driverId!))
            .first();
          if (profile) {
            driverVehicle = [profile.vehicleMake, profile.vehiclePlate]
              .filter(Boolean)
              .join(" #") || null;
          }
        }

        return {
          ...trip,
          bookedPassengers: dynamicBookedCount, // Override with dynamic count
          driverName,
          driverVehicle: driverVehicle || (trip.vehiclePlate ? `#${trip.vehiclePlate}` : null),
          totalCapacity: trip.availableSeats + trip.bookedPassengers,
        };
      }),
    );
  },
});

// ---------------------------------------------------------------------------
// deleteTrip — cancel if bookings exist, else hard-delete
// ---------------------------------------------------------------------------
export const deleteTrip = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .take(1);

    if (bookings.length > 0) {
      await ctx.db.patch(args.tripId, { status: "cancelled" });
      return { action: "cancelled" as const };
    }

    await ctx.db.delete(args.tripId);
    return { action: "deleted" as const };
  },
});

// ---------------------------------------------------------------------------
// createSingleTrip — Quick Manual Add from admin dashboard
// ---------------------------------------------------------------------------
export const createSingleTrip = mutation({
  args: {
    routeName: v.string(),
    price: v.number(),
    capacity: v.number(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    let origin = args.routeName.trim();
    let destination = args.routeName.trim();

    const arrowMatch = args.routeName.match(/^(.+?)\s*(?:→|->)\s*(.+)$/);
    if (arrowMatch) {
      origin = arrowMatch[1].trim();
      destination = arrowMatch[2].trim();
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const tripCode = `TRP-${code}`;

    const departure = new Date();
    departure.setHours(departure.getHours() + 1, 0, 0, 0);

    const id = await ctx.db.insert("trips", {
      tripCode,
      origin,
      destination,
      departureTime: departure.toISOString(),
      availableSeats: args.capacity,
      bookedPassengers: 0,
      pricePerSeat: args.price,
      status: "pending",
      createdBy: admin._id,
      createdAt: new Date().toISOString(),
    });

    return { tripId: id, tripCode };
  },
});

// ---------------------------------------------------------------------------
// getTripDetail — single trip with passengers + driver profile
// ---------------------------------------------------------------------------
export const getTripDetail = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");

    // --- Join driver info ---
    let driverName: string | null = null;
    let driverAvatarUrl: string | null = null;
    let driverVehicle: string | null = null;
    let driverVehicleModel: string | null = null;
    let driverRating: number | null = null;
    let driverTotalTrips: number | null = null;
    let driverIsOnline = false;

    if (trip.driverId) {
      const driverUser = await ctx.db.get(trip.driverId);
      if (driverUser) {
        driverName = driverUser.name;
        driverAvatarUrl = driverUser.avatarUrl ?? null;
      }

      const profile = await ctx.db
        .query("drivers")
        .withIndex("by_user", (q) => q.eq("userId", trip.driverId!))
        .first();
      if (profile) {
        driverVehicle = profile.vehiclePlate ? `#${profile.vehiclePlate}` : null;
        driverVehicleModel = [profile.vehicleMake, profile.vehicleModel].filter(Boolean).join(" ") || null;
        driverRating = profile.rating ?? null;
        driverTotalTrips = profile.totalTrips;
        driverIsOnline = profile.isAvailable;
      }
    }

    // --- Join bookings with user info ---
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();

    const passengers = await Promise.all(
      bookings.map(async (booking) => {
        const user = await ctx.db.get(booking.userId);
        const days = await ctx.db
          .query("bookingDays")
          .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
          .collect();

        const activeDays = days.filter((d) => d.status === "active").map((d) => d.date);

        return {
          bookingId: booking._id,
          userName: user?.name ?? "Unknown",
          userPhone: user?.phone ?? null,
          userEmail: user?.email ?? null,
          paymentMethod: booking.paymentMethod,
          paymentStatus: booking.paymentStatus,
          bookingStatus: booking.status,
          seatsBooked: booking.seatsBooked,
          totalAmount: booking.totalAmount,
          bookedDates: activeDays,
          daysCount: activeDays.length,
          weekStartDate: booking.weekStartDate,
        };
      }),
    );

    const dynamicBookedCount = passengers
      .filter((p) => p.bookingStatus === "confirmed")
      .reduce((sum, p) => sum + p.seatsBooked, 0);

    const totalCapacity = trip.availableSeats + trip.bookedPassengers;

    return {
      ...trip,
      bookedPassengers: dynamicBookedCount, // Dynamic count
      totalCapacity,
      driver: trip.driverId
        ? {
            name: driverName,
            avatarUrl: driverAvatarUrl,
            vehicle: driverVehicle,
            vehicleModel: driverVehicleModel,
            rating: driverRating,
            totalTrips: driverTotalTrips,
            isOnline: driverIsOnline,
          }
        : null,
      passengers,
    };
  },
});

// ---------------------------------------------------------------------------
// updateTripStatus — admin status transition
// ---------------------------------------------------------------------------
export const updateTripStatus = mutation({
  args: {
    tripId: v.id("trips"),
    status: v.union(
      v.literal("pending"),
      v.literal("available"),
      v.literal("assigned"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");

    await ctx.db.patch(args.tripId, { status: args.status });
    return { success: true };
  },
});

// ---------------------------------------------------------------------------
// cancelBookingAdmin — admin cancels a passenger's booking
// ---------------------------------------------------------------------------
export const cancelBookingAdmin = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status === "cancelled") throw new Error("Already cancelled");

    await ctx.db.patch(args.bookingId, { status: "cancelled" });

    // Restore seats on the trip
    const trip = await ctx.db.get(booking.tripId);
    if (trip) {
      await ctx.db.patch(booking.tripId, {
        bookedPassengers: Math.max(0, trip.bookedPassengers - booking.seatsBooked),
        availableSeats: trip.availableSeats + booking.seatsBooked,
      });
    }

    return { success: true };
  },
});

// ---------------------------------------------------------------------------
// getBookingStats — high level counts for the tab
// ---------------------------------------------------------------------------
export const getBookingStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [total, active, cancelled, underReview, pending] = await Promise.all([
      ctx.db.query("bookings").collect(),
      ctx.db.query("bookings").withIndex("by_status", (q) => q.eq("status", "confirmed")).collect(),
      ctx.db.query("bookings").withIndex("by_status", (q) => q.eq("status", "cancelled")).collect(),
      ctx.db.query("bookings").withIndex("by_status", (q) => q.eq("status", "under_review")).collect(),
      ctx.db.query("bookings").withIndex("by_status", (q) => q.eq("status", "pending")).collect(),
    ]);

    // Calculate "Most Popular Route" (simplified: route with most bookings)
    const tripCounts: Record<string, number> = {};
    active.forEach(b => {
      const tid = b.tripId as string;
      tripCounts[tid] = (tripCounts[tid] || 0) + 1;
    });

    let popularTripId: string | null = null;
    let maxCount = 0;
    for (const [id, count] of Object.entries(tripCounts)) {
      if (count > maxCount) {
        maxCount = count;
        popularTripId = id;
      }
    }

    let popularRoute = "N/A";
    if (popularTripId) {
      const trip = await ctx.db.get(popularTripId as Id<"trips">);
      if (trip) popularRoute = `${trip.origin} → ${trip.destination}`;
    }

    return {
      total: total.length,
      active: active.length,
      cancelled: cancelled.length,
      underReview: underReview.length,
      pending: pending.length,
      popularRoute,
      popularRouteCount: maxCount,
    };
  },
});

// ---------------------------------------------------------------------------
// getAdminBookings — filtered/searched list for the table
// ---------------------------------------------------------------------------
export const getAdminBookings = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("under_review"), v.literal("confirmed"), v.literal("cancelled"))),
    paymentStatus: v.optional(v.union(v.literal("pending"), v.literal("under_review"), v.literal("paid"), v.literal("failed"))),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let bookingsQuery;
    if (args.status) {
      bookingsQuery = ctx.db.query("bookings").withIndex("by_status", (q) => q.eq("status", args.status!));
    } else {
      bookingsQuery = ctx.db.query("bookings");
    }

    const allBookings = await bookingsQuery.order("desc").collect();

    const results = [];
    for (const booking of allBookings) {
      // Manual join and filtered logic for demo scale
      const [user, trip] = await Promise.all([
        ctx.db.get(booking.userId),
        ctx.db.get(booking.tripId),
      ]);

      if (!user || !trip) continue;

      // Filter by paymentStatus if provided
      if (args.paymentStatus && booking.paymentStatus !== args.paymentStatus) continue;

      // Filter by search string
      if (args.search) {
        const s = args.search.toLowerCase();
        const match = 
          user.name.toLowerCase().includes(s) ||
          user.email.toLowerCase().includes(s) ||
          (user.phone && user.phone.includes(s)) ||
          (trip.tripCode && trip.tripCode.toLowerCase().includes(s)) ||
          trip.origin.toLowerCase().includes(s) ||
          trip.destination.toLowerCase().includes(s);
        
        if (!match) continue;
      }

      results.push({
        ...booking,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone,
        userAvatarUrl: user.avatarUrl,
        tripCode: trip.tripCode,
        origin: trip.origin,
        destination: trip.destination,
        departureTime: trip.departureTime,
      });
    }

    return results;
  },
});

// ---------------------------------------------------------------------------
// getAdminBookingDetail — detailed view for the drawer
// ---------------------------------------------------------------------------
export const getAdminBookingDetail = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");

    const [user, trip, bookingDays] = await Promise.all([
      ctx.db.get(booking.userId),
      ctx.db.get(booking.tripId),
      ctx.db.query("bookingDays").withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId)).collect(),
    ]);

    return {
      ...booking,
      user,
      trip,
      bookingDays,
    };
  },
});

// ---------------------------------------------------------------------------
// updateBookingStatusAdmin — set to completed or cancelled
// ---------------------------------------------------------------------------
export const updateBookingStatusAdmin = mutation({
  args: {
    bookingId: v.id("bookings"),
    status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("cancelled")),
    paymentStatus: v.optional(v.union(v.literal("pending"), v.literal("paid"), v.literal("failed"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");

    // ========================================================================
    // CRITICAL GUARD: InstaPay bookings MUST go through verifyInstaPayPayment.
    // Direct status changes via this mutation are NOT allowed for InstaPay.
    // ========================================================================
    if (booking.paymentMethod === "instapay") {
      throw new Error(
        "InstaPay bookings cannot be modified directly. " +
        "Please use the InstaPay Verification panel to approve or reject payment proof."
      );
    }

    const patches: any = { status: args.status };
    if (args.paymentStatus) patches.paymentStatus = args.paymentStatus;

    await ctx.db.patch(args.bookingId, patches);

    // If transitioned TO cancelled, restore seats
    if (args.status === "cancelled" && booking.status !== "cancelled") {
      const trip = await ctx.db.get(booking.tripId);
      if (trip) {
        await ctx.db.patch(booking.tripId, {
          bookedPassengers: Math.max(0, trip.bookedPassengers - booking.seatsBooked),
          availableSeats: trip.availableSeats + booking.seatsBooked,
        });
      }
    } 
    // If transitioned FROM cancelled TO confirmed, subtract seats
    else if (args.status === "confirmed" && booking.status === "cancelled") {
      const trip = await ctx.db.get(booking.tripId);
      if (trip) {
          if (trip.availableSeats < booking.seatsBooked) {
              throw new Error("Cannot re-confirm: Not enough seats available on trip");
          }
        await ctx.db.patch(booking.tripId, {
          bookedPassengers: trip.bookedPassengers + booking.seatsBooked,
          availableSeats: trip.availableSeats - booking.seatsBooked,
        });
      }
    }

    return { success: true };
  },
});

// ---------------------------------------------------------------------------
// deleteAllTrips — DESTRUCTIVE: wipe all trips + related bookings, days, payments
// ---------------------------------------------------------------------------
export const deleteAllTrips = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const BATCH = 500;
    let totalDeleted = 0;

    // 1. Delete all bookingDays
    const days = await ctx.db.query("bookingDays").take(BATCH);
    for (const d of days) {
      await ctx.db.delete(d._id);
      totalDeleted++;
    }

    // 2. Delete all bookings
    const bookings = await ctx.db.query("bookings").take(BATCH);
    for (const b of bookings) {
      await ctx.db.delete(b._id);
      totalDeleted++;
    }

    // 3. Delete all paymentHistory
    const payments = await ctx.db.query("paymentHistory").take(BATCH);
    for (const p of payments) {
      await ctx.db.delete(p._id);
      totalDeleted++;
    }

    // 4. Delete all trips
    const trips = await ctx.db.query("trips").take(BATCH);
    for (const t of trips) {
      await ctx.db.delete(t._id);
      totalDeleted++;
    }

    // Check if there's still more to delete
    const remaining =
      (await ctx.db.query("bookingDays").take(1)).length +
      (await ctx.db.query("bookings").take(1)).length +
      (await ctx.db.query("paymentHistory").take(1)).length +
      (await ctx.db.query("trips").take(1)).length;

    return {
      deleted: totalDeleted,
      done: remaining === 0,
    };
  },
});

// Admin Query: Get all drivers to manage their verification status
export const getAdminDrivers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    
    const drivers = await ctx.db.query("drivers").order("desc").collect();
    
    // Enrich with appUser info (names, emails)
    return await Promise.all(
      drivers.map(async (driver: any) => {
        const user = await ctx.db.get(driver.userId);
        return {
          ...driver,
          userName: user?.name ?? "Unknown",
          userEmail: user?.email ?? "Unknown",
          userAvatar: user?.avatarUrl,
        };
      })
    );
  },
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// -------
// Get bookings for a user
// -------
export const getUserBookings = query({
  args: { userId: v.id("appUsers") },

  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// -------
// Get my upcoming trips (DYNAMIC CUSTOMER DASHBOARD)
// -------
export const getMyUpcomingTrips = query({
  args: { clientToday: v.string() }, // local ISO date e.g., "2026-04-07"
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) return [];

    const appUser = await ctx.db
      .query("appUsers")
      .withIndex("by_userId", (q) => q.eq("userId", authUserId as Id<"users">))
      .unique();

    if (!appUser) return [];

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", appUser._id))
      .filter((q) => q.or(
        q.eq(q.field("status"), "confirmed"),
        q.eq(q.field("status"), "pending"),
        q.eq(q.field("status"), "under_review")
      ))
      .order("desc")
      .collect();

    const upcoming = [];

    for (const booking of bookings) {
      const trip = await ctx.db.get(booking.tripId);
      if (!trip || trip.status === "cancelled") continue;

      // Query active bookingDays to see if any are >= clientToday
      const activeDays = await ctx.db
        .query("bookingDays")
        .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
        .collect();

      const futureDays = activeDays
        .filter((d) => d.status === "active" && d.date >= args.clientToday)
        .map((d) => d.date)
        .sort();

      if (futureDays.length > 0) {
        const nextDate = futureDays[0];
        
        let minutesUntil = -1;
        // Basic calculation of minutes until
        if (nextDate === args.clientToday) {
          const nowStr = new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: "Africa/Cairo" }); 
          const depStr = trip.departureTime.split(":");
          const nowParts = nowStr.split(":");
          
          if (depStr.length >= 2 && nowParts.length >= 2) {
             const depMins = parseInt(depStr[0]) * 60 + parseInt(depStr[1]);
             const nowMins = parseInt(nowParts[0]) * 60 + parseInt(nowParts[1]);
             minutesUntil = depMins - nowMins;
          }
        }

        upcoming.push({
          bookingId: booking._id,
          tripId: trip._id,
          tripCode: trip.tripCode ?? `${trip.origin} → ${trip.destination}`,
          origin: trip.origin,
          destination: trip.destination,
          departureTime: trip.departureTime,
          pricePerSeat: trip.pricePerSeat,
          nextDate,
          futureDaysCount: futureDays.length,
          allBookedDates: activeDays.filter((d) => d.status === "active").map(d => d.date),
          minutesUntil,
        });
      }
    }

    // Sort by nearest upcoming date + time
    upcoming.sort((a, b) => {
      if (a.nextDate !== b.nextDate) return a.nextDate.localeCompare(b.nextDate);
      return a.departureTime.localeCompare(b.departureTime);
    });

    return upcoming;
  },
});

// -------
// Get bookings for a trip
// -------
export const getTripBookings = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
  },
});

// -------
// Create a booking
// -------
export const createBooking = mutation({
  args: {
    tripId: v.id("trips"),
    userId: v.id("appUsers"),

    seatsBooked: v.number(),
    paymentMethod: v.union(v.literal("cash"), v.literal("card")),
  },
  handler: async (ctx, args) => {
    // Verify trip exists and has enough seats
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");
    if (trip.status === "cancelled") throw new Error("Trip is cancelled");
    if (trip.availableSeats < args.seatsBooked) {
      throw new Error("Not enough seats available");
    }

    const totalAmount = args.seatsBooked * trip.pricePerSeat;

    // Create booking
    const bookingId = await ctx.db.insert("bookings", {
      tripId: args.tripId,
      userId: args.userId,
      seatsBooked: args.seatsBooked,
      paymentMethod: args.paymentMethod,
      paymentStatus: "pending",
      status: "pending",
      totalAmount,
      createdAt: new Date().toISOString(),
    });

    // Update trip seat count and bookedPassengers
    const newBooked = trip.bookedPassengers + args.seatsBooked;
    const newAvailable = trip.availableSeats - args.seatsBooked;
    const newStatus = newBooked >= 8 && trip.status === "pending"
      ? "available"
      : trip.status;

    await ctx.db.patch(args.tripId, {
      bookedPassengers: newBooked,
      availableSeats: newAvailable,
      status: newStatus,
    });

    return { bookingId, totalAmount };
  },
});

// -------
// Cancel a booking
// -------
export const cancelBooking = mutation({
  args: { bookingId: v.id("bookings"), userId: v.id("appUsers") },

  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.userId !== args.userId) throw new Error("Unauthorized");
    if (booking.status === "cancelled") throw new Error("Already cancelled");

    await ctx.db.patch(args.bookingId, { status: "cancelled" });

    // Restore seats on the trip
    const trip = await ctx.db.get(booking.tripId);
    if (trip) {
      await ctx.db.patch(booking.tripId, {
        bookedPassengers: trip.bookedPassengers - booking.seatsBooked,
        availableSeats: trip.availableSeats + booking.seatsBooked,
      });
    }

    return { success: true };
  },
});

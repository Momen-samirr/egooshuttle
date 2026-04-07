import { query, mutation, internalMutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

const DEFAULT_CAPACITY = 14;

// ============================================================================
// WeekManagerService — working-week math (Sun=0 → Thu=4)
// ============================================================================

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().split("T")[0];
}

function getNextWeekStart(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().split("T")[0];
}

function getPrevWeekStart(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().split("T")[0];
}

/** Returns the ISO UTC date for today if no client date is provided. */
function serverTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/** Working days: Sunday(0) → Thursday(4). Friday/Saturday are off. */
function isWorkingDay(dateStr: string): boolean {
  const day = new Date(dateStr + "T00:00:00Z").getUTCDay();
  return day >= 0 && day <= 4;
}

function dayName(dateStr: string): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    new Date(dateStr + "T00:00:00Z").getUTCDay()
  ];
}

/** Returns the 5 working-day date strings for a given week (Sunday base). */
function workingDaysForWeek(weekStart: string): string[] {
  const days: string[] = [];
  const base = new Date(weekStart + "T00:00:00Z");
  for (let i = 0; i <= 4; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

/**
 * Given a day-pattern (array of weekday indices 0–4) and a weekStart (ISO Sunday),
 * returns the concrete date strings for that pattern in that week.
 */
function datesForPattern(weekStart: string, pattern: number[]): string[] {
  const base = new Date(weekStart + "T00:00:00Z");
  return pattern.map((idx) => {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + idx);
    return d.toISOString().split("T")[0];
  });
}

/** Validates that all selected days are valid working days in the same week. Returns weekStart. */
function validateWorkingWeek(selectedDays: string[], today: string): string {
  const weekStart = getWeekStart(selectedDays[0]);
  for (const date of selectedDays) {
    if (getWeekStart(date) !== weekStart) {
      throw new Error("All days must be within the same working week (Sun–Thu).");
    }
    if (!isWorkingDay(date)) {
      throw new Error(
        `${date} (${dayName(date)}) is not a working day. Only Sunday–Thursday are allowed.`
      );
    }
    if (date < today) {
      throw new Error(`Cannot book past date ${date} (${dayName(date)}).`);
    }
  }
  return weekStart;
}

// ============================================================================
// Auth helper
// ============================================================================
async function getAppUser(ctx: QueryCtx | MutationCtx) {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) return null;
  return await ctx.db
    .query("appUsers")
    .withIndex("by_userId", (q) => q.eq("userId", authUserId as Id<"users">))
    .unique();
}

// ============================================================================
// AvailabilityService — count active bookingDays for a trip+date
// ============================================================================
export async function getActiveSeatCount(
  ctx: QueryCtx | MutationCtx,
  tripId: Id<"trips">,
  date: string
): Promise<number> {
  const rows = await ctx.db
    .query("bookingDays")
    .withIndex("by_trip_date", (q) => q.eq("tripId", tripId).eq("date", date))
    .collect();

  let count = 0;
  const now = Date.now();

  for (const row of rows) {
    if (row.status === "active") {
      count++;
      continue;
    }

    if (row.status === "reserved") {
      const booking = await ctx.db.get(row.bookingId);
      if (booking) {
        if (booking.status === "under_review") {
          // If InstaPay is under review, the seat is held until Admin approves/rejects
          count++;
        } else if (booking.status === "pending") {
          // Find the most recent payment intent for this booking
          const intent = await ctx.db
             .query("paymentHistory")
             .withIndex("by_user", (q) => q.eq("userId", booking.userId))
             .filter((q) => q.eq(q.field("tripId"), tripId))
             .order("desc")
             .first();
          
          if (intent && intent.status === "pending") {
            if (intent.expiresAt) {
              if (intent.expiresAt > now) count++;
            } else {
              // Paymob intents without expiresAt are held temporarily (assume 1 hour)
              const intentAge = now - new Date(intent.createdAt).getTime();
              if (intentAge < 60 * 60 * 1000) count++;
            }
          }
        }
      }
    }
  }
  return count;
}

async function checkDayAvailability(
  ctx: MutationCtx,
  tripId: Id<"trips">,
  date: string,
  userId: Id<"appUsers">,
  capacity: number
) {
  const bookedSeats = await getActiveSeatCount(ctx, tripId, date);

  // Capacity guard
  if (bookedSeats + 1 > capacity) {
    throw new Error(
      `No seats available on ${date} (${dayName(date)}). ` +
        `${capacity - bookedSeats} remaining.`
    );
  }

  /* 
  // Duplicate guard — check parent bookings
  for (const row of active) {
    const parent = await ctx.db.get(row.bookingId);
    if (parent && parent.userId === userId) {
      throw new Error(
        `You already have a booking for ${date} (${dayName(date)}) on this trip.`
      );
    }
  }
  */
}

// ============================================================================
// getWeeklySchedule — primary query for the booking UI
// Accepts clientToday to fix timezone drift (server UTC ≠ local time)
// ============================================================================
export const getWeeklySchedule = query({
  args: {
    tripId: v.id("trips"),
    weekStartDate: v.string(),
    clientToday: v.optional(v.string()), // YYYY-MM-DD from browser local time
  },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");

    // Use client-provided today to avoid UTC vs local timezone mismatch
    const today = args.clientToday ?? serverTodayISO();

    const capacity =
      trip.availableSeats + trip.bookedPassengers > 0
        ? trip.availableSeats + trip.bookedPassengers
        : DEFAULT_CAPACITY;

    const days = workingDaysForWeek(args.weekStartDate);

    const schedule = await Promise.all(
      days.map(async (date) => {
        const booked = await getActiveSeatCount(ctx, args.tripId, date);
        const remaining = Math.max(0, capacity - booked);

        return {
          date,
          dayLabel: dayName(date),
          booked,
          remaining,
          capacity,
          isFull: remaining === 0,
          isPast: date < today,       // ← timezone-correct comparison
          isToday: date === today,
        };
      })
    );

    return {
      trip: {
        _id: trip._id,
        tripCode: trip.tripCode ?? null,
        origin: trip.origin,
        destination: trip.destination,
        departureTime: trip.departureTime,
        endTime: trip.endTime ?? null,
        pricePerSeat: trip.pricePerSeat,
        status: trip.status,
      },
      weekStartDate: args.weekStartDate,
      nextWeekStart: getNextWeekStart(args.weekStartDate),
      prevWeekStart: getPrevWeekStart(args.weekStartDate),
      currentWeekStart: getWeekStart(today),
      schedule,
    };
  },
});

// Backward-compat alias
export const getAvailabilityForTrip = query({
  args: {
    tripId: v.id("trips"),
    startDate: v.string(),
    endDate: v.string(),
    clientToday: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");

    const today = args.clientToday ?? serverTodayISO();
    const capacity =
      trip.availableSeats + trip.bookedPassengers > 0
        ? trip.availableSeats + trip.bookedPassengers
        : DEFAULT_CAPACITY;

    const dates: string[] = [];
    const start = new Date(args.startDate + "T00:00:00Z");
    const end = new Date(args.endDate + "T00:00:00Z");
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      dates.push(d.toISOString().split("T")[0]);
    }

    const result = await Promise.all(
      dates.map(async (date) => {
        const booked = await getActiveSeatCount(ctx, args.tripId, date);
        const remaining = Math.max(0, capacity - booked);
        return { date, booked, remaining, capacity, isFull: remaining === 0, isPast: date < today };
      })
    );

    return {
      trip: {
        _id: trip._id,
        tripCode: trip.tripCode,
        origin: trip.origin,
        destination: trip.destination,
        departureTime: trip.departureTime,
        endTime: trip.endTime,
        pricePerSeat: trip.pricePerSeat,
        status: trip.status,
      },
      schedule: result,
    };
  },
});

// ============================================================================
// BookingService — createMultiDayBooking (single week)
// ============================================================================
export const createMultiDayBooking = mutation({
  args: {
    tripId: v.id("trips"),
    selectedDays: v.array(v.string()),
    seatsBooked: v.number(),
    paymentMethod: v.union(v.literal("cash"), v.literal("card"), v.literal("instapay"), v.literal("wallet")),
    clientToday: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const appUser = await getAppUser(ctx);
    if (!appUser) throw new Error("Not authenticated");
    if (args.selectedDays.length === 0) throw new Error("Select at least one day");
    if (args.seatsBooked < 1) throw new Error("Must book at least 1 seat");

    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");
    if (trip.status === "cancelled") throw new Error("Trip is cancelled");

    const today = args.clientToday ?? serverTodayISO();
    const sorted = [...args.selectedDays].sort();
    const weekStartDate = validateWorkingWeek(sorted, today);

    const capacity =
      trip.availableSeats + trip.bookedPassengers > 0
        ? trip.availableSeats + trip.bookedPassengers
        : DEFAULT_CAPACITY;

    // Validate each day atomically
    for (const date of sorted) {
      await checkDayAvailability(ctx, args.tripId, date, appUser._id, capacity);
    }

    const totalAmount = trip.pricePerSeat * sorted.length * args.seatsBooked;
    const now = new Date().toISOString();

    // ======================================================================
    // WALLET PATH: Instant debit + confirm (no payment intent needed)
    // ======================================================================
    if (args.paymentMethod === "wallet") {
      if (!appUser.walletId) throw new Error("No wallet found. Please create a wallet first.");

      const wallet = await ctx.db.get(appUser.walletId);
      if (!wallet || !wallet.isActive) throw new Error("Wallet is not active");
      if (wallet.balance < totalAmount) {
        throw new Error(
          `Insufficient wallet balance. Available: EGP ${wallet.balance.toFixed(2)}, Required: EGP ${totalAmount.toFixed(2)}`
        );
      }

      // Create confirmed booking
      const bookingId = await ctx.db.insert("bookings", {
        tripId: args.tripId,
        userId: appUser._id,
        seatsBooked: args.seatsBooked,
        paymentMethod: "wallet",
        paymentStatus: "paid",
        status: "confirmed",
        totalAmount,
        selectedDays: sorted,
        weekStartDate,
        createdAt: now,
      });

      // Create active bookingDays (no "reserved" state needed)
      for (const date of sorted) {
        await ctx.db.insert("bookingDays", {
          bookingId,
          tripId: args.tripId,
          date,
          status: "active",
        });
      }

      // Debit wallet atomically
      const idempotencyKey = `wallet_booking_${bookingId}`;
      const balanceBefore = wallet.balance;
      const balanceAfter = Math.round((balanceBefore - totalAmount) * 100) / 100;

      await ctx.db.patch(appUser.walletId, {
        balance: balanceAfter,
        updatedAt: now,
      });

      const walletTxId = await ctx.db.insert("walletTransactions", {
        walletId: appUser.walletId,
        userId: appUser._id,
        type: "PAYMENT",
        amount: totalAmount,
        balanceBefore,
        balanceAfter,
        bookingId,
        description: `Trip booking: ${trip.origin} → ${trip.destination} — ${sorted.length} days — EGP ${totalAmount.toFixed(2)}`,
        idempotencyKey,
        createdAt: now,
      });

      // Link wallet transaction to booking
      await ctx.db.patch(bookingId, { walletTransactionId: walletTxId });

      return {
        paymentIntentId: null,  // No intent needed for wallet
        totalAmount,
        daysBooked: sorted.length,
        weekStartDate,
        isFullWeek: sorted.length === 5,
        walletPaid: true,
        balanceAfter,
      };
    }

    // ======================================================================
    // EXISTING PATH: Card / InstaPay / Cash — unchanged
    // ======================================================================
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes

    // Create Payment Intent
    const payload = {
      type: "single",
      selectedDays: sorted,
      seatsBooked: args.seatsBooked,
      weekStartDate,
    };

    const paymentIntentId = await ctx.db.insert("paymentHistory", {
      userId: appUser._id,
      tripId: args.tripId,
      amount: totalAmount,
      status: "pending",
      paymentMethod: args.paymentMethod,
      bookingPayload: payload,
      expiresAt: args.paymentMethod === "instapay" ? expiresAt : undefined,
      createdAt: now,
      updatedAt: now,
    });

    // Pre-provision the booking and reserve seats immediately for ALL methods
    const bookingId = await ctx.db.insert("bookings", {
      tripId: args.tripId,
      userId: appUser._id,
      seatsBooked: args.seatsBooked,
      paymentMethod: args.paymentMethod,
      paymentStatus: "pending",
      status: "pending",
      totalAmount,
      selectedDays: sorted,
      weekStartDate,
      createdAt: now,
    });

    for (const date of sorted) {
      await ctx.db.insert("bookingDays", {
        bookingId,
        tripId: args.tripId,
        date,
        status: "reserved",
      });
    }

    // Link the pre-provisioned bookingId to the payment intent for easy updates later
    await ctx.db.patch(paymentIntentId, { 
      bookingPayload: { ...payload, bookingId } 
    });

    return {
      paymentIntentId,
      totalAmount,
      daysBooked: sorted.length,
      weekStartDate,
      isFullWeek: sorted.length === 5,
    };
  },
});

// ============================================================================
// BookingService — createMultiWeekBooking
// Books the same day-pattern across N consecutive weeks.
// ============================================================================
export const createMultiWeekBooking = mutation({
  args: {
    tripId: v.id("trips"),
    dayPattern: v.array(v.number()),
    startWeekDate: v.string(),
    numberOfWeeks: v.number(),
    paymentMethod: v.union(v.literal("cash"), v.literal("card"), v.literal("instapay"), v.literal("wallet")),
    clientToday: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const appUser = await getAppUser(ctx);
    if (!appUser) throw new Error("Not authenticated");

    if (args.dayPattern.length === 0) throw new Error("Select at least one day");
    if (args.numberOfWeeks < 1 || args.numberOfWeeks > 52)
      throw new Error("Number of weeks must be between 1 and 52");

    for (const idx of args.dayPattern) {
      if (idx < 0 || idx > 4)
        throw new Error(`Invalid day index ${idx}. Only 0–4 (Sun–Thu) are valid.`);
    }

    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");
    if (trip.status === "cancelled") throw new Error("Trip is cancelled");

    const today = args.clientToday ?? serverTodayISO();
    const capacity =
      trip.availableSeats + trip.bookedPassengers > 0
        ? trip.availableSeats + trip.bookedPassengers
        : DEFAULT_CAPACITY;

    const weekPlan: Array<{ weekStart: string; dates: string[] }> = [];
    let totalFutureDays = 0;

    for (let w = 0; w < args.numberOfWeeks; w++) {
      const base = new Date(args.startWeekDate + "T00:00:00Z");
      base.setUTCDate(base.getUTCDate() + w * 7);
      const weekStart = base.toISOString().split("T")[0];

      const dates = datesForPattern(weekStart, args.dayPattern).filter(
        (d) => d >= today
      );

      weekPlan.push({ weekStart, dates });
      totalFutureDays += dates.length;
    }

    if (totalFutureDays === 0) {
      throw new Error("All selected dates are in the past. Please choose a future week.");
    }

    for (const week of weekPlan) {
      for (const date of week.dates) {
        await checkDayAvailability(ctx, args.tripId, date, appUser._id, capacity);
      }
    }

    let totalAmount = 0;
    for (const week of weekPlan) {
      totalAmount += trip.pricePerSeat * week.dates.length;
    }

    const now = new Date().toISOString();

    // ======================================================================
    // WALLET PATH: Instant debit + confirm
    // ======================================================================
    if (args.paymentMethod === "wallet") {
      if (!appUser.walletId) throw new Error("No wallet found. Please create a wallet first.");

      const wallet = await ctx.db.get(appUser.walletId);
      if (!wallet || !wallet.isActive) throw new Error("Wallet is not active");
      if (wallet.balance < totalAmount) {
        throw new Error(
          `Insufficient wallet balance. Available: EGP ${wallet.balance.toFixed(2)}, Required: EGP ${totalAmount.toFixed(2)}`
        );
      }

      const createdBookingIds: Id<"bookings">[] = [];
      for (const week of weekPlan) {
        if (week.dates.length === 0) continue;
        const weekAmount = trip.pricePerSeat * week.dates.length;

        const bookingId = await ctx.db.insert("bookings", {
          tripId: args.tripId,
          userId: appUser._id,
          seatsBooked: 1,
          paymentMethod: "wallet",
          paymentStatus: "paid",
          status: "confirmed",
          totalAmount: weekAmount,
          selectedDays: week.dates,
          weekStartDate: week.weekStart,
          createdAt: now,
        });
        createdBookingIds.push(bookingId);

        for (const date of week.dates) {
          await ctx.db.insert("bookingDays", {
            bookingId,
            tripId: args.tripId,
            date,
            status: "active",
          });
        }
      }

      // Debit wallet atomically
      const idempotencyKey = `wallet_multi_${createdBookingIds[0]}`;
      const balanceBefore = wallet.balance;
      const balanceAfter = Math.round((balanceBefore - totalAmount) * 100) / 100;

      await ctx.db.patch(appUser.walletId, {
        balance: balanceAfter,
        updatedAt: now,
      });

      const walletTxId = await ctx.db.insert("walletTransactions", {
        walletId: appUser.walletId,
        userId: appUser._id,
        type: "PAYMENT",
        amount: totalAmount,
        balanceBefore,
        balanceAfter,
        bookingId: createdBookingIds[0],
        description: `Multi-week booking: ${trip.origin} → ${trip.destination} — ${totalFutureDays} days — EGP ${totalAmount.toFixed(2)}`,
        idempotencyKey,
        createdAt: now,
      });

      // Link wallet transaction to first booking
      for (const bId of createdBookingIds) {
        await ctx.db.patch(bId, { walletTransactionId: walletTxId });
      }

      return {
        paymentIntentId: null,
        totalAmount,
        totalDays: totalFutureDays,
        totalWeeks: weekPlan.length,
        isFullWeekPattern: args.dayPattern.length === 5,
        walletPaid: true,
        balanceAfter,
      };
    }

    // ======================================================================
    // EXISTING PATH: Card / InstaPay / Cash — unchanged
    // ======================================================================
    const expiresAt = Date.now() + 30 * 60 * 1000;

    const payload = {
      type: "multi",
      weekPlan,
      seatsBooked: 1,
    };

    const paymentIntentId = await ctx.db.insert("paymentHistory", {
      userId: appUser._id,
      tripId: args.tripId,
      amount: totalAmount,
      status: "pending",
      paymentMethod: args.paymentMethod,
      bookingPayload: payload,
      expiresAt: args.paymentMethod === "instapay" ? expiresAt : undefined,
      createdAt: now,
      updatedAt: now,
    });

    const createdBookingIds: Id<"bookings">[] = [];
    for (const week of weekPlan) {
      if (week.dates.length === 0) continue;
      const weekAmount = trip.pricePerSeat * week.dates.length;
      
      const bookingId = await ctx.db.insert("bookings", {
        tripId: args.tripId,
        userId: appUser._id,
        seatsBooked: 1,
        paymentMethod: args.paymentMethod,
        paymentStatus: "pending",
        status: "pending",
        totalAmount: weekAmount,
        selectedDays: week.dates,
        weekStartDate: week.weekStart,
        createdAt: now,
      });
      createdBookingIds.push(bookingId);

      for (const date of week.dates) {
        await ctx.db.insert("bookingDays", {
          bookingId,
          tripId: args.tripId,
          date,
          status: "reserved",
        });
      }
    }

    await ctx.db.patch(paymentIntentId, { 
      bookingPayload: { ...payload, createdBookingIds } 
    });

    return {
      paymentIntentId,
      totalAmount,
      totalDays: totalFutureDays,
      totalWeeks: weekPlan.length,
      isFullWeekPattern: args.dayPattern.length === 5,
    };
  },
});

// ============================================================================
// Internal: confirmPaymentAndCreateBooking
// Called by Webhook on success
// ============================================================================
export async function executePaymentConfirmation(ctx: MutationCtx, intentId: Id<"paymentHistory">, transactionId: string) {
  const intent = await ctx.db.get(intentId);
  if (!intent || intent.status !== "pending") return;

  const payload = intent.bookingPayload as any;

  // Top-up intents don't have a tripId — they are handled by wallet.creditWallet
  if (!intent.tripId) return;
  const tripId = intent.tripId;

  const trip = await ctx.db.get(tripId);
  if (!trip || trip.status === "cancelled") {
    await ctx.db.patch(intent._id, { status: "failed", failureReason: "Trip no longer available", updatedAt: new Date().toISOString() });
    return;
  }

  const capacity = trip.availableSeats + trip.bookedPassengers > 0 
      ? trip.availableSeats + trip.bookedPassengers 
      : DEFAULT_CAPACITY;

  try {
    // Verify capacity
    if (payload.type === "single") {
      for (const date of payload.selectedDays) {
        await checkDayAvailability(ctx, tripId, date, intent.userId, capacity);
      }
      
      const bookingId = payload.bookingId;
      if (bookingId) {
        await ctx.db.patch(bookingId, { paymentStatus: "paid", status: "confirmed" });
        const days = await ctx.db
          .query("bookingDays")
          .withIndex("by_booking", (q) => q.eq("bookingId", bookingId))
          .collect();
        for (const day of days) {
          await ctx.db.patch(day._id, { status: "active" });
        }
      }
    } else if (payload.type === "multi") {
      for (const week of payload.weekPlan) {
        for (const date of week.dates) {
          await checkDayAvailability(ctx, tripId, date, intent.userId, capacity);
        }
      }
      
      const bookingIds: string[] = payload.createdBookingIds || [];
      for (const bookingId of bookingIds) {
        await ctx.db.patch(bookingId as Id<"bookings">, { paymentStatus: "paid", status: "confirmed" });
        const days = await ctx.db
          .query("bookingDays")
          .withIndex("by_booking", (q) => q.eq("bookingId", bookingId as Id<"bookings">))
          .collect();
        for (const day of days) {
          await ctx.db.patch(day._id, { status: "active" });
        }
      }
    }

    await ctx.db.patch(intent._id, { status: "success", transactionId: transactionId, updatedAt: new Date().toISOString() });
  } catch (e: any) {
    // Capacity filled during payment
    await ctx.db.patch(intent._id, { status: "failed", failureReason: e.message || "Capacity filled", transactionId: transactionId, updatedAt: new Date().toISOString() });
  }
}


// ============================================================================
// cancelBookingDay — cancel a single day; auto-cancels parent if all cancelled
// ============================================================================
export const cancelBookingDay = mutation({
  args: { bookingDayId: v.id("bookingDays"), clientToday: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const appUser = await getAppUser(ctx);
    if (!appUser) throw new Error("Not authenticated");

    const bookingDay = await ctx.db.get(args.bookingDayId);
    if (!bookingDay) throw new Error("Booking day not found");
    if (bookingDay.status === "cancelled") throw new Error("Already cancelled");

    const booking = await ctx.db.get(bookingDay.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.userId !== appUser._id) throw new Error("Unauthorized");

    const today = args.clientToday ?? serverTodayISO();
    if (bookingDay.date < today) {
      throw new Error("Cannot cancel a past booking day");
    }

    await ctx.db.patch(args.bookingDayId, { status: "cancelled" });

    const allDays = await ctx.db
      .query("bookingDays")
      .withIndex("by_booking", (q) => q.eq("bookingId", bookingDay.bookingId))
      .collect();

    const allCancelled = allDays.every((d) =>
      d._id === args.bookingDayId ? true : d.status === "cancelled"
    );

    if (allCancelled) {
      await ctx.db.patch(bookingDay.bookingId, { status: "cancelled" });
    }

    return { success: true };
  },
});

// ============================================================================
// getUserBookingsWithDays
// ============================================================================
export const getUserBookingsWithDays = query({
  args: {},
  handler: async (ctx) => {
    const appUser = await getAppUser(ctx);
    if (!appUser) return [];

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", appUser._id))
      .order("desc")
      .take(30);

    return await Promise.all(
      bookings.map(async (booking) => {
        const trip = await ctx.db.get(booking.tripId);
        const days = await ctx.db
          .query("bookingDays")
          .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
          .collect();

        return {
          ...booking,
          tripOrigin: trip?.origin ?? "—",
          tripDestination: trip?.destination ?? "—",
          tripCode: trip?.tripCode ?? null,
          departureTime: trip?.departureTime ?? "—",
          days: days.map((d) => ({
            _id: d._id,
            date: d.date,
            dayLabel: dayName(d.date),
            status: d.status,
          })),
        };
      })
    );
  },
});

// ============================================================================
// getUserWeekBooking — ALL of this user's booked dates for one trip+week.
// Queries bookingDays directly by [tripId, date] for each working day,
// then checks parent booking userId. Works even for bookings created before
// weekStartDate was added to the schema.
// ============================================================================
export const getUserWeekBooking = query({
  args: {
    tripId: v.id("trips"),
    weekStartDate: v.string(),
  },
  handler: async (ctx, args) => {
    const appUser = await getAppUser(ctx);
    if (!appUser) return null;

    // Get the 5 working days (Sun–Thu) for this week
    const weekDays = workingDaysForWeek(args.weekStartDate);

    // For each working day, query bookingDays by [tripId, date] and check
    // if any active row belongs to this user
    const bookedDates: string[] = [];
    let totalAmount = 0;

    for (const date of weekDays) {
      const dayRows = await ctx.db
        .query("bookingDays")
        .withIndex("by_trip_date", (q) =>
          q.eq("tripId", args.tripId).eq("date", date)
        )
        .collect();

      for (const row of dayRows) {
        if (row.status !== "active") continue;

        // Look up parent booking to check ownership
        const parentBooking = await ctx.db.get(row.bookingId);
        if (parentBooking && parentBooking.userId === appUser._id) {
          bookedDates.push(date);
          totalAmount += parentBooking.totalAmount / (parentBooking.selectedDays?.length ?? 1);
          break; // one match per day is enough
        }
      }
    }

    if (bookedDates.length === 0) return null;

    return {
      weekStartDate: args.weekStartDate,
      totalAmount: Math.round(totalAmount * 100) / 100,
      bookedDates,
    };
  },
});

// ============================================================================
// Cron: expire stale InstaPay bookings past their hold window
// ============================================================================
export const expireStaleInstapayBookings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find all pending instapay payment intents that have expired
    const pendingIntents = await ctx.db
      .query("paymentHistory")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    let expiredCount = 0;

    for (const intent of pendingIntents) {
      // Only process InstaPay intents with an expiration that has passed
      if (intent.paymentMethod !== "instapay") continue;
      if (!intent.expiresAt || intent.expiresAt > now) continue;

      // 1. Mark intent as failed
      await ctx.db.patch(intent._id, {
        status: "failed",
        failureReason: "Payment proof not submitted within time limit",
        updatedAt: new Date().toISOString(),
      });

      // 2. Cancel all associated pending bookings
      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_user", (q) => q.eq("userId", intent.userId))
        .collect();

      for (const booking of bookings) {
        if (booking.tripId !== intent.tripId) continue;
        if (booking.status !== "pending" && booking.status !== "under_review") continue;
        if (booking.paymentMethod !== "instapay") continue;

        await ctx.db.patch(booking._id, {
          status: "cancelled",
          paymentStatus: "failed",
        });

        // 3. Cancel all reserved bookingDays
        const days = await ctx.db
          .query("bookingDays")
          .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
          .collect();

        for (const day of days) {
          if (day.status === "reserved") {
            await ctx.db.patch(day._id, { status: "cancelled" });
          }
        }
      }

      expiredCount++;
    }

    if (expiredCount > 0) {
      console.log(`[Cron] Expired ${expiredCount} stale InstaPay payment(s).`);
    }
  },
});

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * EgooBus database schema.
 *
 * `authTables` adds the internal tables required by @convex-dev/auth:
 *   - authAccounts   (linked OAuth accounts)
 *   - authSessions   (active sessions)
 *   - authVerificationCodes (OTP / magic-link tokens, unused here)
 *   - authVerifiers  (PKCE state, etc.)
 *   - users          (identity table managed by Convex Auth)
 *
 * Our `appUsers` table holds EgooBus-specific profile data and is linked
 * to the Convex Auth `users` table via `tokenIdentifier`.
 */
export default defineSchema({
  // Include all tables required by @convex-dev/auth
  ...authTables,

  /**
   * App-level user profile.
   * Separate from the Convex Auth `users` table so we can add
   * EgooBus-specific fields (role, phone, etc.) without touching
   * the identity layer.
   */
  appUsers: defineTable({
    // Deprecated for primary lookup: Stable cross-provider identity key
    tokenIdentifier: v.string(),
    userId: v.optional(v.id("users")), // New stable ID from Convex Auth
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("customer"), v.literal("driver"), v.literal("admin")),
    avatarUrl: v.optional(v.string()),
    defaultPickupAddress: v.optional(v.string()),
    defaultPickupLat: v.optional(v.number()),
    defaultPickupLng: v.optional(v.number()),
    defaultDropoffAddress: v.optional(v.string()),
    defaultDropoffLat: v.optional(v.number()),
    defaultDropoffLng: v.optional(v.number()),
    isOnboarded: v.optional(v.boolean()),
    walletId: v.optional(v.id("wallets")), // Linked wallet (lazy-created)

    createdAt: v.string(),

  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_userId", ["userId"])
    .index("by_email", ["email"])
    .index("by_phone", ["phone"])
    .index("by_role", ["role"]),

  // -------
  // Trips
  // -------
  trips: defineTable({
    tripCode: v.optional(v.string()), // Unique generated code
    origin: v.string(),
    destination: v.string(),
    departureTime: v.string(), // Acts as startTime
    endTime: v.optional(v.string()),
    availableSeats: v.number(),
    bookedPassengers: v.number(),
    pricePerSeat: v.number(),
    // Trip is visible to drivers only when bookedPassengers >= 8
    status: v.union(
      v.literal("pending"),
      v.literal("available"),
      v.literal("assigned"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    driverId: v.optional(v.id("appUsers")),
    createdBy: v.optional(v.id("appUsers")), // Admin who created the trip
    vehicleMake: v.optional(v.string()),
    vehicleModel: v.optional(v.string()),
    vehiclePlate: v.optional(v.string()),
    vehicleColor: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_driver", ["driverId"])
    .index("by_departure", ["departureTime"])
    .index("by_tripCode", ["tripCode"]),

  // -------
  // Bookings
  // -------
  bookings: defineTable({
    tripId: v.id("trips"),
    userId: v.id("appUsers"),
    seatsBooked: v.number(),
    paymentMethod: v.union(v.literal("cash"), v.literal("card"), v.literal("instapay"), v.literal("wallet")),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("under_review"),
      v.literal("paid"),
      v.literal("failed")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("under_review"),
      v.literal("confirmed"),
      v.literal("cancelled")
    ),
    totalAmount: v.number(),
    selectedDays: v.optional(v.array(v.string())), // ["2026-04-07", "2026-04-08"]
    weekStartDate: v.optional(v.string()),          // ISO Sunday of the booked week
    walletTransactionId: v.optional(v.id("walletTransactions")), // Set when paid via wallet
    createdAt: v.string(),
  })
    .index("by_trip", ["tripId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_trip_week", ["userId", "tripId", "weekStartDate"]),

  // -------
  // Booking Days — per-day capacity tracking for multi-day bookings
  // -------
  bookingDays: defineTable({
    bookingId: v.id("bookings"),
    tripId: v.id("trips"),
    date: v.string(),          // "2026-04-07"
    status: v.union(v.literal("active"), v.literal("reserved"), v.literal("cancelled")),
  })
    .index("by_booking", ["bookingId"])
    .index("by_trip_date", ["tripId", "date"]),

  // -------
  // Drivers (extended profile)
  // -------
  drivers: defineTable({
    userId: v.id("appUsers"),
    licenseNumber: v.string(),
    isVerified: v.boolean(),
    isAvailable: v.boolean(),
    vehicleMake: v.optional(v.string()),
    vehicleModel: v.optional(v.string()),
    vehicleYear: v.optional(v.number()),
    vehiclePlate: v.optional(v.string()),
    vehicleColor: v.optional(v.string()),
    vehicleCapacity: v.optional(v.number()),
    rating: v.optional(v.number()),
    totalTrips: v.number(),
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_availability", ["isAvailable"]),

  // -------
  // Payment History (Intents)
  // -------
  paymentHistory: defineTable({
    userId: v.id("appUsers"),
    tripId: v.optional(v.id("trips")),       // Optional for wallet top-ups (no trip)
    amount: v.number(),
    status: v.union(v.literal("pending"), v.literal("under_review"), v.literal("success"), v.literal("failed")),
    paymentMethod: v.union(v.literal("card"), v.literal("instapay"), v.literal("cash"), v.literal("wallet_topup")),
    bookingPayload: v.any(), // JSON containing selectedDays, numberOfWeeks, seatsBooked, etc.
    paymobOrderId: v.optional(v.string()), 
    transactionId: v.optional(v.string()),
    proofImageId: v.optional(v.string()), // Storage File ID
    proofReference: v.optional(v.string()),
    expiresAt: v.optional(v.number()), // Hold expiration timestamp
    failureReason: v.optional(v.string()),
    walletId: v.optional(v.id("wallets")),  // For top-up intents
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_paymob_order", ["paymobOrderId"]),

  // -------
  // Wallets — one per user, lazy-created
  // -------
  wallets: defineTable({
    userId: v.id("appUsers"),
    balance: v.number(),         // EGP, two-decimal precision
    currency: v.literal("EGP"),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_userId", ["userId"]),

  // -------
  // Wallet Transactions — immutable ledger
  // -------
  walletTransactions: defineTable({
    walletId: v.id("wallets"),
    userId: v.id("appUsers"),
    type: v.union(
      v.literal("TOP_UP"),
      v.literal("PAYMENT"),
      v.literal("REFUND"),
      v.literal("ADMIN_ADJUSTMENT"),
    ),
    amount: v.number(),            // Always positive (direction inferred from type)
    balanceBefore: v.number(),
    balanceAfter: v.number(),
    // References
    bookingId: v.optional(v.id("bookings")),
    paymentIntentId: v.optional(v.id("paymentHistory")),
    // Top-up specific
    topUpMethod: v.optional(v.union(
      v.literal("card"),
      v.literal("instapay"),
      v.literal("admin"),
    )),
    topUpStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("failed"),
    )),
    // Metadata
    description: v.string(),
    idempotencyKey: v.optional(v.string()),
    adminId: v.optional(v.id("appUsers")),
    createdAt: v.string(),
  })
    .index("by_wallet", ["walletId"])
    .index("by_userId", ["userId"])
    .index("by_type", ["type"])
    .index("by_idempotencyKey", ["idempotencyKey"]),
});

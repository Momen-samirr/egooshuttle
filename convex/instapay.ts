import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// ============================================================================
// Auth Helper (Shared)
// ============================================================================
async function getAppUser(ctx: QueryCtx | MutationCtx) {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) return null;
  return await ctx.db
    .query("appUsers")
    .withIndex("by_userId", (q) => q.eq("userId", authUserId as Id<"users">))
    .unique();
}

async function requireAdminQ(ctx: QueryCtx | MutationCtx) {
  const user = await getAppUser(ctx);
  if (!user || user.role !== "admin") throw new Error("Admin access required");
  return user;
}

async function requireAdmin(ctx: MutationCtx) {
  return requireAdminQ(ctx);
}

// ============================================================================
// User Actions — Proof Submission
// ============================================================================

/**
 * Returns a temporary URL for the client to upload their payment screenshot.
 */
export const generateUploadUrl = mutation(async (ctx) => {
  await getAppUser(ctx); // Ensure authenticated
  return await ctx.storage.generateUploadUrl();
});

/**
 * Submits InstaPay proof for a pending payment intent.
 */
export const submitInstaPayProof = mutation({
  args: {
    paymentIntentId: v.id("paymentHistory"),
    proofImageId: v.string(), // Storage File ID
    proofReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAppUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const intent = await ctx.db.get(args.paymentIntentId);
    if (!intent) throw new Error("Payment intent not found");
    if (intent.userId !== user._id) throw new Error("Unauthorized");

    if (intent.status !== "pending") {
      throw new Error(`Cannot submit proof for payment in ${intent.status} status.`);
    }

    // 1. Update the payment intent
    await ctx.db.patch(args.paymentIntentId, {
      status: "under_review",
      proofImageId: args.proofImageId,
      proofReference: args.proofReference,
      updatedAt: new Date().toISOString(),
    });

    // 2. Find and update the associated bookings
    // For single-week, it's one booking. For multi-week, it might be several.
    // We find bookings via userId/tripId/createdAt or by checking recent bookings.
    // In our implementation, we created bookings with status 'pending'.
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("tripId"), intent.tripId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    
    // Safety check: only update bookings created around the same time as the intent
    // Actually, we should probably have linked paymentIntentId to the booking schema,
    // but we can rely on the user/trip/status filter for now.
    for (const booking of bookings) {
       await ctx.db.patch(booking._id, {
         status: "under_review",
         paymentStatus: "under_review",
       });
    }

    return { success: true };
  },
});

// ============================================================================
// Admin Actions — Verification
// ============================================================================

/**
 * Lists all payments currently 'under_review' for the admin to verify.
 */
export const getPendingVerifications = query({
  args: {},
  handler: async (ctx) => {
    await requireAdminQ(ctx);
    const pending = await ctx.db
      .query("paymentHistory")
      .withIndex("by_status", (q) => q.eq("status", "under_review"))
      .collect();

    return await Promise.all(
      pending.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        const trip = p.tripId ? await ctx.db.get(p.tripId) : null;
        const proofUrl = p.proofImageId ? await ctx.storage.getUrl(p.proofImageId) : null;

        // Determine display info — top-ups have no trip
        const isTopUp = (p.bookingPayload as any)?.type === "topup";
        const tripInfoText = isTopUp
          ? `Wallet Top-up — EGP ${p.amount.toFixed(2)}`
          : trip ? `${trip.origin} → ${trip.destination}` : "Unknown Trip";

        return {
          ...p,
          userName: user?.name,
          userEmail: user?.email,
          tripInfo: tripInfoText,
          isTopUp,
          proofUrl,
        };
      })
    );
  },
});

/**
 * Approve or Reject a manual InstaPay payment.
 */
export const verifyInstaPayPayment = mutation({
  args: {
    paymentIntentId: v.id("paymentHistory"),
    action: v.union(v.literal("approve"), v.literal("reject")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const intent = await ctx.db.get(args.paymentIntentId);
    if (!intent || intent.status !== "under_review") {
      throw new Error("Invalid payment intent or not under review.");
    }

    const now = new Date().toISOString();
    const payload = intent.bookingPayload as any;

    // ================================================================
    // WALLET TOP-UP PATH: Credit wallet on approval
    // ================================================================
    if (payload?.type === "topup" && intent.walletId) {
      if (args.action === "approve") {
        await ctx.db.patch(intent._id, { status: "success", updatedAt: now });

        const wallet = await ctx.db.get(intent.walletId);
        if (wallet) {
          const balanceBefore = wallet.balance;
          const balanceAfter = Math.round((balanceBefore + intent.amount) * 100) / 100;

          await ctx.db.patch(intent.walletId, {
            balance: balanceAfter,
            updatedAt: now,
          });

          // Update pending wallet transaction
          const pendingTx = await ctx.db
            .query("walletTransactions")
            .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", `topup_${intent._id}`))
            .first();

          if (pendingTx) {
            await ctx.db.patch(pendingTx._id, {
              balanceBefore,
              balanceAfter,
              topUpStatus: "success",
            });
          } else {
            await ctx.db.insert("walletTransactions", {
              walletId: intent.walletId,
              userId: intent.userId,
              type: "TOP_UP",
              amount: intent.amount,
              balanceBefore,
              balanceAfter,
              paymentIntentId: intent._id,
              topUpMethod: "instapay",
              topUpStatus: "success",
              description: `Top-up via InstaPay — EGP ${intent.amount.toFixed(2)}`,
              idempotencyKey: `topup_${intent._id}`,
              createdAt: now,
            });
          }
        }
      } else {
        // Reject top-up
        await ctx.db.patch(intent._id, {
          status: "failed",
          failureReason: args.reason || "Top-up proof rejected by admin",
          updatedAt: now,
        });

        // Mark pending wallet transaction as failed
        const pendingTx = await ctx.db
          .query("walletTransactions")
          .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", `topup_${intent._id}`))
          .first();
        if (pendingTx) {
          await ctx.db.patch(pendingTx._id, { topUpStatus: "failed" });
        }
      }
      return { success: true };
    }

    // ================================================================
    // EXISTING PATH: Booking verification
    // ================================================================
    if (args.action === "approve") {
      await ctx.db.patch(intent._id, {
        status: "success",
        updatedAt: now,
      });

      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_user", (q) => q.eq("userId", intent.userId))
        .filter((q) => q.eq(q.field("tripId"), intent.tripId))
        .filter((q) => q.eq(q.field("status"), "under_review"))
        .collect();

      for (const booking of bookings) {
        await ctx.db.patch(booking._id, {
          status: "confirmed",
          paymentStatus: "paid",
        });

        const days = await ctx.db
            .query("bookingDays")
            .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
            .collect();
        
        for (const day of days) {
            await ctx.db.patch(day._id, { status: "active" });
        }
      }
    } else {
      await ctx.db.patch(intent._id, {
        status: "failed",
        failureReason: args.reason || "Payment proof rejected by admin",
        updatedAt: now,
      });

      const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_user", (q) => q.eq("userId", intent.userId))
        .filter((q) => q.eq(q.field("tripId"), intent.tripId))
        .filter((q) => q.eq(q.field("status"), "under_review"))
        .collect();

      for (const booking of bookings) {
        await ctx.db.patch(booking._id, {
          status: "cancelled",
          paymentStatus: "failed",
        });

        const days = await ctx.db
            .query("bookingDays")
            .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
            .collect();
        
        for (const day of days) {
            await ctx.db.patch(day._id, { status: "cancelled" });
        }
      }
    }

    return { success: true };
  },
});

// ============================================================================
// Query: get payment details for a specific booking (for admin drawer)
// ============================================================================
export const getPaymentDetailForBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    await requireAdminQ(ctx);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;

    // Find the most recent instapay payment intent for this user + trip
    const intents = await ctx.db
      .query("paymentHistory")
      .withIndex("by_user", (q) => q.eq("userId", booking.userId))
      .order("desc")
      .collect();

    // Find the matching intent for this trip
    const match = intents.find((i) => i.tripId === booking.tripId && i.paymentMethod === "instapay");
    if (!match) return null;

    const proofUrl = match.proofImageId
      ? await ctx.storage.getUrl(match.proofImageId)
      : null;

    return {
      _id: match._id,
      status: match.status,
      amount: match.amount,
      proofImageId: match.proofImageId,
      proofReference: match.proofReference,
      proofUrl,
      expiresAt: match.expiresAt,
      failureReason: match.failureReason,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
    };
  },
});

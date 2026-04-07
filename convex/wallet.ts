import { query, mutation, internalMutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// ============================================================================
// Constants
// ============================================================================
const MIN_TOPUP = 10;    // EGP
const MAX_TOPUP = 5000;  // EGP

// ============================================================================
// Auth Helper
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
// Queries
// ============================================================================

/**
 * Get the current user's wallet. Returns null if no wallet exists yet.
 */
export const getMyWallet = query({
  args: {},
  handler: async (ctx) => {
    const appUser = await getAppUser(ctx);
    if (!appUser) return null;

    if (!appUser.walletId) return null;

    const wallet = await ctx.db.get(appUser.walletId);
    return wallet;
  },
});

/**
 * Get the current user's wallet transaction history.
 * Returns most recent first, limited to 50 per call.
 */
export const getMyTransactions = query({
  args: {
    limit: v.optional(v.number()),
    typeFilter: v.optional(
      v.union(
        v.literal("TOP_UP"),
        v.literal("PAYMENT"),
        v.literal("REFUND"),
        v.literal("ADMIN_ADJUSTMENT"),
      )
    ),
  },
  handler: async (ctx, args) => {
    const appUser = await getAppUser(ctx);
    if (!appUser) return [];

    const limit = args.limit ?? 50;

    let txQuery;
    if (args.typeFilter) {
      txQuery = ctx.db
        .query("walletTransactions")
        .withIndex("by_userId", (q) => q.eq("userId", appUser._id));
    } else {
      txQuery = ctx.db
        .query("walletTransactions")
        .withIndex("by_userId", (q) => q.eq("userId", appUser._id));
    }

    const transactions = await txQuery.order("desc").take(limit);

    // Filter by type in-memory if needed (can't combine two indexes)
    if (args.typeFilter) {
      return transactions.filter((t) => t.type === args.typeFilter);
    }

    return transactions;
  },
});

// ============================================================================
// Public Mutations
// ============================================================================

/**
 * Create a wallet for the current user. Idempotent — if a wallet already
 * exists, returns the existing wallet ID.
 */
export const createWallet = mutation({
  args: {},
  handler: async (ctx) => {
    const appUser = await getAppUser(ctx);
    if (!appUser) throw new Error("Not authenticated");

    // Already has a wallet
    if (appUser.walletId) {
      const existing = await ctx.db.get(appUser.walletId);
      if (existing) return { walletId: existing._id, balance: existing.balance };
    }

    // Double-check by index (defensive — handles race condition)
    const existingByUser = await ctx.db
      .query("wallets")
      .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
      .unique();

    if (existingByUser) {
      // Link it to the appUser if not already linked
      if (!appUser.walletId) {
        await ctx.db.patch(appUser._id, { walletId: existingByUser._id });
      }
      return { walletId: existingByUser._id, balance: existingByUser.balance };
    }

    const now = new Date().toISOString();
    const walletId = await ctx.db.insert("wallets", {
      userId: appUser._id,
      balance: 0,
      currency: "EGP",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Link wallet to appUser
    await ctx.db.patch(appUser._id, { walletId });

    return { walletId, balance: 0 };
  },
});

/**
 * Initiate a wallet top-up. Creates a paymentHistory intent and returns
 * the intent ID for the client to proceed with Paymob/InstaPay.
 */
export const initiateTopUp = mutation({
  args: {
    amount: v.number(),
    method: v.union(v.literal("card"), v.literal("instapay")),
  },
  handler: async (ctx, args) => {
    const appUser = await getAppUser(ctx);
    if (!appUser) throw new Error("Not authenticated");

    if (args.amount < MIN_TOPUP || args.amount > MAX_TOPUP) {
      throw new Error(`Top-up amount must be between EGP ${MIN_TOPUP} and EGP ${MAX_TOPUP}`);
    }

    // Ensure wallet exists
    let walletId = appUser.walletId;
    if (!walletId) {
      const now = new Date().toISOString();
      walletId = await ctx.db.insert("wallets", {
        userId: appUser._id,
        balance: 0,
        currency: "EGP",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.patch(appUser._id, { walletId });
    }

    const now = new Date().toISOString();
    const expiresAt = args.method === "instapay"
      ? Date.now() + 30 * 60 * 1000 // 30 min window for InstaPay
      : undefined;

    // Create a paymentHistory intent for the top-up
    const paymentIntentId = await ctx.db.insert("paymentHistory", {
      userId: appUser._id,
      tripId: undefined,  // No trip — this is a wallet top-up
      amount: args.amount,
      status: "pending",
      paymentMethod: "wallet_topup",
      bookingPayload: {
        type: "topup",
        walletId,
        amount: args.amount,
        method: args.method,
      },
      walletId,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    // Create a pending wallet transaction for tracking
    await ctx.db.insert("walletTransactions", {
      walletId,
      userId: appUser._id,
      type: "TOP_UP",
      amount: args.amount,
      balanceBefore: 0,  // Will be updated on confirmation
      balanceAfter: 0,   // Will be updated on confirmation
      paymentIntentId,
      topUpMethod: args.method,
      topUpStatus: "pending",
      description: `Top-up via ${args.method} — EGP ${args.amount.toFixed(2)}`,
      idempotencyKey: `topup_${paymentIntentId}`,
      createdAt: now,
    });

    return {
      paymentIntentId,
      amount: args.amount,
      method: args.method,
    };
  },
});

// ============================================================================
// Internal Mutations (called server-side only)
// ============================================================================

/**
 * Credit a wallet balance after a successful top-up.
 * Called by payment webhook or admin InstaPay approval.
 */
export const creditWallet = internalMutation({
  args: {
    walletId: v.id("wallets"),
    amount: v.number(),
    paymentIntentId: v.id("paymentHistory"),
    idempotencyKey: v.string(),
    topUpMethod: v.union(v.literal("card"), v.literal("instapay"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    // Idempotency check
    const existing = await ctx.db
      .query("walletTransactions")
      .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (existing && existing.topUpStatus === "success") {
      return { success: true, alreadyProcessed: true };
    }

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet) throw new Error("Wallet not found");
    if (!wallet.isActive) throw new Error("Wallet is deactivated");

    const balanceBefore = wallet.balance;
    const balanceAfter = Math.round((balanceBefore + args.amount) * 100) / 100;

    // Atomic: update balance
    await ctx.db.patch(args.walletId, {
      balance: balanceAfter,
      updatedAt: new Date().toISOString(),
    });

    // Update existing pending transaction or create new one
    if (existing) {
      await ctx.db.patch(existing._id, {
        balanceBefore,
        balanceAfter,
        topUpStatus: "success",
      });
    } else {
      await ctx.db.insert("walletTransactions", {
        walletId: args.walletId,
        userId: wallet.userId,
        type: "TOP_UP",
        amount: args.amount,
        balanceBefore,
        balanceAfter,
        paymentIntentId: args.paymentIntentId,
        topUpMethod: args.topUpMethod,
        topUpStatus: "success",
        description: `Top-up via ${args.topUpMethod} — EGP ${args.amount.toFixed(2)}`,
        idempotencyKey: args.idempotencyKey,
        createdAt: new Date().toISOString(),
      });
    }

    return { success: true, balanceAfter };
  },
});

/**
 * Debit wallet balance for a booking payment.
 * Returns the walletTransactionId for linking to the booking.
 */
export const debitWallet = internalMutation({
  args: {
    walletId: v.id("wallets"),
    userId: v.id("appUsers"),
    amount: v.number(),
    bookingId: v.id("bookings"),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Idempotency check
    const existing = await ctx.db
      .query("walletTransactions")
      .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (existing) {
      return { success: true, walletTransactionId: existing._id, alreadyProcessed: true };
    }

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet) throw new Error("Wallet not found");
    if (!wallet.isActive) throw new Error("Wallet is deactivated");

    const balanceBefore = wallet.balance;
    if (balanceBefore < args.amount) {
      throw new Error(
        `Insufficient wallet balance. Available: EGP ${balanceBefore.toFixed(2)}, Required: EGP ${args.amount.toFixed(2)}`
      );
    }

    const balanceAfter = Math.round((balanceBefore - args.amount) * 100) / 100;

    // Atomic: update balance
    await ctx.db.patch(args.walletId, {
      balance: balanceAfter,
      updatedAt: new Date().toISOString(),
    });

    // Create transaction record
    const txId = await ctx.db.insert("walletTransactions", {
      walletId: args.walletId,
      userId: args.userId,
      type: "PAYMENT",
      amount: args.amount,
      balanceBefore,
      balanceAfter,
      bookingId: args.bookingId,
      description: `Trip booking payment — EGP ${args.amount.toFixed(2)}`,
      idempotencyKey: args.idempotencyKey,
      createdAt: new Date().toISOString(),
    });

    return { success: true, walletTransactionId: txId, balanceAfter };
  },
});

/**
 * Refund an amount back into a user's wallet.
 * Called when a wallet-paid booking is cancelled.
 */
export const refundToWallet = internalMutation({
  args: {
    walletId: v.id("wallets"),
    userId: v.id("appUsers"),
    amount: v.number(),
    bookingId: v.id("bookings"),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Idempotency check
    const existing = await ctx.db
      .query("walletTransactions")
      .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (existing) {
      return { success: true, alreadyProcessed: true };
    }

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet) throw new Error("Wallet not found");

    const balanceBefore = wallet.balance;
    const balanceAfter = Math.round((balanceBefore + args.amount) * 100) / 100;

    // Atomic: update balance
    await ctx.db.patch(args.walletId, {
      balance: balanceAfter,
      updatedAt: new Date().toISOString(),
    });

    // Create refund transaction
    await ctx.db.insert("walletTransactions", {
      walletId: args.walletId,
      userId: args.userId,
      type: "REFUND",
      amount: args.amount,
      balanceBefore,
      balanceAfter,
      bookingId: args.bookingId,
      description: `Booking cancellation refund — EGP ${args.amount.toFixed(2)}`,
      idempotencyKey: args.idempotencyKey,
      createdAt: new Date().toISOString(),
    });

    return { success: true, balanceAfter };
  },
});

/**
 * Admin manual wallet adjustment (credit or debit).
 */
export const adminAdjustWallet = internalMutation({
  args: {
    walletId: v.id("wallets"),
    amount: v.number(),           // positive = credit, negative = debit
    reason: v.string(),
    adminId: v.id("appUsers"),
  },
  handler: async (ctx, args) => {
    const wallet = await ctx.db.get(args.walletId);
    if (!wallet) throw new Error("Wallet not found");

    const balanceBefore = wallet.balance;
    const balanceAfter = Math.round((balanceBefore + args.amount) * 100) / 100;

    if (balanceAfter < 0) {
      throw new Error("Adjustment would result in negative balance");
    }

    await ctx.db.patch(args.walletId, {
      balance: balanceAfter,
      updatedAt: new Date().toISOString(),
    });

    await ctx.db.insert("walletTransactions", {
      walletId: args.walletId,
      userId: wallet.userId,
      type: "ADMIN_ADJUSTMENT",
      amount: Math.abs(args.amount),
      balanceBefore,
      balanceAfter,
      description: `Admin adjustment: ${args.reason}`,
      adminId: args.adminId,
      idempotencyKey: `admin_${args.walletId}_${Date.now()}`,
      createdAt: new Date().toISOString(),
    });

    return { success: true, balanceAfter };
  },
});

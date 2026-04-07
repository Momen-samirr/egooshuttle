import { v } from "convex/values";
import { mutation, query, internalMutation, MutationCtx, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// ---------------------------------------------------------------------------
// Normalization helpers
// Centralised here so every read/write path uses the same canonical form.
// ---------------------------------------------------------------------------

/**
 * Normalises an email address:
 *  - Trims leading/trailing whitespace
 *  - Lowercases (so "User@Example.com" and "user@example.com" are the same)
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalises a phone number to E.164 Egyptian format (+20XXXXXXXXXX):
 *  - Strips spaces, dashes, parentheses
 *  - Replaces leading 0 with +20 (e.g. "01012345678" → "+201012345678")
 *  - Prepends + if no country code detected
 */
export function normalizePhone(raw: string): string {
  const stripped = raw.replace(/[\s\-\(\)]/g, "");
  if (stripped.startsWith("0")) return `+20${stripped.slice(1)}`;
  if (!stripped.startsWith("+")) return `+20${stripped}`;
  return stripped;
}

// ---------------------------------------------------------------------------
// Helper: get the authenticated identity or throw
// ---------------------------------------------------------------------------
async function requireIdentity(ctx: MutationCtx | QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

// ---------------------------------------------------------------------------
// getOrCreateAppUser
//
// Called immediately after a successful sign-in (OAuth or Password).
// - Looks up an existing appUser by userId (stable Convex Auth ID).
// - Creates a new one (role: "customer") if this is the first sign-in.
// - Before creating, checks that the email is not already registered by
//   another account to prevent duplicate registrations.
// - Returns the full appUser document either way.
// ---------------------------------------------------------------------------
export const getOrCreateAppUser = mutation({
  args: {},
  handler: async (ctx): Promise<Doc<"appUsers">> => {
    const identity = await requireIdentity(ctx);

    const authUserId = await getAuthUserId(ctx);
    let nameFallback = identity.name;
    // Always normalise the email coming from the JWT
    const rawEmail = identity.email ?? "";
    let emailFallback = rawEmail ? normalizeEmail(rawEmail) : rawEmail;
    let pictureFallback = identity.pictureUrl;

    if (authUserId) {
      const authUser = await ctx.db.get(authUserId as Id<"users">);
      if (authUser) {
        nameFallback = nameFallback ?? authUser.name;
        if (!emailFallback && authUser.email) {
          emailFallback = normalizeEmail(authUser.email);
        }
        pictureFallback = pictureFallback ?? authUser.image;
      }
    }

    let existing = await ctx.db
      .query("appUsers")
      .withIndex("by_userId", (q) =>
        q.eq("userId", authUserId as Id<"users">)
      )
      .unique();

    // Self-healing: if we accidentally provisioned a "customer" duplicate over a legacy "admin"
    if (existing && existing.role === "customer" && emailFallback) {
      const realAdmin = await ctx.db
        .query("appUsers")
        .withIndex("by_email", (q) => q.eq("email", emailFallback!))
        .filter((q) => q.eq(q.field("role"), "admin"))
        .first();
        
      if (realAdmin && realAdmin._id !== existing._id) {
        await ctx.db.delete(existing._id); // Obliterate the accidental clone
        existing = realAdmin; // Lock onto the true admin profile
        await ctx.db.patch(existing._id, { userId: authUserId as Id<"users"> });
      }
    }

    if (!existing && emailFallback) {
      // Fallback: recover pre-migration profiles (like the Admin account) by email
      const orphanedProfile = await ctx.db
        .query("appUsers")
        .withIndex("by_email", (q) => q.eq("email", emailFallback!))
        .first();
        
      if (orphanedProfile) {
        existing = orphanedProfile;
        // Permanently attach the stable userId
        await ctx.db.patch(existing._id, { userId: authUserId as Id<"users"> });
      }
    }

    if (existing) {
      // Optionally refresh mutable fields like name/avatar from the latest token
      if (
        existing.name !== (nameFallback ?? existing.name) ||
        existing.avatarUrl !== (pictureFallback ?? existing.avatarUrl) ||
        existing.email !== (emailFallback ?? existing.email) ||
        existing.tokenIdentifier !== identity.tokenIdentifier
      ) {
        await ctx.db.patch(existing._id, {
          name: nameFallback ?? existing.name,
          avatarUrl: pictureFallback ?? existing.avatarUrl,
          email: emailFallback ?? existing.email,
          tokenIdentifier: identity.tokenIdentifier, // Keep latest token synced
        });
        return { 
          ...existing, 
          name: nameFallback ?? existing.name, 
          avatarUrl: pictureFallback ?? existing.avatarUrl,
          email: emailFallback ?? existing.email,
        };
      }
      return existing;
    }

    // -----------------------------------------------------------------------
    // First sign-in — validate uniqueness before creating the profile
    // -----------------------------------------------------------------------
    const email = emailFallback ?? "";

    if (email) {
      // Guard: ensure no other appUser already owns this email.
      // (Can happen if the same email was used across different auth providers
      // and the orphan-recovery path above didn't catch it.)
      const emailConflict = await ctx.db
        .query("appUsers")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();

      if (emailConflict) {
        // This appUser exists but has a different userId — conflict!
        throw new Error("Email already in use");
      }
    }

    const newId = await ctx.db.insert("appUsers", {
      tokenIdentifier: identity.tokenIdentifier,
      userId: authUserId as Id<"users">,
      name: nameFallback ?? email.split("@")[0] ?? "EgooBus User",
      email,
      role: "customer", // default role; promote manually or via admin
      avatarUrl: pictureFallback ?? undefined,
      isOnboarded: false,
      createdAt: new Date().toISOString(),
    });

    const created = await ctx.db.get(newId);

    if (!created) throw new Error("Failed to create user");
    return created;
  },
});

// ---------------------------------------------------------------------------
// getCurrentAppUser
//
// A lightweight query the frontend can subscribe to for the logged-in user.
// Returns null if not authenticated or profile not yet provisioned.
// ---------------------------------------------------------------------------
export const getCurrentAppUser = query({
  args: {},
  handler: async (ctx): Promise<Doc<"appUsers"> | null> => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) return null;

    return await ctx.db
      .query("appUsers")
      .withIndex("by_userId", (q) =>
        q.eq("userId", authUserId as Id<"users">)
      )
      .unique();
  },
});

// ---------------------------------------------------------------------------
// updateProfile
//
// Allows a logged-in user to update their own profile.
// Phone uniqueness is enforced here: before saving a phone number we check
// that no other appUser already has that number (after normalisation).
// ---------------------------------------------------------------------------
export const updateProfile = mutation({
  args: {
    phone: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("customer"), v.literal("driver"), v.literal("admin"))),
    defaultPickupAddress: v.optional(v.string()),
    defaultPickupLat: v.optional(v.number()),
    defaultPickupLng: v.optional(v.number()),
    defaultDropoffAddress: v.optional(v.string()),
    defaultDropoffLat: v.optional(v.number()),
    defaultDropoffLng: v.optional(v.number()),
    isOnboarded: v.optional(v.boolean()),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("appUsers")
      .withIndex("by_userId", (q) =>
        q.eq("userId", authUserId as Id<"users">)
      )
      .unique();

    if (!user) throw new Error("User profile not found");

    const patch: Partial<Doc<"appUsers">> = {};

    // ------------------------------------------------------------------
    // Phone: normalise + uniqueness check
    // ------------------------------------------------------------------
    if (args.phone !== undefined) {
      const normalizedPhone = normalizePhone(args.phone);

      // Check if any *other* appUser already has this phone
      const phoneConflict = await ctx.db
        .query("appUsers")
        .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
        .first();

      if (phoneConflict && phoneConflict._id !== user._id) {
        throw new Error("Phone number already in use");
      }

      patch.phone = normalizedPhone;
    }

    if (args.name !== undefined) patch.name = args.name;
    if (args.role !== undefined) patch.role = args.role;
    if (args.defaultPickupAddress !== undefined) patch.defaultPickupAddress = args.defaultPickupAddress;
    if (args.defaultPickupLat !== undefined) patch.defaultPickupLat = args.defaultPickupLat;
    if (args.defaultPickupLng !== undefined) patch.defaultPickupLng = args.defaultPickupLng;
    if (args.defaultDropoffAddress !== undefined) patch.defaultDropoffAddress = args.defaultDropoffAddress;
    if (args.defaultDropoffLat !== undefined) patch.defaultDropoffLat = args.defaultDropoffLat;
    if (args.defaultDropoffLng !== undefined) patch.defaultDropoffLng = args.defaultDropoffLng;
    if (args.isOnboarded !== undefined) patch.isOnboarded = args.isOnboarded;

    if (args.storageId) {
      const url = await ctx.storage.getUrl(args.storageId);
      if (url) patch.avatarUrl = url;
    }

    await ctx.db.patch(user._id, patch);
  },
});

// ---------------------------------------------------------------------------
// generateUploadUrl
//
// Used by the client to get a short-lived URL for uploading a profile photo.
// ---------------------------------------------------------------------------
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

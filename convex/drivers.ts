import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

async function requireAppUser(ctx: any): Promise<Id<"appUsers">> {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("appUsers")
    .withIndex("by_userId", (q: any) => q.eq("userId", authUserId))
    .unique();

  if (!user) throw new Error("App user profile not found");
  return user._id;
}

// Get the current driver's profile (to check isVerified)
export const getCurrentDriverProfile = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) return null;

    const user = await ctx.db
      .query("appUsers")
      .withIndex("by_userId", (q) => q.eq("userId", authUserId))
      .unique();

    if (!user) return null;

    return await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

// Create a new driver profile during onboarding
export const createDriverProfile = mutation({
  args: {
    licenseNumber: v.string(),
    vehicleMake: v.string(),
    vehicleModel: v.string(),
    vehiclePlate: v.string(),
  },
  handler: async (ctx, args) => {
    const appUserId = await requireAppUser(ctx);

    // Ensure we don't duplicate driver records
    const existingDriver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", appUserId))
      .unique();

    if (existingDriver) {
      throw new Error("Driver profile already exists");
    }

    const driverId = await ctx.db.insert("drivers", {
      userId: appUserId,
      licenseNumber: args.licenseNumber,
      vehicleMake: args.vehicleMake,
      vehicleModel: args.vehicleModel,
      vehiclePlate: args.vehiclePlate,
      isVerified: false, // Default to pending
      isAvailable: false,
      totalTrips: 0,
      createdAt: new Date().toISOString(),
    });

    // Also update the appUser to be marked as onboarded
    await ctx.db.patch(appUserId, {
      isOnboarded: true,
      role: "driver",
    });

    return driverId;
  },
});

// Admin-only mutation to approve a driver
export const approveDriver = mutation({
  args: {
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");

    const adminUser = await ctx.db
      .query("appUsers")
      .withIndex("by_userId", (q) => q.eq("userId", authUserId))
      .unique();

    if (!adminUser || adminUser.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    await ctx.db.patch(args.driverId, {
      isVerified: true,
    });
  },
});

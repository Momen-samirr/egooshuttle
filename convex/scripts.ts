import { internalMutation } from "./_generated/server";

const TABLES_TO_CLEAR = [
  "bookings",
  "trips",
  "drivers",
  "appUsers",
  "users",
  "authAccounts",
  "authSessions",
  "authVerificationCodes",
  "authVerifiers",
  "authRateLimits",
] as const;

export const clearAllData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Delete in reverse order of typical dependencies, though Convex doesn't enforce strict FKs
    for (const table of TABLES_TO_CLEAR) {
      // We must fetch documents and delete them recursively/iteratively
      // internalMutations have generous runtime limits relative to standard mutations.
      let hasMore = true;
      while (hasMore) {
        // Fetch in batches to prevent hitting any memory/mutation transaction limits
        // Type casting is necessary here to loop over exact table names robustly
        const batch = await ctx.db.query(table as any).take(100);
        
        for (const doc of batch) {
          await ctx.db.delete(doc._id);
        }
        
        if (batch.length < 100) {
          hasMore = false;
        }
      }
      console.log(`[db:reset] Cleared table: ${table}`);
    }
  },
});

import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";

/**
 * Convex Auth configuration.
 *
 * Providers:
 *  - Google OAuth  (AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET in Convex dashboard)
 *  - Password      (email + password, built-in hashing via @convex-dev/auth)
 *
 * After sign-in, @convex-dev/auth automatically stores identity in the
 * built-in `authTables` (users, accounts, sessions, verificationCodes).
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google({
      // These are set in Convex dashboard → Settings → Environment Variables
      // AUTH_GOOGLE_ID     = your Google OAuth Client ID
      // AUTH_GOOGLE_SECRET = your Google OAuth Client Secret
    }),
    Password(),
  ],
});

"use client";

/**
 * useGoogleAuth
 *
 * A clean hook that wraps Convex Auth's signIn/signOut and the app-user
 * provisioning mutation. Import this anywhere you need auth actions.
 */
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";


export type AuthError =
  | "popup_closed"       // User closed the Google popup
  | "account_exists"     // Account already linked to another provider (rare)
  | "network_error"      // Network / Convex unreachable
  | "unknown";           // Catch-all

export interface UseGoogleAuthReturn {
  /** The currently authenticated app-level user profile, or null */
  appUser: Doc<"appUsers"> | null | undefined;
  /** True while Convex is establishing the auth session */
  isLoading: boolean;
  /** True once a valid Convex session exists */
  isAuthenticated: boolean;
  /** True while the Google OAuth popup is opening / verifying */
  isSigningIn: boolean;
  /** True while sign-out is in progress */
  isSigningOut: boolean;
  /** Last error encountered, cleared on the next action */
  error: AuthError | null;
  /** Trigger the Google OAuth popup flow */
  signInWithGoogle: () => Promise<void>;
  /** Sign the user out and clear the Convex session */
  signOut: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const { signIn, signOut: convexSignOut } = useAuthActions();
  const { isLoading, isAuthenticated } = useConvexAuth();

  // Reactive subscription — updates whenever the appUser doc changes
  const appUser = useQuery(api.users.getCurrentAppUser);

  // Provision / refresh the app-level profile after OAuth sign-in
  const getOrCreateAppUser = useMutation(api.users.getOrCreateAppUser);

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setIsSigningIn(true);
    try {
      // 1. Trigger the Google OAuth flow.
      //    redirectTo must be a relative path — Convex Auth resolves it
      //    against the SITE_URL env var set on the Convex dashboard.
      //    For local dev: set SITE_URL = http://localhost:3000
      //    For production: set SITE_URL = https://egooshuttle.egoobus.com
      await signIn("google", { redirectTo: "/" });
    } catch (err: unknown) {
      // Map known error messages to typed error codes
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (msg.includes("popup") || msg.includes("cancelled") || msg.includes("closed")) {
        setError("popup_closed");
      } else if (msg.includes("already") || msg.includes("exists")) {
        setError("account_exists");
      } else if (msg.includes("network") || msg.includes("fetch")) {
        setError("network_error");
      } else {
        setError("unknown");
      }
    } finally {
      setIsSigningIn(false);
    }
  }, [signIn, getOrCreateAppUser]);

  const signOut = useCallback(async () => {
    setError(null);
    setIsSigningOut(true);
    try {
      await convexSignOut();
    } catch {
      setError("unknown");
    } finally {
      setIsSigningOut(false);
    }
  }, [convexSignOut]);

  const clearError = useCallback(() => setError(null), []);

  return {
    appUser,
    isLoading,
    isAuthenticated,
    isSigningIn,
    isSigningOut,
    error,
    signInWithGoogle,
    signOut,
    clearError,
  };
}

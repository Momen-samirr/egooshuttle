"use client";

import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

/**
 * AuthRedirectGuard
 * 
 * Used on auth pages (login, sign-up) to redirect users away if they are
 * already authenticated, preventing them from seeing login forms.
 */
export function AuthRedirectGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, appUser } = useGoogleAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (appUser && !appUser.isOnboarded) {
        router.push(ROUTES.ONBOARDING_PROFILE);
      } else if (appUser && appUser.isOnboarded !== false) {
        // Fallback to true if undefined or true
        router.push(ROUTES.DASHBOARD);
      }
    }
  }, [isLoading, isAuthenticated, appUser, router]);

  // Prevent flash of login screen while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Double check to avoid flash before redirect kicks in
  if (isAuthenticated) return null;

  return <>{children}</>;
}

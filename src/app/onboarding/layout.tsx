"use client";

import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, appUser } = useGoogleAuth();
  const router = useRouter();

  // Route protection
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(ROUTES.LOGIN);
      } else if (appUser && appUser.isOnboarded) {
        // If they already did onboarding, send them forward
        router.push(ROUTES.DASHBOARD);
      }
    }
  }, [isLoading, isAuthenticated, appUser, router]);

  if (isLoading || !isAuthenticated || (appUser && appUser.isOnboarded)) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return <>{children}</>;
}

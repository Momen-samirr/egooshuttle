"use client";

import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ROUTES } from "@/lib/constants";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";


export function GlobalOnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, appUser } = useGoogleAuth();
  const getOrCreateAppUser = useMutation(api.users.getOrCreateAppUser);
  const router = useRouter();
  const pathname = usePathname();
  
  const hasAttemptedProvisioning = useRef(false);

  // 1. Provision appUser if missing
  // Because OAuth signIn redirects the whole page, the original getOrCreateAppUser 
  // following signIn("google") is never executed. We must catch that state here on return.
  useEffect(() => {
    if (isAuthenticated && appUser === null && !hasAttemptedProvisioning.current) {
      hasAttemptedProvisioning.current = true;
      getOrCreateAppUser().catch((err) => {
        console.error("Failed to provision appUser:", err);
        hasAttemptedProvisioning.current = false;
      });
    }
  }, [isAuthenticated, appUser, getOrCreateAppUser]);

  // 2. Assert onboarding & RBAC
  useEffect(() => {
    if (isLoading) return;

    // Check strict authentication requirement where applicable
    if (isAuthenticated && appUser) {
      const isAdmin = appUser.role === "admin";
      const isDriver = appUser.role === "driver";
      const isCustomer = appUser.role === "customer";
      
      const inOnboarding = pathname.startsWith('/onboarding');
      const inApi = pathname.startsWith('/api');

      // Admins bypass onboarding constraints inherently
      if (!appUser.isOnboarded && !isAdmin && !inOnboarding && !inApi) {
        router.push(ROUTES.ONBOARDING_PROFILE);
        return;
      }

      // Enforce strict Role-Based Access Controls
      if (pathname.startsWith(ROUTES.ADMIN) && !isAdmin) {
        // Only admins can see /admin
        router.push(isDriver ? ROUTES.DRIVER : ROUTES.DASHBOARD);
        return;
      }

      if (pathname.startsWith(ROUTES.DRIVER) && !isAdmin && !isDriver) {
        // Only drivers and admins can see /driver
        router.push(ROUTES.DASHBOARD);
        return;
      }

      if (
        (pathname.startsWith(ROUTES.DASHBOARD) ||
          pathname.startsWith(ROUTES.TRIPS) ||
          pathname.startsWith(ROUTES.BOOKINGS) ||
          pathname.startsWith(ROUTES.PROFILE)) &&
        isDriver
      ) {
        router.push(ROUTES.DRIVER);
        return;
      }
    }
  }, [isLoading, isAuthenticated, appUser, pathname, router]);


  return <>{children}</>;
}

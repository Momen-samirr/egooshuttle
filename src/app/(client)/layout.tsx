"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";
import { ROUTES } from "@/lib/constants";
import { ClientTopNav } from "@/features/client-dashboard/components/ClientTopNav";
import { ClientMobileFooterNav } from "@/features/client-dashboard/components/ClientMobileFooterNav";
import { ClientQuickActionFab } from "@/features/client-dashboard/components/ClientQuickActionFab";

function initialsFromName(name: string | undefined, email: string | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return (a + b).toUpperCase() || "U";
  }
  if (email?.trim()) return email.trim()[0]!.toUpperCase();
  return "U";
}

/**
 * Dedicated shell for customer (client) routes — top navigation, mobile tab bar, and FAB.
 * Driver and admin use separate route groups; they are redirected here if misrouted.
 */
export default function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, appUser } = useGoogleAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (!appUser) return;
    
    if (appUser.role === "driver") {
      router.replace(ROUTES.DRIVER);
      return;
    }
    if (appUser.role === "admin") {
      router.replace(ROUTES.ADMIN);
      return;
    }
  }, [isLoading, isAuthenticated, appUser, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-outline)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (appUser === undefined || appUser === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-outline)]" />
      </div>
    );
  }

  if (appUser.role !== "customer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-outline)]" />
      </div>
    );
  }

  const initials = initialsFromName(appUser.name, appUser.email);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)]">
      <ClientTopNav userInitials={initials} />
      <main className="mx-auto min-h-screen max-w-7xl px-6 pb-24 pt-24 md:pb-12 page-enter">{children}</main>
      <ClientMobileFooterNav />
      <ClientQuickActionFab />
    </div>
  );
}

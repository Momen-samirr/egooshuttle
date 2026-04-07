"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";
import { ROUTES } from "@/lib/constants";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { AdminTopBar } from "@/features/admin/components/AdminTopBar";
import { AdminMobileNav } from "@/features/admin/components/AdminMobileNav";

/**
 * Admin dashboard shell — completely separate from client/driver layouts.
 * Role guard: redirects non-admin users immediately.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, appUser } = useGoogleAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (!appUser) return;

    // Non-admin users get redirected to their appropriate dashboard
    if (appUser.role === "customer") {
      router.replace(ROUTES.DASHBOARD);
      return;
    }
    if (appUser.role === "driver") {
      router.replace(ROUTES.DRIVER);
      return;
    }
  }, [isLoading, isAuthenticated, appUser, router]);

  // Loading states
  if (isLoading || !isAuthenticated || !appUser || appUser.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--color-surface)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-on-surface)" }}>
      <AdminTopBar />
      <AdminSidebar />
      <main className="md:pl-64 pt-16 min-h-screen">
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10 page-enter">
          {children}
        </div>
      </main>
      <AdminMobileNav />
    </div>
  );
}

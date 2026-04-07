"use client";

import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";
import { Bus, LayoutDashboard, LogOut, Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";

export default function DriverPage() {
  const { appUser, isLoading, isAuthenticated, signOut } = useGoogleAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-surface-950 text-white">
      {/* Header */}
      <header className="glass-dark border-b border-white/5 px-6 h-16 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
            <Bus className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">EgooBus</span>
          <span className="ml-1 px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-400 text-xs font-semibold">
            Driver
          </span>
        </div>

        <div className="flex items-center gap-3">
          {appUser?.avatarUrl ? (
            <img
              src={appUser.avatarUrl}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : null}
          <button
            id="driver-sign-out"
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Page Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center flex-shrink-0 shadow-brand">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1
                id="driver-dashboard-heading"
                className="text-2xl font-bold text-white"
              >
                Driver Dashboard
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-400 text-xs font-semibold">
                Driver
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Welcome back,{" "}
              <span className="text-white font-medium">
                {appUser?.name ?? "Driver"}
              </span>
              . Manage your trips and availability here.
            </p>
          </div>
        </div>

        {/* Placeholder card — ready for next build phase */}
        <div className="glass-dark rounded-2xl border border-white/10 px-8 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <LayoutDashboard className="w-8 h-8 text-slate-600" />
          </div>
          <p className="font-semibold text-slate-300 text-base">
            Driver Dashboard
          </p>
          <p className="text-slate-500 text-sm mt-1 max-w-xs">
            Your driver features are coming soon. Trip management and
            availability controls will be built here step by step.
          </p>
        </div>
      </div>
    </main>
  );
}

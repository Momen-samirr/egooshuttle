"use client";

import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";
import { Loader2 } from "lucide-react";
import { ClientDashboardHome } from "@/features/client-dashboard/pages/ClientDashboardHome";

export default function DashboardPage() {
  const { appUser, isLoading } = useGoogleAuth();

  if (isLoading || !appUser) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-outline)]" />
      </div>
    );
  }

  const displayName = appUser.name?.trim() || appUser.email?.split("@")[0] || "Traveler";

  return <ClientDashboardHome displayName={displayName} />;
}

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loader2, Clock, CheckCircle2 } from "lucide-react";
import { NetworkStatusCard } from "@/features/admin/components/NetworkStatusCard";
import { StatCard } from "@/features/admin/components/StatCard";
import { TripManagementSection } from "@/features/admin/components/TripManagementSection";
import { FleetToolsPanel } from "@/features/admin/components/FleetToolsPanel";
import { InstaPayVerificationPanel } from "@/features/admin/components/InstaPayVerificationPanel";

export default function AdminDashboardPage() {
  const stats = useQuery(api.admin.getDashboardStats);
  const trips = useQuery(api.admin.getRecentTrips);
  
  // Loading skeleton while queries resolve
  if (stats === undefined || trips === undefined) {
    return (
      <div className="space-y-10">
        {/* Stats skeleton */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 h-48 rounded-3xl skeleton" />
          <div className="h-48 rounded-3xl skeleton" />
          <div className="h-48 rounded-3xl skeleton" />
        </section>
        {/* Content skeleton */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="xl:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl skeleton" />
            ))}
          </div>
          <div className="h-[600px] rounded-3xl skeleton" />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* ====== Bento Dashboard Stats ====== */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <NetworkStatusCard
          activeTrips={stats.activeTrips}
          onlineDrivers={stats.onlineDrivers}
        />
        <StatCard
          icon={<Clock className="w-6 h-6" style={{ color: "var(--color-tertiary)" }} />}
          iconBgColor="var(--color-tertiary-fixed)"
          title="Pending Bookings"
          value={stats.pendingBookings}
          badge="+12%"
          badgeColor="var(--color-tertiary)"
        />
        <StatCard
          icon={<CheckCircle2 className="w-6 h-6" style={{ color: "var(--color-secondary)" }} />}
          iconBgColor="var(--color-secondary-fixed)"
          title="Completion Rate"
          value={stats.completionRate}
          badge="Optimal"
          badgeColor="var(--color-secondary)"
        />
      </section>

      {/* ====== InstaPay Verifications ====== */}
      <section>
        <InstaPayVerificationPanel />
      </section>

      {/* ====== Main Features Section ====== */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <TripManagementSection trips={trips as any[]} />
        <FleetToolsPanel />
      </section>
    </div>
  );
}

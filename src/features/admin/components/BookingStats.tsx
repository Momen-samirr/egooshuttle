"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { StatCard } from "./StatCard";
import { Users, CheckCircle2, XCircle, Route, Clock } from "lucide-react";

export function BookingStats() {
  const stats = useQuery(api.admin.getBookingStats);

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      <StatCard
        title="Total Bookings"
        value={stats.total.toLocaleString()}
        icon={<Users className="w-6 h-6 text-white" />}
        iconBgColor="var(--color-primary)"
        badge="+12%"
        badgeColor="var(--color-secondary)"
      />
      <StatCard
        title="Active"
        value={stats.active.toLocaleString()}
        icon={<CheckCircle2 className="w-6 h-6 text-white" />}
        iconBgColor="var(--color-secondary)"
        badge="Ongoing"
        badgeColor="var(--color-on-surface-variant)"
      />
      <StatCard
        title="Under Review"
        value={stats.underReview.toLocaleString()}
        icon={<Clock className="w-6 h-6 text-white" />}
        iconBgColor="#6366f1"
        badge="InstaPay"
        badgeColor="#6366f1"
      />
      <StatCard
        title="Cancelled"
        value={stats.cancelled.toLocaleString()}
        icon={<XCircle className="w-6 h-6 text-white" />}
        iconBgColor="var(--color-error)"
        badge="-3%"
        badgeColor="var(--color-error)"
      />
      <StatCard
        title="Popular Route"
        value={stats.popularRoute}
        icon={<Route className="w-6 h-6 text-white" />}
        iconBgColor="var(--color-tertiary)"
        badge={`${stats.popularRouteCount} trips`}
        badgeColor="var(--color-primary)"
      />
    </div>
  );
}

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { StatCard } from "./StatCard";
import { Route, CheckCircle2, XCircle, AlertTriangle, Clock, Users } from "lucide-react";

export function TripStats() {
  const stats = useQuery(api.admin.getTripStats);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 animate-pulse">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      <StatCard
        title="Total"
        value={stats.total.toLocaleString()}
        icon={<Route className="w-5 h-5 text-white" />}
        iconBgColor="var(--color-primary)"
        badge="All"
        badgeColor="var(--color-primary)"
      />
      <StatCard
        title="Active"
        value={stats.active.toLocaleString()}
        icon={<CheckCircle2 className="w-5 h-5 text-white" />}
        iconBgColor="#16a34a"
        badge="Bookable"
        badgeColor="#16a34a"
      />
      <StatCard
        title="Assigned"
        value={stats.assigned.toLocaleString()}
        icon={<Users className="w-5 h-5 text-white" />}
        iconBgColor="var(--color-primary)"
        badge="In Transit"
        badgeColor="var(--color-primary)"
      />
      <StatCard
        title="Full"
        value={stats.full.toLocaleString()}
        icon={<AlertTriangle className="w-5 h-5 text-white" />}
        iconBgColor="#dc2626"
        badge="No Seats"
        badgeColor="#dc2626"
      />
      <StatCard
        title="Pending"
        value={stats.pending.toLocaleString()}
        icon={<Clock className="w-5 h-5 text-white" />}
        iconBgColor="#d97706"
        badge="Setup"
        badgeColor="#d97706"
      />
      <StatCard
        title="Completed"
        value={stats.completed.toLocaleString()}
        icon={<CheckCircle2 className="w-5 h-5 text-white" />}
        iconBgColor="#0d9488"
        badge="Done"
        badgeColor="#0d9488"
      />
      <StatCard
        title="Inactive"
        value={stats.inactive.toLocaleString()}
        icon={<XCircle className="w-5 h-5 text-white" />}
        iconBgColor="#6b7280"
        badge="Disabled"
        badgeColor="#6b7280"
      />
    </div>
  );
}

"use client";

import { DashboardWelcomeHeader } from "../components/DashboardWelcomeHeader";
import { FindTripCard } from "../components/FindTripCard";
import { QuickRebookSection } from "../components/QuickRebookSection";
import { AvailableTripsSection } from "../components/AvailableTripsSection";
import { NextTripPanel } from "../components/NextTripPanel";
import { RouteStatusMiniMap } from "../components/RouteStatusMiniMap";
import { SupportShortcutCard } from "../components/SupportShortcutCard";

export function ClientDashboardHome({ displayName }: { displayName: string }) {
  const first = displayName.trim().split(/\s+/)[0] || "there";

  return (
    <>
      <DashboardWelcomeHeader greetingName={first} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <FindTripCard />
          <QuickRebookSection />
          <AvailableTripsSection />
        </div>
        <aside className="space-y-6 lg:col-span-4">
          <NextTripPanel />
          <RouteStatusMiniMap />
          <SupportShortcutCard />
        </aside>
      </div>
    </>
  );
}

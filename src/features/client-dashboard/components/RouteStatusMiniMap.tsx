"use client";

import { useClientDashboardStore } from "@/store/client-dashboard-store";

export function RouteStatusMiniMap() {
  const count = useClientDashboardStore((s) => s.activeBusesOnRoute);

  return (
    <div className="relative h-64 overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-outline-variant)_20%,transparent)] bg-[var(--color-surface-container-low)]">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: `
            linear-gradient(165deg, #1e3a4a 0%, #0f172a 45%, #134e4a 100%)
          `,
        }}
      />
      <div className="absolute inset-0 opacity-30 mix-blend-overlay">
        <svg className="h-full w-full" preserveAspectRatio="none">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface-container-low)] to-transparent" />
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/90 p-3 shadow-sm backdrop-blur">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-secondary)]" />
          <span className="text-xs font-bold text-[var(--color-on-surface)]">
            {count} Buses active on your route
          </span>
        </div>
      </div>
    </div>
  );
}

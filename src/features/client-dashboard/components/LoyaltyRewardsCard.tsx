"use client";

import { Star } from "lucide-react";
import { useClientDashboardStore } from "@/store/client-dashboard-store";

export function LoyaltyRewardsCard() {
  const loyaltyPoints = useClientDashboardStore((s) => s.loyaltyPoints);
  const pct = useClientDashboardStore((s) => s.nextRewardProgressPercent);

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] p-4 shadow-lg shadow-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]">
      <div className="rounded-xl bg-white/20 p-2">
        <Star className="h-6 w-6 fill-white/30 text-white" strokeWidth={2} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Egoo Points</p>
        <p className="text-xl font-black text-white">{loyaltyPoints.toLocaleString()}</p>
      </div>
      <div className="ml-4 border-l border-white/20 pl-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Next Reward</p>
        <div className="mt-1 h-1.5 w-24 rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-[var(--color-secondary-fixed)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

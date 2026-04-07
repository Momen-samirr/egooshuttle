"use client";

import { LoyaltyRewardsCard } from "./LoyaltyRewardsCard";

export function DashboardWelcomeHeader({
  greetingName,
}: {
  greetingName: string;
}) {
  return (
    <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
          Good morning, {greetingName}
        </h1>
        <p className="text-[var(--color-on-surface-variant)]">Ready for your commute today?</p>
      </div>
      <div className="flex gap-3">
        <LoyaltyRewardsCard />
      </div>
    </header>
  );
}

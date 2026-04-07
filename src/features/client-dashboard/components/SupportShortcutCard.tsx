"use client";

import { Headphones } from "lucide-react";

export function SupportShortcutCard() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-[color-mix(in_srgb,var(--color-outline-variant)_30%,transparent)] bg-[var(--color-surface-container-lowest)] p-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-container-low)]">
        <Headphones className="h-6 w-6 text-[var(--color-on-surface-variant)]" />
      </div>
      <h3 className="mb-1 text-sm font-bold text-[var(--color-on-surface)]">Need help with a booking?</h3>
      <p className="mb-4 text-[10px] text-[var(--color-on-surface-variant)]">Our support team is available 24/7</p>
      <button
        type="button"
        className="text-xs font-bold text-[var(--color-primary)] hover:underline"
      >
        Contact Support
      </button>
    </div>
  );
}

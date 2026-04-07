"use client";

import { Bus } from "lucide-react";
import type { AvailableTrip } from "../types";

import { useRouter } from "next/navigation";

export function AvailableTripCard({ trip }: { trip: AvailableTrip }) {
  const router = useRouter();
  const [a, b] = trip.stops;
  const isFull = trip.isFull;

  return (
    <article
      onClick={() => !isFull && router.push(`/trips/${trip.id}`)}
      className={`relative group rounded-xl border border-[color-mix(in_srgb,var(--color-outline-variant)_20%,transparent)] bg-[var(--color-surface-container-lowest)] p-6 transition-all ${
        isFull ? "opacity-50 cursor-not-allowed grayscale-[0.2]" : "cursor-pointer hover:-translate-y-1"
      }`}
    >
      {trip.badgeText && (
        <div className="absolute -top-3 -right-2 z-10 flex items-center justify-center rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-[10px] font-black uppercase shadow-md border border-orange-200">
          {trip.badgeText}
        </div>
      )}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary-fixed)] text-[var(--color-primary)]">
            <Bus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--color-on-surface)]">{trip.lineName}</h3>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-[var(--color-on-surface-variant)]">
              {trip.tierLabel}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-[var(--color-primary)]">
            EGP {trip.pricePerDay}
          </p>
          <p className="text-[10px] font-medium text-[var(--color-on-surface-variant)]">per day</p>
        </div>
      </div>
      <div className="relative space-y-6 pl-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-0.5 before:bg-[color-mix(in_srgb,var(--color-outline-variant)_30%,transparent)] before:content-['']">
        <div className="relative">
          <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-[var(--color-primary)] bg-white" />
          <div className="flex justify-between gap-2">
            <span className="text-sm font-bold text-[var(--color-on-surface)]">{a.name}</span>
            <span className="shrink-0 text-xs font-medium text-[var(--color-on-surface-variant)]">
              {a.timeLabel}
            </span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-[var(--color-primary)]" />
          <div className="flex justify-between gap-2">
            <span className="text-sm font-bold text-[var(--color-on-surface)]">{b.name}</span>
            <span className="shrink-0 text-xs font-medium text-[var(--color-on-surface-variant)]">
              {b.timeLabel}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-8 flex items-center justify-between">
        <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
          isFull ? 'bg-red-100 text-red-700' : 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-fixed-variant)]'
        }`}>
          {trip.passLabel}
        </span>
        {!isFull && (
          <button
            type="button"
            className="rounded-lg bg-[var(--color-surface-container-high)] px-5 py-2 text-sm font-bold transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-white"
          >
            Book Range →
          </button>
        )}
      </div>
    </article>
  );
}

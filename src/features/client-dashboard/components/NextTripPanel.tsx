"use client";

import { useEffect, useState } from "react";
import { Bus, QrCode, Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

function localTodayISO(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function NextTripPanel() {
  const [clientToday, setClientToday] = useState("");

  useEffect(() => {
    setClientToday(localTodayISO());
  }, []);

  const upcomingQuery = useQuery(
    api.bookings.getMyUpcomingTrips,
    clientToday ? { clientToday } : "skip"
  );

  if (!clientToday || upcomingQuery === undefined) {
    return (
      <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-outline-variant)_10%,transparent)] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.02)] flex justify-center items-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-outline)]" />
      </div>
    );
  }

  // Find the most relevant next trip:
  // If there's one today in the future, use it. Otherwise, use the nearest future date.
  const nowStr = new Date().toLocaleTimeString("en-GB", { hour12: false });
  const nowParts = nowStr.split(":");
  const nowMins = parseInt(nowParts[0]) * 60 + parseInt(nowParts[1]);

  const upcomingValid = upcomingQuery.filter(t => {
    if (t.nextDate === clientToday) {
      const depStr = t.departureTime.split(":");
      const depMins = parseInt(depStr[0]) * 60 + parseInt(depStr[1]);
      return depMins > nowMins; // Only if it hasn't departed yet today
    }
    return t.nextDate > clientToday;
  });

  const upcoming = upcomingValid[0];

  if (!upcoming) {
    return (
      <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-outline-variant)_10%,transparent)] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.02)]">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-[var(--color-on-surface-variant)]">
          Your Next Trip
        </h2>
        <p className="text-sm text-[var(--color-on-surface-variant)]">No upcoming trips. Find a route and book your seat to get started!</p>
      </div>
    );
  }

  // Calculate live countdown for display
  let displayMins = "--";
  if (upcoming.nextDate === clientToday) {
    const depStr = upcoming.departureTime.split(":");
    const depMins = parseInt(depStr[0]) * 60 + parseInt(depStr[1]);
    displayMins = String(Math.max(0, depMins - nowMins));
  } else {
    displayMins = upcoming.nextDate.slice(5).replace("-", "/"); // e.g., "04/08"
  }

  const parts = upcoming.departureTime.match(/(\d{1,2}):(\d{2})/);
  let timeLabel = upcoming.departureTime;
  if (parts) {
    const h = parseInt(parts[1]);
    const m = parts[2];
    timeLabel = `${String(h > 12 ? h - 12 : h || 12).padStart(2, "0")}:${m} ${h >= 12 ? "PM" : "AM"}`;
  }

  return (
    <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-outline-variant)_10%,transparent)] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.02)]">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-[var(--color-on-surface-variant)]">
        Your Next Trip
      </h2>
      <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)] p-4">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs font-bold text-[var(--color-primary)]">
              {upcoming.origin} → {upcoming.destination}
            </p>
            <p className="text-lg font-black text-[var(--color-on-surface)]">{timeLabel}</p>
          </div>
          <div className="min-w-[64px] rounded-xl bg-white p-2 text-center shadow-sm">
            <p className="text-sm font-black text-[var(--color-primary)]">{displayMins}</p>
            <p className="text-[8px] font-bold uppercase text-[var(--color-on-surface-variant)]">
              {upcoming.nextDate === clientToday ? "Minutes" : "Date"}
            </p>
          </div>
        </div>
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-outline-variant)_10%,transparent)] bg-white text-[var(--color-primary)] shadow-sm">
            <Bus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--color-on-surface)]">{upcoming.tripCode}</p>
            <p className="text-[10px] text-[var(--color-on-surface-variant)]">Booked for {upcoming.futureDaysCount} day{upcoming.futureDaysCount > 1 ? "s" : ""}</p>
          </div>
        </div>
        <button
          type="button"
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-outline-variant)_30%,transparent)] bg-white py-3 text-sm font-bold text-[var(--color-on-surface)] transition-colors hover:bg-slate-50"
        >
          <QrCode className="h-4 w-4" />
          View Boarding Pass
        </button>
        <button
          type="button"
          className="w-full rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] py-3 text-sm font-bold text-[var(--color-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]"
        >
          Track Real-time
        </button>
      </div>
    </div>
  );
}

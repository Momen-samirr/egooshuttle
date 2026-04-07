"use client";

import { useEffect, useState } from "react";
import { ChevronRight, CalendarClock, Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";

function localTodayISO(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function QuickRebookSection() {
  const router = useRouter();
  const [clientToday, setClientToday] = useState("");

  useEffect(() => {
    setClientToday(localTodayISO());
  }, []);

  const upcomingQuery = useQuery(
    api.bookings.getMyUpcomingTrips,
    clientToday ? { clientToday } : "skip"
  );

  if (!upcomingQuery) {
    return (
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-on-surface-variant)]">
          Active Itinerary
        </h2>
        <div className="flex justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-outline)]" />
        </div>
      </div>
    );
  }

  const upcomingValid = upcomingQuery.filter(t => t.nextDate >= clientToday);

  if (upcomingValid.length === 0) {
    return null; // Hide the section seamlessly if there's no secondary itinerary
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-on-surface-variant)]">
        Active Itinerary
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {upcomingValid.map((booking) => (
          <button
            key={booking.bookingId}
            onClick={() => router.push(`/trips/${booking.tripId}`)}
            type="button"
            className="group flex items-center gap-4 rounded-xl border border-[color-mix(in_srgb,var(--color-outline-variant)_30%,transparent)] bg-[var(--color-surface-container-lowest)] p-4 text-left transition-colors hover:border-[var(--color-primary)]"
          >
            <div className="rounded-lg bg-[var(--color-surface-container-low)] p-2 transition-colors group-hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]">
              <CalendarClock className="h-5 w-5 text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--color-on-surface)] truncate">
                {booking.origin} → {booking.destination}
              </p>
              <p className="text-[10px] text-[var(--color-on-surface-variant)]">
                Next: {booking.nextDate.replace(/-/g, "/")} at {formatTime(booking.departureTime)} • {booking.futureDaysCount} day(s) left
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-[var(--color-outline-variant)] group-hover:text-[var(--color-primary)]" />
          </button>
        ))}
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const parts = iso.match(/(\d{1,2}):(\d{2})/);
  if (!parts) return iso;
  const h = parseInt(parts[1]);
  const m = parts[2];
  const ampm = h >= 12 ? "PM" : "AM";
  return `${String(h > 12 ? h - 12 : h || 12).padStart(2, "0")}:${m} ${ampm}`;
}

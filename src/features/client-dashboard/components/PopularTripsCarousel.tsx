"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Flame } from "lucide-react";
import { AvailableTripCard } from "./AvailableTripCard";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { AvailableTrip } from "../types";

function localTodayISO(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function PopularTripsCarousel() {
  const [clientToday, setClientToday] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setClientToday(localTodayISO());
  }, []);

  const fetchedTrips = useQuery(api.trips.getPopularTrips, clientToday ? { clientToday } : "skip");

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  if (fetchedTrips === undefined) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (fetchedTrips.length === 0) return null;

  const dynamicTrips: AvailableTrip[] = fetchedTrips.map((t, i) => {
    const startTimeStr = new Date(t.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTimeStr = t.endTime 
      ? new Date(t.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : "Arr";

    let badgeText = undefined;
    if (t.bookedPassengers > 0 && i < 2) {
      badgeText = `🔥 ${t.bookedPassengers} Bookings`;
    } else if (i < 2) {
      badgeText = "Suggested";
    }

    return {
      id: t._id,
      lineName: t.tripCode || `${t.origin.slice(0, 3).toUpperCase()}-${t.destination.slice(0, 3).toUpperCase()}`,
      tierLabel: "Daily Route",
      pricePerDay: t.pricePerSeat,
      passLabel: t.todayAvailability.isFull ? "Fully Booked" : `${t.todayAvailability.remaining} seats left`,
      isFull: t.todayAvailability.isFull,
      remaining: t.todayAvailability.remaining,
      badgeText,
      stops: [
        { name: t.origin, timeLabel: startTimeStr },
        { name: t.destination, timeLabel: endTimeStr }
      ]
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--color-on-surface)]">
          <Flame className="h-5 w-5 text-orange-500" />
          Popular Destinations
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={scrollLeft}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] transition-theme hover:bg-[var(--color-surface-container-highest)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={scrollRight}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] transition-theme hover:bg-[var(--color-surface-container-highest)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-6 pt-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {dynamicTrips.map((trip) => (
          <div key={trip.id} className="min-w-[85vw] md:min-w-[320px] snap-center shrink-0">
            <AvailableTripCard trip={trip} />
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { CalendarDays, ListFilter, MapPin, Search, Bus, ArrowRight, Loader2, ArrowUpDown, Clock } from "lucide-react";
import { useClientDashboardStore } from "@/store/client-dashboard-store";

/** Returns today in YYYY-MM-DD using the browser's LOCAL timezone. */
function localTodayISO(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function ClientTripsPage() {
  const router = useRouter();
  
  const pickups = useClientDashboardStore((s) => s.pickups);
  const setPickups = useClientDashboardStore((s) => s.setPickups);
  const dropoff = useClientDashboardStore((s) => s.dropoff);
  const setDropoff = useClientDashboardStore((s) => s.setDropoff);
  const startTime = useClientDashboardStore((s) => s.startTimeFilter);
  const setStartTime = useClientDashboardStore((s) => s.setStartTimeFilter);
  const [clientToday, setClientToday] = useState("");
  const [sortBy, setSortBy] = useState<"time" | "price" | "availability">("time");

  // Mount effect to avoid hydration mismatch on dates
  useEffect(() => {
    setClientToday(localTodayISO());
  }, []);

  const uniqueOrigins = useQuery(api.trips.getUniqueOrigins) || [];
  
  const rawTrips = useQuery(api.trips.searchTrips, clientToday ? {
    origins: pickups.length > 0 ? pickups : undefined,
    destination: dropoff || undefined,
    startTime: startTime || undefined,
    clientToday,
  } : "skip");

  const sortedTrips = useMemo(() => {
    if (!rawTrips) return undefined;
    return [...rawTrips].sort((a, b) => {
      // Force fully booked to bottom
      if (a.todayAvailability.isFull && !b.todayAvailability.isFull) return 1;
      if (!a.todayAvailability.isFull && b.todayAvailability.isFull) return -1;
      
      switch (sortBy) {
        case "price": return a.pricePerSeat - b.pricePerSeat;
        case "availability": return b.todayAvailability.remaining - a.todayAvailability.remaining;
        case "time":
        default:
           return a.departureTime.localeCompare(b.departureTime);
      }
    });
  }, [rawTrips, sortBy]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--color-on-surface)" }}>
          Find Trips
        </h1>
        <p className="mt-1" style={{ color: "var(--color-on-surface-variant)" }}>
          Search shared routes and book your commute with real-time tracking.
        </p>
      </div>

      {/* Search section */}
      <div className="rounded-2xl p-6 shadow-ambient" style={{ backgroundColor: "var(--color-surface-container-lowest)" }}>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--color-on-surface)" }}>Route search</h2>
            <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
              Filter by origin network and destination
            </p>
          </div>
          
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" style={{ color: "var(--color-on-surface-variant)" }} />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border-none bg-transparent text-sm font-black uppercase outline-none focus:ring-0 cursor-pointer"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              <option value="time">Sort by Time</option>
              <option value="price">Sort by Price</option>
              <option value="availability">Sort by Seats</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Origin Multi-Select Dropdown Alternative */}
          <div className="flex flex-col gap-2 rounded-xl p-4 border" style={{ backgroundColor: "var(--color-surface-container-low)" }}>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 shrink-0" style={{ color: "var(--color-primary)" }} />
              <span className="text-sm font-bold text-[var(--color-on-surface)]">Origins (Multi)</span>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar">
              {uniqueOrigins.length === 0 ? (
                <p className="text-xs text-[var(--color-on-surface-variant)]">Loading origins...</p>
              ) : (
                uniqueOrigins.map((org) => (
                  <label key={org} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="rounded border-[var(--color-outline)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      checked={pickups.includes(org)}
                      onChange={() => {
                        if (pickups.includes(org)) {
                          setPickups(pickups.filter(o => o !== org));
                        } else {
                          setPickups([...pickups, org]);
                        }
                      }}
                    />
                    <span className="text-sm font-medium text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)] transition-colors">
                      {org}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ backgroundColor: "var(--color-surface-container-low)" }}>
              <Clock className="h-4 w-4 shrink-0 text-orange-500" />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="min-w-0 flex-1 border-none bg-transparent text-sm font-medium focus:ring-0 outline-none"
              />
            </div>
          
            <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ backgroundColor: "var(--color-surface-container-low)" }}>
              <MapPin className="h-4 w-4 shrink-0" style={{ color: "var(--color-error)" }} />
              <input
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                placeholder="Search Destination..."
                className="min-w-0 flex-1 border-none bg-transparent text-sm font-medium focus:ring-0 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold" style={{ color: "var(--color-on-surface)" }}>
          Available Routes {sortedTrips !== undefined && `(${sortedTrips.length})`}
        </h2>

        {sortedTrips === undefined ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : sortedTrips.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400">
            No trips found. Try adjusting your search filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {sortedTrips.map((trip) => {
              const isFull = trip.todayAvailability.isFull;

              return (
                <article
                  key={trip._id}
                  onClick={() => !isFull && router.push(`/trips/${trip._id}`)}
                  className={`group rounded-xl border p-6 transition-all ${
                    isFull ? 'opacity-50 cursor-not-allowed grayscale-[0.2]' : 'cursor-pointer hover:-translate-y-1 hover:shadow-lg'
                  }`}
                  style={{
                    backgroundColor: "var(--color-surface-container-lowest)",
                    borderColor: isFull ? "var(--color-outline-variant)" : "rgba(193,198,214,0.2)",
                  }}
                >
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: "var(--color-primary-fixed)", color: "var(--color-primary)" }}>
                        <Bus className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold" style={{ color: "var(--color-on-surface)" }}>
                          {trip.tripCode ?? `${trip.origin} → ${trip.destination}`}
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: "var(--color-on-surface-variant)" }}>
                          Daily Route
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black" style={{ color: "var(--color-primary)" }}>
                        EGP {trip.pricePerSeat}
                      </p>
                      <p className="text-[10px] font-medium" style={{ color: "var(--color-on-surface-variant)" }}>
                        per day
                      </p>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="relative space-y-6 pl-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-0.5 before:content-['']"
                    style={{ "--tw-before-bg": "rgba(193,198,214,0.3)" } as any}>
                    <div className="relative">
                      <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 bg-white"
                        style={{ borderColor: "var(--color-primary)" }} />
                      <div className="flex justify-between gap-2">
                        <span className="text-sm font-bold" style={{ color: "var(--color-on-surface)" }}>{trip.origin}</span>
                        <span className="shrink-0 text-xs font-medium" style={{ color: "var(--color-on-surface-variant)" }}>
                          {new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full"
                        style={{ backgroundColor: "var(--color-primary)" }} />
                      <div className="flex justify-between gap-2">
                        <span className="text-sm font-bold" style={{ color: "var(--color-on-surface)" }}>{trip.destination}</span>
                        {trip.endTime && (
                          <span className="shrink-0 text-xs font-medium" style={{ color: "var(--color-on-surface-variant)" }}>
                            {new Date(trip.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    {/* Live Seating Badge */}
                    <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      isFull ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-800'
                    }`}>
                      {isFull ? "Fully Booked Today" : `${trip.todayAvailability.remaining} seats remaining`}
                    </span>
                    
                    {!isFull && (
                      <span
                        className="rounded-lg px-5 py-2 text-sm font-bold transition-colors"
                        style={{ backgroundColor: "var(--color-surface-container-high)" }}
                      >
                        Book Range →
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



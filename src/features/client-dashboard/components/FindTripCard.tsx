"use client";

import { Flag, MapPin, Search, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientDashboardStore } from "@/store/client-dashboard-store";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function FindTripCard() {
  const router = useRouter();
  const tripSearchMode = useClientDashboardStore((s) => s.tripSearchMode);
  const setTripSearchMode = useClientDashboardStore((s) => s.setTripSearchMode);
  
  const pickups = useClientDashboardStore((s) => s.pickups);
  const setPickups = useClientDashboardStore((s) => s.setPickups);
  
  const dropoff = useClientDashboardStore((s) => s.dropoff);
  const setDropoff = useClientDashboardStore((s) => s.setDropoff);

  const startTimeFilter = useClientDashboardStore((s) => s.startTimeFilter);
  const setStartTimeFilter = useClientDashboardStore((s) => s.setStartTimeFilter);


  const availableOrigins = useQuery(api.trips.getUniqueOrigins) || [];

  const toggleOrigin = (origin: string) => {
    if (pickups.includes(origin)) {
      setPickups(pickups.filter(o => o !== origin));
    } else {
      setPickups([...pickups, origin]);
    }
  };

  return (
    <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-8 shadow-[0_8px_32px_rgba(0,91,191,0.04)]">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--color-on-surface)]">Find a Trip</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTripSearchMode("range")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold transition-colors",
              tripSearchMode === "range"
                ? "bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)] text-[var(--color-primary)]"
                : "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]",
            )}
          >
            Book Range
          </button>
          <button
            type="button"
            onClick={() => setTripSearchMode("one_way")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold transition-colors",
              tripSearchMode === "one_way"
                ? "bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)] text-[var(--color-primary)]"
                : "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]",
            )}
          >
            One Way
          </button>
        </div>
      </div>
      <div className="relative grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4 flex flex-col">
          <div className="flex-1 border rounded-xl border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4">
            <label className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-on-surface-variant)]">
              <MapPin className="h-4 w-4 text-[var(--color-primary)]" />
              Pickup Points (Multi)
            </label>
            <div className="max-h-24 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {availableOrigins.length === 0 && (
                <p className="text-xs text-[var(--color-on-surface-variant)]">Loading origins...</p>
              )}
              {availableOrigins.map(origin => (
                <label key={origin} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="rounded border-[var(--color-outline)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    checked={pickups.includes(origin)}
                    onChange={() => toggleOrigin(origin)}
                  />
                  <span className="text-sm font-medium text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)] transition-colors">
                    {origin}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 ml-4 block text-[10px] font-bold uppercase tracking-widest text-[var(--color-on-surface-variant)]">
              Drop-off Point
            </label>
            <div className="group flex items-center rounded-xl bg-[var(--color-surface-container-low)] px-4 py-3 transition-all focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]">
              <Flag className="mr-3 h-5 w-5 shrink-0 text-[var(--color-error)]" />
              <input
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                placeholder="Enter destination"
                className="w-full border-none bg-transparent p-0 text-sm font-medium text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:ring-0"
              />
            </div>
          </div>
        </div>
        <div className="space-y-4">

          <div>
            <label className="mb-1 ml-4 block text-[10px] font-bold uppercase tracking-widest text-[var(--color-on-surface-variant)]">
              Departure Time (From)
            </label>
            <div className="group flex items-center rounded-xl bg-[var(--color-surface-container-low)] px-4 py-3 transition-all focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]">
              <Clock className="mr-3 h-5 w-5 shrink-0 text-orange-500" />
              <input
                type="time"
                value={startTimeFilter}
                onChange={(e) => setStartTimeFilter(e.target.value)}
                className="w-full border-none bg-transparent p-0 text-sm font-medium text-[var(--color-on-surface)] focus:ring-0"
              />
            </div>
          </div>

          <button
            onClick={() => router.push("/trips")}
            type="button"
            className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] text-sm font-bold text-white shadow-lg shadow-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] transition-opacity hover:opacity-90"
          >
            <Search className="h-5 w-5" />
            Search Available Trips
          </button>
        </div>
      </div>
    </div>
  );
}

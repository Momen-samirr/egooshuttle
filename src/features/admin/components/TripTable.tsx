"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  ArrowRight,
  MoreVertical,
  ChevronRight,
  Route,
  Eye,
  Edit,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState, useRef, useEffect } from "react";

// ---------------------------------------------------------------------------
// Status badge configuration
// ---------------------------------------------------------------------------
const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  inactive: {
    label: "Inactive",
    className: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
  },
  full: {
    label: "Full",
    className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  completed: {
    label: "Completed",
    className: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  },
};

interface TripTableProps {
  statusFilter: string;
  searchQuery: string;
  onEditTrip: (tripId: Id<"trips">) => void;
}

export function TripTable({ statusFilter, searchQuery, onEditTrip }: TripTableProps) {
  const router = useRouter();
  const updateTrip = useMutation(api.admin.updateTrip);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Map user-facing filter to DB status
  const statusMap: Record<string, string | undefined> = {
    all: undefined,
    active: "available",
    inactive: "cancelled",
    pending: "pending",
    assigned: "assigned",
    completed: "completed",
  };

  const trips = useQuery(api.admin.getAdminTrips, {
    status: statusMap[statusFilter] as any,
    search: searchQuery || undefined,
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggleStatus = async (tripId: Id<"trips">, currentStatus: string) => {
    setActionBusy(tripId);
    try {
      const newStatus = currentStatus === "cancelled" ? "available" : "cancelled";
      await updateTrip({ tripId, status: newStatus as any });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionBusy(null);
      setOpenDropdown(null);
    }
  };

  function formatTime(iso: string): string {
    const date = new Date(iso);
    if (isNaN(date.getTime())) {
      // Try parsing as HH:MM or HH:MM:SS
      return iso.slice(0, 5);
    }
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  if (!trips) {
    return (
      <div className="bg-white rounded-3xl shadow-ambient p-20 flex flex-col items-center justify-center gap-6 border border-slate-100">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-slate-900 font-bold text-lg">Loading Trips</p>
          <p className="text-slate-500">Synchronizing with the routing engine...</p>
        </div>
      </div>
    );
  }

  // Additional client-side filter for "full" status
  let filteredTrips = trips;
  if (statusFilter === "full") {
    filteredTrips = trips.filter((t) => t.isFull);
  }

  return (
    <div className="bg-white rounded-3xl shadow-ambient overflow-hidden border border-slate-100">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
              <th className="px-6 py-5">Trip Code</th>
              <th className="px-6 py-5">Route</th>
              <th className="px-6 py-5">Departure</th>
              <th className="px-6 py-5 text-center">Capacity</th>
              <th className="px-6 py-5 text-center">Occupancy</th>
              <th className="px-6 py-5 text-center">Status</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredTrips.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                      <Route className="w-8 h-8" />
                    </div>
                    <p className="text-slate-400 font-medium italic">
                      No trips match your filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTrips.map((trip) => {
                const badge = STATUS_BADGE[trip.displayStatus] ?? STATUS_BADGE.pending;
                const isLoading = actionBusy === trip._id;

                return (
                  <tr
                    key={trip._id}
                    onClick={() => router.push(`/admin/trips/${trip._id}`)}
                    className="hover:bg-blue-50/40 transition-all cursor-pointer group"
                  >
                    {/* Trip Code */}
                    <td className="px-6 py-5">
                      <span className="text-sm font-black text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">
                        {trip.tripCode || "—"}
                      </span>
                    </td>

                    {/* Route */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">
                          {trip.origin}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-sm font-medium text-slate-500">
                          {trip.destination}
                        </span>
                      </div>
                    </td>

                    {/* Departure Time */}
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-slate-700">
                        {formatTime(trip.departureTime)}
                      </span>
                    </td>

                    {/* Capacity: Booked / Total + Available */}
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`text-lg font-black ${
                              trip.isFull
                                ? "text-rose-600"
                                : "text-slate-900"
                            }`}
                          >
                            {trip.dynamicBooked}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            / {trip.totalCapacity}
                          </span>
                        </div>
                        {trip.dynamicHeld > 0 && (
                          <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                            +{trip.dynamicHeld} held
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold ${
                            trip.dynamicAvailable === 0
                              ? "text-rose-500"
                              : "text-emerald-600"
                          }`}
                        >
                          {trip.dynamicAvailable} available
                        </span>
                      </div>
                    </td>

                    {/* Occupancy Bar */}
                    <td className="px-6 py-5 text-center">
                      <div className="w-full max-w-[100px] mx-auto">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black text-slate-500">
                            {trip.occupancyPct}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              trip.occupancyPct >= 100
                                ? "bg-rose-500"
                                : trip.occupancyPct >= 75
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                            style={{
                              width: `${Math.min(100, trip.occupancyPct)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-5 text-center">
                      <span
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5 text-right">
                      <div className="relative inline-block" ref={openDropdown === trip._id ? dropdownRef : undefined}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(
                              openDropdown === trip._id ? null : trip._id
                            );
                          }}
                          className="p-2.5 rounded-xl text-slate-300 hover:text-blue-600 hover:bg-white hover:shadow-sm transition-all active:scale-95"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {openDropdown === trip._id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 py-2 animate-in fade-in slide-in-from-top-1 duration-150">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/trips/${trip._id}`);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTrip(trip._id as Id<"trips">);
                                setOpenDropdown(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Trip
                            </button>
                            <div className="h-px bg-slate-100 my-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(
                                  trip._id as Id<"trips">,
                                  trip.status
                                );
                              }}
                              disabled={isLoading}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors ${
                                trip.status === "cancelled"
                                  ? "text-emerald-600 hover:bg-emerald-50"
                                  : "text-rose-600 hover:bg-rose-50"
                              }`}
                            >
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : trip.status === "cancelled" ? (
                                <ToggleRight className="w-4 h-4" />
                              ) : (
                                <ToggleLeft className="w-4 h-4" />
                              )}
                              {trip.status === "cancelled"
                                ? "Activate Trip"
                                : "Deactivate Trip"}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50/30 px-8 py-5 border-t border-slate-100 flex items-center justify-between">
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
          Total: {filteredTrips.length} Trip{filteredTrips.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

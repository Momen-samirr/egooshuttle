"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Status visual mapping
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  assigned:  { label: "Assigned",  className: "badge-assigned" },
  available: { label: "Ready",     className: "badge-ready" },
  pending:   { label: "Pending",   className: "badge-pending" },
  completed: { label: "Completed", className: "badge-ready" },
  cancelled: { label: "Cancelled", className: "badge-cancelled" },
};

function formatDeparture(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  const now = new Date();
  const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  if (date.toDateString() === now.toDateString()) return `${time} Today`;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) return `${time} Tomorrow`;
  return `${time} ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export interface AdminTripData {
  _id: string;
  tripCode?: string;
  origin: string;
  destination: string;
  departureTime: string;
  bookedPassengers: number;
  totalCapacity: number;
  status: string;
  driverName: string | null;
  driverVehicle: string | null;
}

interface AdminTripCardProps {
  trip: AdminTripData;
}

export function AdminTripCard({ trip }: AdminTripCardProps) {
  const router = useRouter();
  const statusCfg = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.pending;
  const fillPct = trip.totalCapacity > 0
    ? Math.round((trip.bookedPassengers / trip.totalCapacity) * 100)
    : 0;

  // Fill bar color varies by status
  const fillColor =
    trip.status === "available" || trip.status === "completed"
      ? "var(--color-secondary)"
      : trip.status === "pending"
        ? "var(--color-tertiary)"
        : "var(--color-primary)";

  const isPending = trip.status === "pending";

  return (
    <div
      className={`p-6 rounded-xl flex flex-col md:flex-row gap-6 items-center transition-all cursor-pointer ${isPending ? "opacity-85" : ""}`}
      style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
      onClick={() => router.push(`/admin/trips/${trip._id}`)}
    >
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
        {/* Route info */}
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <span className={`${statusCfg.className} text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider`}>
              {statusCfg.label}
            </span>
            <span className="text-xs font-medium" style={{ color: "var(--color-on-surface-variant)" }}>
              {trip.tripCode ?? "—"}
            </span>
          </div>
          <h4 className="text-lg font-bold" style={{ color: "var(--color-on-surface)" }}>
            {trip.origin} → {trip.destination}
          </h4>
          <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
            Departure: {formatDeparture(trip.departureTime)}
          </p>
        </div>

        {/* Passenger count */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center justify-between gap-1 mb-1">
            <p className="text-xs font-bold uppercase" style={{ color: "var(--color-on-surface-variant)" }}>
              {trip.bookedPassengers >= trip.totalCapacity ? (
                <span className="text-rose-600 animate-pulse font-black">FULL CAPACITY</span>
              ) : (
                "Passenger Count"
              )}
            </p>
            {trip.totalCapacity - trip.bookedPassengers > 0 && (
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                {trip.totalCapacity - trip.bookedPassengers} Left
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-lg font-black ${trip.bookedPassengers >= trip.totalCapacity ? 'text-rose-600' : 'text-slate-900'}`}>
              {trip.bookedPassengers}
            </span>
            <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
              / {trip.totalCapacity} seats
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: "var(--color-surface-container-highest)" }}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${trip.bookedPassengers >= trip.totalCapacity ? 'bg-rose-500' : ''}`}
              style={{ width: `${Math.min(100, fillPct)}%`, backgroundColor: trip.bookedPassengers >= trip.totalCapacity ? undefined : fillColor }}
            />
          </div>
        </div>

        {/* Driver */}
        <div className="flex flex-col justify-center text-right md:pr-4">
          <p className="text-xs font-bold uppercase mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
            Driver
          </p>
          {trip.driverName ? (
            <>
              <p className="text-sm font-bold" style={{ color: "var(--color-on-surface)" }}>{trip.driverName}</p>
              {trip.driverVehicle && (
                <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>{trip.driverVehicle}</p>
              )}
            </>
          ) : (
            <p className="text-sm italic text-slate-400">Not Assigned</p>
          )}
        </div>
      </div>

      {/* Action chevron */}
      <button
        className="p-3 rounded-2xl transition-all"
        style={{ backgroundColor: "var(--color-surface-container-low)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--color-primary)";
          e.currentTarget.style.color = "white";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--color-surface-container-low)";
          e.currentTarget.style.color = "var(--color-on-surface-variant)";
        }}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

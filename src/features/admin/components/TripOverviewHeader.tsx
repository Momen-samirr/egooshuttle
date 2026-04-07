import { ArrowRight, CheckCircle2 } from "lucide-react";
import { TRIP_DRIVER_VISIBILITY_THRESHOLD } from "@/lib/constants";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  assigned:  { label: "Assigned",  className: "badge-assigned" },
  available: { label: "Ready",     className: "badge-ready" },
  pending:   { label: "Pending",   className: "badge-pending" },
  completed: { label: "Completed", className: "badge-ready" },
  cancelled: { label: "Cancelled", className: "badge-cancelled" },
};

function formatDeparture(iso: string): { time: string; label: string } {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { time: iso, label: "" };
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return { time, label: "Today" };
  const tmr = new Date(now); tmr.setDate(tmr.getDate() + 1);
  if (d.toDateString() === tmr.toDateString()) return { time, label: "Tomorrow" };
  return { time, label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
}

interface TripOverviewHeaderProps {
  origin: string;
  destination: string;
  departureTime: string;
  pricePerSeat: number;
  status: string;
  bookedPassengers: number;
  totalCapacity: number;
}

export function TripOverviewHeader(props: TripOverviewHeaderProps) {
  const { origin, destination, departureTime, pricePerSeat, status, bookedPassengers, totalCapacity } = props;
  const dep = formatDeparture(departureTime);
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const fillPct = totalCapacity > 0 ? Math.round((bookedPassengers / totalCapacity) * 100) : 0;
  const thresholdMet = bookedPassengers >= TRIP_DRIVER_VISIBILITY_THRESHOLD;

  return (
    <section className="rounded-xl p-8 mb-8 flex flex-col md:flex-row gap-8 items-center"
      style={{ backgroundColor: "var(--color-surface-container-low)" }}>
      {/* Info grid */}
      <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <p className="text-label-sm mb-2" style={{ color: "var(--color-on-surface-variant)" }}>Route</p>
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: "var(--color-primary)" }}>{origin}</span>
            <ArrowRight className="w-4 h-4 opacity-40" />
            <span className="font-semibold" style={{ color: "var(--color-primary)" }}>{destination}</span>
          </div>
        </div>
        <div>
          <p className="text-label-sm mb-2" style={{ color: "var(--color-on-surface-variant)" }}>Departure</p>
          <p className="text-xl font-bold">
            {dep.time}{" "}
            <span className="text-sm font-normal" style={{ color: "var(--color-on-surface-variant)" }}>{dep.label}</span>
          </p>
        </div>
        <div>
          <p className="text-label-sm mb-2" style={{ color: "var(--color-on-surface-variant)" }}>Price per Seat</p>
          <p className="text-xl font-bold">EGP {pricePerSeat.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-label-sm mb-2" style={{ color: "var(--color-on-surface-variant)" }}>Status</p>
          <span className={`${statusCfg.className} inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase`}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Passenger load */}
      <div className="w-full md:w-72">
        <div className="flex justify-between items-end mb-2">
          <p className="text-sm font-medium">Passenger Load</p>
          <p className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
            {bookedPassengers}/{totalCapacity}{" "}
            <span className="font-normal" style={{ color: "var(--color-on-surface-variant)" }}>Seats</span>
          </p>
        </div>
        <div className="h-3 w-full rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-surface-container-highest)" }}>
          <div className="h-full rounded-full relative transition-all duration-500"
            style={{ width: `${fillPct}%`, backgroundColor: "var(--color-primary)" }}>
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {thresholdMet ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--color-secondary)" }} />
              <p className="text-[11px] font-medium" style={{ color: "var(--color-secondary)" }}>
                Minimum threshold ({TRIP_DRIVER_VISIBILITY_THRESHOLD}) met
              </p>
            </>
          ) : (
            <p className="text-[11px] font-medium" style={{ color: "var(--color-tertiary)" }}>
              {TRIP_DRIVER_VISIBILITY_THRESHOLD - bookedPassengers} more needed for driver visibility
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

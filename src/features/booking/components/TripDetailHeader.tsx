import { MapPin, ArrowRight } from "lucide-react";

interface TripDetailHeaderProps {
  tripCode: string | null;
  origin: string;
  destination: string;
  departureTime: string;
  endTime?: string;
  pricePerSeat: number;
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:   { label: "Pending",   className: "badge-pending" },
  available: { label: "Available", className: "badge-ready" },
  assigned:  { label: "Active",    className: "badge-assigned" },
  completed: { label: "Completed", className: "badge-ready" },
  cancelled: { label: "Cancelled", className: "badge-cancelled" },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    // Might be bare HH:mm:ss
    const parts = iso.match(/(\d{1,2}):(\d{2})/);
    if (parts) {
      const h = parseInt(parts[1]);
      const m = parts[2];
      const ampm = h >= 12 ? "PM" : "AM";
      return `${String(h > 12 ? h - 12 : h || 12).padStart(2, "0")}:${m} ${ampm}`;
    }
    return iso;
  }
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function TripDetailHeader(props: TripDetailHeaderProps) {
  const { tripCode, origin, destination, departureTime, endTime, pricePerSeat, status } = props;
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  const depTime = formatTime(departureTime);
  const arrTime = endTime ? formatTime(endTime) : null;

  return (
    <div className="space-y-6">
      {/* Badges */}
      <div className="flex items-center gap-3 flex-wrap">
        {tripCode && (
          <span className="badge-assigned px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {tripCode}
          </span>
        )}
        <span className={`${statusCfg.className} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--color-on-surface)" }}>
        {origin}
      </h1>

      {/* Route points */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-3 h-3 rounded-full border-2 mt-1.5 shrink-0" style={{ borderColor: "var(--color-primary)" }} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-on-surface-variant)" }}>
              Pickup Point
            </p>
            <p className="text-base font-bold" style={{ color: "var(--color-on-surface)" }}>
              {origin}
            </p>
            <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
              {depTime} Departure
            </p>
          </div>
        </div>

        <div className="ml-1.5 h-6 w-0.5 opacity-30" style={{ backgroundColor: "var(--color-outline-variant)" }} />

        <div className="flex items-start gap-3">
          <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: "var(--color-primary)" }} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-on-surface-variant)" }}>
              Drop-off Point
            </p>
            <p className="text-base font-bold" style={{ color: "var(--color-on-surface)" }}>
              {destination}
            </p>
            {arrTime && (
              <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
                {arrTime} Arrival
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

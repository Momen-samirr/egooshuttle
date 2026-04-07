import { Bus, Star, ArrowLeftRight, User } from "lucide-react";

interface DriverAssignmentCardProps {
  driver: {
    name: string | null;
    avatarUrl: string | null;
    vehicle: string | null;
    vehicleModel: string | null;
    rating: number | null;
    totalTrips: number | null;
    isOnline: boolean;
  } | null;
}

export function DriverAssignmentCard({ driver }: DriverAssignmentCardProps) {
  if (!driver) {
    return (
      <div className="rounded-xl p-6 shadow-ambient border-t-4"
        style={{ backgroundColor: "var(--color-surface-container-lowest)", borderColor: "var(--color-outline-variant)" }}>
        <h3 className="text-label-sm mb-6" style={{ color: "var(--color-on-surface-variant)" }}>Assigned Driver</h3>
        <div className="flex flex-col items-center py-6 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "var(--color-surface-container-high)" }}>
            <User className="w-8 h-8" style={{ color: "var(--color-outline)" }} />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">No driver assigned</p>
          <p className="text-xs text-slate-400">Trip is waiting for a driver</p>
        </div>
        <button className="w-full py-3 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: "var(--color-surface-container-highest)", color: "var(--color-on-surface)" }}>
          <ArrowLeftRight className="w-4 h-4" />
          Assign Driver
        </button>
      </div>
    );
  }

  const initials = driver.name
    ? driver.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <div className="rounded-xl p-6 shadow-ambient border-t-4"
      style={{ backgroundColor: "var(--color-surface-container-lowest)", borderColor: "var(--color-primary)" }}>
      <h3 className="text-label-sm mb-6" style={{ color: "var(--color-on-surface-variant)" }}>Assigned Driver</h3>

      {/* Driver info */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative">
          {driver.avatarUrl ? (
            <img src={driver.avatarUrl} alt={driver.name ?? ""} className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-container))" }}>
              {initials}
            </div>
          )}
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 border-white rounded-full ${driver.isOnline ? "bg-green-500" : "bg-slate-300"}`} />
        </div>
        <div>
          <h4 className="text-lg font-bold">{driver.name ?? "Unknown"}</h4>
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
            <Bus className="w-4 h-4" />
            <span>Bus {driver.vehicle ?? "N/A"}</span>
            {driver.vehicleModel && (
              <>
                <span className="mx-1">•</span>
                <span>{driver.vehicleModel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 rounded-lg text-center" style={{ backgroundColor: "var(--color-surface-container-low)" }}>
          <p className="text-[10px] uppercase font-bold mb-1" style={{ color: "var(--color-on-surface-variant)" }}>Rating</p>
          <p className="font-bold flex items-center justify-center gap-1" style={{ color: "var(--color-primary)" }}>
            {driver.rating?.toFixed(1) ?? "—"} <Star className="w-3.5 h-3.5 fill-current" />
          </p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ backgroundColor: "var(--color-surface-container-low)" }}>
          <p className="text-[10px] uppercase font-bold mb-1" style={{ color: "var(--color-on-surface-variant)" }}>Trips</p>
          <p className="font-bold" style={{ color: "var(--color-primary)" }}>
            {driver.totalTrips != null ? driver.totalTrips.toLocaleString() : "—"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button className="w-full py-3 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: "var(--color-surface-container-highest)", color: "var(--color-on-surface)" }}>
          <ArrowLeftRight className="w-4 h-4" />
          Reassign Driver
        </button>
        <button className="w-full py-3 font-semibold text-sm rounded-xl transition-all border"
          style={{ borderColor: "rgba(193,198,214,0.2)", color: "var(--color-on-surface-variant)" }}>
          Release to Network
        </button>
      </div>
    </div>
  );
}

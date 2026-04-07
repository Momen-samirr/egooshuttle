import { Wifi, BatteryCharging, Armchair, Snowflake } from "lucide-react";

const AMENITIES = [
  { icon: Wifi,             label: "Free High-Speed Wi-Fi" },
  { icon: BatteryCharging,  label: "In-Seat Charging" },
  { icon: Armchair,         label: "Extra Legroom Seats" },
  { icon: Snowflake,        label: "Climate Control" },
];

export function TripAmenities() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {AMENITIES.map((a) => {
        const Icon = a.icon;
        return (
          <div
            key={a.label}
            className="flex flex-col items-center gap-2 p-5 rounded-xl text-center transition-colors hover:shadow-sm"
            style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
          >
            <Icon className="w-6 h-6" style={{ color: "var(--color-primary)" }} />
            <span className="text-xs font-bold" style={{ color: "var(--color-on-surface)" }}>
              {a.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

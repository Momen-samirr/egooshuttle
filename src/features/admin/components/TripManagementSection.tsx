import { AdminTripCard, type AdminTripData } from "./AdminTripCard";
import { Route } from "lucide-react";

interface TripManagementSectionProps {
  trips: AdminTripData[];
}

export function TripManagementSection({ trips }: TripManagementSectionProps) {
  return (
    <div className="xl:col-span-2 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: "var(--color-on-surface)" }}>
            Trip Management
          </h2>
          <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
            Monitoring real-time precision transit
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              backgroundColor: "var(--color-surface-container-highest)",
              color: "var(--color-on-surface-variant)",
            }}
          >
            Filter
          </button>
          <button
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              backgroundColor: "var(--color-surface-container-highest)",
              color: "var(--color-on-surface-variant)",
            }}
          >
            Export
          </button>
        </div>
      </div>

      {/* Trip cards */}
      <div className="space-y-4">
        {trips.length === 0 ? (
          <div
            className="p-12 rounded-xl text-center"
            style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
          >
            <Route className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-sm font-medium text-slate-400">
              No trips found. Create your first trip using the Fleet Tools.
            </p>
          </div>
        ) : (
          trips.map((trip) => (
            <AdminTripCard key={trip._id} trip={trip as AdminTripData} />
          ))
        )}
      </div>
    </div>
  );
}

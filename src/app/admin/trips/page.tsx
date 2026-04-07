import { TripManagementTab } from "@/features/admin/components/TripManagementTab";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trip Management | EgooBus Admin",
  description: "Manage and monitor all vehicle trips and routes",
};

export default function AdminTripsPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1
          className="text-3xl font-black tracking-tight"
          style={{ color: "var(--color-on-surface)" }}
        >
          Trip Management
        </h1>
        <p className="text-slate-500 mt-2">
          Monitor routes, manage capacity, and track real-time occupancy across
          the fleet.
        </p>
      </header>

      <TripManagementTab />
    </div>
  );
}

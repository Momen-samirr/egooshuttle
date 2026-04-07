import { BookingManagementTab } from "@/features/admin/components/BookingManagementTab";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking Management | EgooBus Admin",
  description: "Manage and monitor all vehicle bookings",
};

export default function AdminBookingsPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--color-on-surface)" }}>
          Booking Management
        </h1>
        <p className="text-slate-500 mt-2">
          Monitor payments, track multi-day bookings, and manage passenger manifests.
        </p>
      </header>
      
      <BookingManagementTab />
    </div>
  );
}

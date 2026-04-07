import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your EgooBus client dashboard — find trips, bookings, and commute tools.",
};

export default function ClientDashboardSegmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

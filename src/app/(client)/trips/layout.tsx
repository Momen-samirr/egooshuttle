import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Trips",
};

export default function TripsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

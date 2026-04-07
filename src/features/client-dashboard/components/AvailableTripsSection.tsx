"use client";

export function localTodayISO(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

import { PopularTripsCarousel } from "./PopularTripsCarousel";

export function AvailableTripsSection() {
  return (
    <div className="space-y-6 pt-4">
      <PopularTripsCarousel />
    </div>
  );
}

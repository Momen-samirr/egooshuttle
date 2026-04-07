/**
 * Client dashboard domain types — Convex-friendly shapes for later wiring.
 */

export type TripSearchMode = "range" | "one_way";

/** Legacy hyphenated mode used by TripSearchCard (kept for compatibility) */
export type BookingMode = "range" | "one-way";

export interface QuickRoute {
  id: string;
  label: string;
  subtitle: string;
  variant: "history" | "favorite";
}

export interface TripStop {
  name: string;
  timeLabel: string;
}

export interface AvailableTrip {
  id: string;
  lineName: string;
  tierLabel: string;
  pricePerDay: number;
  stops: [TripStop, TripStop];
  passLabel: string;
  isFull?: boolean;
  remaining?: number;
  badgeText?: string;
}

export interface UpcomingTrip {
  headline: string;
  departureLabel: string;
  minutesUntil: number;
  vehicleLabel: string;
  detailLine: string;
}

/** Loyalty / rewards snapshot — wire to backend promos later */
export interface EgooPoints {
  total: number;
  progressPercent: number;
}

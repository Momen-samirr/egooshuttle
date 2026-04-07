import type { AvailableTrip, QuickRoute, UpcomingTrip } from "./types";

export const MOCK_QUICK_ROUTES: QuickRoute[] = [
  {
    id: "qr-1",
    label: "Downtown → Business District",
    subtitle: "Last booked 2 days ago",
    variant: "history",
  },
  {
    id: "qr-2",
    label: "Home → Airport Express",
    subtitle: "Frequent route",
    variant: "favorite",
  },
];

export const MOCK_AVAILABLE_TRIPS: AvailableTrip[] = [
  {
    id: "t-402",
    lineName: "Express 402",
    tierLabel: "Premium Shuttle",
    pricePerDay: 12.5,
    stops: [
      { name: "Downtown Central", timeLabel: "08:30 AM" },
      { name: "Business District", timeLabel: "09:15 AM" },
    ],
    passLabel: "Daily Pass",
  },
  {
    id: "t-12",
    lineName: "Metro Link 12",
    tierLabel: "Standard Route",
    pricePerDay: 8,
    stops: [
      { name: "West Side Hub", timeLabel: "08:45 AM" },
      { name: "Business District", timeLabel: "09:40 AM" },
    ],
    passLabel: "Daily Pass",
  },
];

export const MOCK_UPCOMING: UpcomingTrip = {
  headline: "Happening Soon",
  departureLabel: "08:30 AM Today",
  minutesUntil: 14,
  vehicleLabel: "Bus #402 (Express)",
  detailLine: "Seat 12A • Downtown Terminal",
};

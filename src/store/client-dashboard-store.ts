"use client";

import { create } from "zustand";
import type { AvailableTrip, QuickRoute, TripSearchMode, UpcomingTrip } from "@/features/client-dashboard/types";
import {
  MOCK_AVAILABLE_TRIPS,
  MOCK_QUICK_ROUTES,
  MOCK_UPCOMING,
} from "@/features/client-dashboard/mock-data";

export interface ClientDashboardState {
  tripSearchMode: TripSearchMode;
  pickups: string[];
  dropoff: string;
  startTimeFilter: string;
  startDateLabel: string;
  endDateLabel: string;
  navSearchQuery: string;
  loyaltyPoints: number;
  nextRewardProgressPercent: number;
  quickRoutes: QuickRoute[];
  availableTrips: AvailableTrip[];
  upcomingTrip: UpcomingTrip | null;
  activeBusesOnRoute: number;
  setTripSearchMode: (mode: TripSearchMode) => void;
  setPickups: (v: string[]) => void;
  setDropoff: (v: string) => void;
  setStartTimeFilter: (v: string) => void;
  setStartDateLabel: (v: string) => void;
  setEndDateLabel: (v: string) => void;
  setNavSearchQuery: (v: string) => void;
  /** Reserved for Convex: replace trips in one call */
  setAvailableTrips: (trips: AvailableTrip[]) => void;
  setUpcomingTrip: (trip: UpcomingTrip | null) => void;
}

export const useClientDashboardStore = create<ClientDashboardState>((set) => ({
  tripSearchMode: "range",
  pickups: [],
  dropoff: "",
  startTimeFilter: "",
  startDateLabel: "Oct 24, 2023",
  endDateLabel: "Oct 31, 2023",
  navSearchQuery: "",
  loyaltyPoints: 2450,
  nextRewardProgressPercent: 75,
  quickRoutes: MOCK_QUICK_ROUTES,
  availableTrips: MOCK_AVAILABLE_TRIPS,
  upcomingTrip: MOCK_UPCOMING,
  activeBusesOnRoute: 3,
  setTripSearchMode: (mode) => set({ tripSearchMode: mode }),
  setPickups: (pickups) => set({ pickups }),
  setDropoff: (dropoff) => set({ dropoff }),
  setStartTimeFilter: (startTimeFilter) => set({ startTimeFilter }),
  setStartDateLabel: (startDateLabel) => set({ startDateLabel }),
  setEndDateLabel: (endDateLabel) => set({ endDateLabel }),
  setNavSearchQuery: (navSearchQuery) => set({ navSearchQuery }),
  setAvailableTrips: (availableTrips) => set({ availableTrips }),
  setUpcomingTrip: (upcomingTrip) => set({ upcomingTrip }),
}));

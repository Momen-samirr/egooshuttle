import { create } from "zustand";
import type { Trip } from "@/types";

interface TripState {
  trips: Trip[];
  selectedTrip: Trip | null;
  isLoading: boolean;
  filters: {
    origin: string;
    destination: string;
    date: string;
  };
  // Actions
  setTrips: (trips: Trip[]) => void;
  setSelectedTrip: (trip: Trip | null) => void;
  setLoading: (loading: boolean) => void;
  setFilters: (filters: Partial<TripState["filters"]>) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS = { origin: "", destination: "", date: "" };

export const useTripStore = create<TripState>()((set) => ({
  trips: [],
  selectedTrip: null,
  isLoading: false,
  filters: DEFAULT_FILTERS,

  setTrips: (trips) => set({ trips }),
  setSelectedTrip: (trip) => set({ selectedTrip: trip }),
  setLoading: (loading) => set({ isLoading: loading }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));

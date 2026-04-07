"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { TripOverviewHeader } from "@/features/admin/components/TripOverviewHeader";
import { PassengerListTable } from "@/features/admin/components/PassengerListTable";
import { TripControlButtons } from "@/features/admin/components/TripControlButtons";
import { DriverAssignmentCard } from "@/features/admin/components/DriverAssignmentCard";
import { TripRouteMapCard } from "@/features/admin/components/TripRouteMapCard";
import { ScheduleGrid } from "@/features/booking/components/ScheduleGrid";
import type { Id } from "../../../../../convex/_generated/dataModel";

/** Returns today in YYYY-MM-DD using the browser's LOCAL timezone. */
function localTodayISO(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Returns the Sunday that starts the week of `date` (using local date parts). */
function localWeekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // Sunday
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as Id<"trips">;

  const trip = useQuery(api.admin.getTripDetail, { tripId });

  const [currentClientWeekStart] = useState(() => localWeekStart(new Date()));
  const [weekStartDate, setWeekStartDate] = useState(currentClientWeekStart);
  
  const weeklyScheduleResult = useQuery(api.bookingDays.getWeeklySchedule, {
    tripId,
    weekStartDate,
    clientToday: localTodayISO(),
  });
  const scheduleData = weeklyScheduleResult?.schedule;

  const nextWeek = () => {
    const d = new Date(weekStartDate + "T00:00:00");
    d.setDate(d.getDate() + 7);
    setWeekStartDate(localWeekStart(d));
  };

  const prevWeek = () => {
    const d = new Date(weekStartDate + "T00:00:00");
    d.setDate(d.getDate() - 7);
    setWeekStartDate(localWeekStart(d));
  };

  // Loading state
  if (trip === undefined) {
    return (
      <div className="space-y-8">
        <div className="h-10 w-64 rounded-lg skeleton" />
        <div className="h-40 rounded-xl skeleton" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-64 rounded-xl skeleton" />
            <div className="h-24 rounded-xl skeleton" />
          </div>
          <div className="space-y-8">
            <div className="h-64 rounded-xl skeleton" />
            <div className="h-64 rounded-xl skeleton" />
          </div>
        </div>
      </div>
    );
  }

  // Error / not found — trip query threw
  if (trip === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-bold mb-2">Trip not found</p>
        <button onClick={() => router.push(ROUTES.ADMIN)} className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const departureDate = new Date(trip.departureTime);
  const dateStr = !isNaN(departureDate.getTime())
    ? departureDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div className="space-y-0">
      {/* Page header — trip code + date */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl transition-colors hover:bg-slate-100"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--color-on-surface-variant)" }} />
        </button>
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-blue-800">
            {trip.tripCode ?? `${trip.origin} → ${trip.destination}`}
          </h2>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-2" style={{ color: "var(--color-on-surface-variant)" }}>
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">{dateStr}</span>
          </div>
        </div>
      </div>

      {/* Trip overview band */}
      <TripOverviewHeader
        origin={trip.origin}
        destination={trip.destination}
        departureTime={trip.departureTime}
        pricePerSeat={trip.pricePerSeat}
        status={trip.status}
        bookedPassengers={trip.bookedPassengers}
        totalCapacity={trip.totalCapacity}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: passengers + controls */}
        <div className="lg:col-span-2 space-y-8">
          <PassengerListTable passengers={trip.passengers as any} />
          <TripControlButtons tripId={tripId} status={trip.status} />
        </div>

        {/* Right: schedule, map + driver */}
        <div className="space-y-8">
          <div className="rounded-xl shadow-ambient p-6" style={{ backgroundColor: "var(--color-surface-container-lowest)" }}>
            {scheduleData ? (
              <ScheduleGrid
                schedule={scheduleData}
                weekStartDate={weekStartDate}
                departureTime={trip.departureTime}
                selectedDays={new Set()}
                onToggleDay={() => {}}
                onPrevWeek={prevWeek}
                onNextWeek={nextWeek}
                canGoPrev={weekStartDate > currentClientWeekStart}
                readOnly={true}
              />
            ) : (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            )}
          </div>
          <TripRouteMapCard />
          <DriverAssignmentCard driver={trip.driver} />
        </div>
      </div>
    </div>
  );
}

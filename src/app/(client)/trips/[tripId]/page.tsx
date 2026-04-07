"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { ArrowLeft } from "lucide-react";
import { TripDetailHeader } from "@/features/booking/components/TripDetailHeader";
import { ScheduleGrid } from "@/features/booking/components/ScheduleGrid";
import { BookingSummary } from "@/features/booking/components/BookingSummary";
import { WeeksPicker } from "@/features/booking/components/WeeksPicker";
import { TripAmenities } from "@/features/booking/components/TripAmenities";
import { PaymentModal } from "@/features/booking/components/PaymentModal";
import type { Id } from "../../../../../convex/_generated/dataModel";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — use LOCAL date to avoid UTC vs local timezone mismatch
// ─────────────────────────────────────────────────────────────────────────────

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
  // Clone and back up to Sunday using LOCAL day-of-week
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // getDay() = 0 for Sunday in local tz
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function addWeeks(weekStart: string, n: number): string {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + n * 7);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function calculateDuration(start: string, end: string): string {
  const parse = (t: string) => {
    const p = t.match(/(\d{1,2}):(\d{2})/);
    if (!p) return 0;
    return parseInt(p[1]) * 60 + parseInt(p[2]);
  };
  const diff = parse(end) - parse(start);
  if (diff <= 0) return "—";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m` : ""}`.trim();
}

// Stable values computed once on mount (avoids hydration issues)
const CLIENT_TODAY = localTodayISO();
const CURRENT_WEEK_START = localWeekStart(new Date());

// ─────────────────────────────────────────────────────────────────────────────
// Day-of-week index: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4
// ─────────────────────────────────────────────────────────────────────────────
function dayIndexFromISO(dateStr: string): number {
  return new Date(dateStr + "T00:00:00").getDay();
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ClientTripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as Id<"trips">;

  // Week being previewed in the schedule grid
  const [weekStartDate, setWeekStartDate] = useState(CURRENT_WEEK_START);
  // Selected days (ISO strings within the preview week)
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  // How many consecutive weeks to book the same pattern
  const [numberOfWeeks, setNumberOfWeeks] = useState(1);
  // UI state
  const [isBooking, setIsBooking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [walletPaid, setWalletPaid] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // ── Queries ──
  const scheduleData = useQuery(api.bookingDays.getWeeklySchedule, {
    tripId,
    weekStartDate,
    clientToday: CLIENT_TODAY,       // ← timezone fix
  });

  const existingWeekBooking = useQuery(api.bookingDays.getUserWeekBooking, {
    tripId,
    weekStartDate,
  });

  // ── Mutations ──
  const createMultiWeek = useMutation(api.bookingDays.createMultiWeekBooking);
  const createSingleWeek = useMutation(api.bookingDays.createMultiDayBooking);

  // ── Handlers ──
  const toggleDay = useCallback((date: string) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
    setBookingResult(null);
  }, []);

  const goNextWeek = useCallback(() => {
    if (!scheduleData) return;
    setWeekStartDate(scheduleData.nextWeekStart);
    setSelectedDays(new Set());
    setBookingResult(null);
  }, [scheduleData]);

  const goPrevWeek = useCallback(() => {
    if (!scheduleData) return;
    setWeekStartDate(scheduleData.prevWeekStart);
    setSelectedDays(new Set());
    setBookingResult(null);
  }, [scheduleData]);

  const canGoPrev = weekStartDate > CURRENT_WEEK_START;

  const handleShowPayment = () => {
    if (selectedDays.size === 0) return;
    setWalletPaid(false);
    setShowPaymentModal(true);
  };

  const handleWalletPayment = async () => {
    setIsBooking(true);
    setBookingResult(null);

    try {
      if (numberOfWeeks === 1) {
        const result = await createSingleWeek({
          tripId,
          selectedDays: Array.from(selectedDays),
          seatsBooked: 1,
          paymentMethod: "wallet",
          clientToday: CLIENT_TODAY,
        });
        if (result.walletPaid) {
          setWalletPaid(true);
        }
      } else {
        const pattern = Array.from(selectedDays)
          .map(dayIndexFromISO)
          .sort((a, b) => a - b);

        const result = await createMultiWeek({
          tripId,
          dayPattern: pattern,
          startWeekDate: weekStartDate,
          numberOfWeeks,
          paymentMethod: "wallet",
          clientToday: CLIENT_TODAY,
        });
        if (result.walletPaid) {
          setWalletPaid(true);
        }
      }
    } catch (err) {
      setBookingResult({
        success: false,
        message: err instanceof Error ? err.message : "Booking failed. Please try again.",
      });
      setShowPaymentModal(false);
    } finally {
      setIsBooking(false);
    }
  };

  // ── Loading skeleton ──
  if (scheduleData === undefined) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-6 w-32 rounded-lg bg-slate-200" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-5">
            <div className="h-52 rounded-2xl bg-slate-200" />
            <div className="h-44 rounded-2xl bg-slate-200" />
            <div className="h-32 rounded-2xl bg-slate-200" />
          </div>
          <div className="lg:col-span-2 space-y-5">
            <div className="h-52 rounded-2xl bg-slate-200" />
            <div className="h-96 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  const { trip, schedule } = scheduleData;
  const alreadyBookedDates = existingWeekBooking?.bookedDates ?? [];

  return (
    <div className="space-y-10">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
        style={{ color: "var(--color-on-surface-variant)" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Trips
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* ────── Left sidebar ────── */}
        <div className="space-y-5">
          {/* Trip header */}
          <TripDetailHeader
            tripCode={trip.tripCode}
            origin={trip.origin}
            destination={trip.destination}
            departureTime={trip.departureTime}
            endTime={trip.endTime ?? undefined}
            pricePerSeat={trip.pricePerSeat}
            status={trip.status}
          />

          {/* Existing booking badge for this week */}
          {existingWeekBooking && alreadyBookedDates.length > 0 && (
            <div
              className="p-4 rounded-2xl space-y-2"
              style={{ backgroundColor: "var(--color-secondary-container)" }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--color-secondary)" }}
              >
                Your bookings this week
              </p>
              <p className="text-sm font-bold" style={{ color: "var(--color-on-surface)" }}>
                {alreadyBookedDates.length} / 5 days booked
              </p>
              <div className="flex flex-wrap gap-1">
                {alreadyBookedDates.sort().map((d) => (
                  <span
                    key={d}
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ backgroundColor: "var(--color-secondary)", color: "white" }}
                  >
                    {new Date(d + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                ))}
              </div>
              {alreadyBookedDates.length === 5 && (
                <p className="text-xs font-bold" style={{ color: "var(--color-secondary)" }}>
                  ✓ Full week booked! Navigate to next week to book more.
                </p>
              )}
            </div>
          )}

          {/* Weeks picker */}
          <WeeksPicker
            value={numberOfWeeks}
            onChange={(w) => {
              setNumberOfWeeks(w);
              setBookingResult(null);
            }}
          />

          {/* Booking summary */}
          <BookingSummary
            pricePerSeat={trip.pricePerSeat}
            selectedDaysCount={selectedDays.size}
            numberOfWeeks={numberOfWeeks}
            seatsCount={1}
            onConfirm={handleShowPayment}
            isLoading={isBooking}
            isDisabled={selectedDays.size === 0}
          />

          {/* Result banner */}
          {bookingResult && (
            <div
              className="p-4 rounded-2xl text-sm font-medium"
              style={{
                backgroundColor: bookingResult.success
                  ? "var(--color-secondary-container)"
                  : "#fce8e6",
                color: bookingResult.success
                  ? "var(--color-secondary)"
                  : "var(--color-error)",
              }}
            >
              {bookingResult.message}
            </div>
          )}

          {/* Pricing reference card */}
          <div
            className="p-4 rounded-2xl space-y-2"
            style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Pricing Reference
            </p>
            {[1, 2, 3, 4, 5].map((days) => (
              <div key={days} className="flex justify-between text-xs">
                <span style={{ color: "var(--color-on-surface-variant)" }}>
                  {days} day{days > 1 ? "s" : ""} / week
                  {numberOfWeeks > 1 ? ` × ${numberOfWeeks} weeks` : ""}
                </span>
                <span className="font-bold" style={{ color: "var(--color-on-surface)" }}>
                  EGP {(trip.pricePerSeat * days * numberOfWeeks).toFixed(0)}
                </span>
              </div>
            ))}
            <p
              className="text-[10px] pt-1 border-t"
              style={{
                color: "var(--color-on-surface-variant)",
                borderColor: "rgba(193,198,214,0.2)",
              }}
            >
              Sun → Thu are working days. Fri &amp; Sat are off.
            </p>
          </div>
        </div>

        {/* ────── Right content ────── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Route map */}
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{ backgroundColor: "#0f1623" }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            <svg className="w-full h-44 md:h-52" viewBox="0 0 600 180" fill="none">
              <path
                d="M60 150 C160 130, 250 45, 360 65 C450 80, 490 35, 535 20"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="9 5"
                opacity="0.85"
              />
              <circle cx="60" cy="150" r="6" fill="var(--color-primary)" />
              <circle cx="60" cy="150" r="13" fill="var(--color-primary)" opacity="0.15" />
              <circle cx="300" cy="82" r="4" fill="var(--color-primary)" opacity="0.5" />
              <circle cx="535" cy="20" r="6" fill="var(--color-primary)" />
              <circle cx="535" cy="20" r="13" fill="var(--color-primary)" opacity="0.15" />
            </svg>
            <div
              className="absolute bottom-0 inset-x-0 px-5 py-3 flex justify-between items-center"
              style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.55))" }}
            >
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/50">
                  Duration
                </p>
                <p className="text-sm font-bold text-white">
                  {trip.endTime ? calculateDuration(trip.departureTime, trip.endTime) : "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/50">
                  Seats / Day
                </p>
                <p className="text-sm font-bold text-white">{schedule[0]?.capacity ?? 14}</p>
              </div>
            </div>
          </div>

          {/* Multi-week info banner */}
          {numberOfWeeks > 1 && selectedDays.size > 0 && (
            <div
              className="p-4 rounded-2xl flex items-start gap-3"
              style={{ backgroundColor: "var(--color-primary-fixed)" }}
            >
              <span className="text-xl">📅</span>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
                  Multi-week booking active
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-on-surface-variant)" }}>
                  Your selection of {selectedDays.size} day
                  {selectedDays.size > 1 ? "s" : ""} will be repeated for{" "}
                  <strong>{numberOfWeeks} consecutive weeks</strong> starting this week.
                  Total:{" "}
                  <strong>
                    {selectedDays.size * numberOfWeeks} rides
                  </strong>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Week schedule grid */}
          <ScheduleGrid
            schedule={schedule}
            weekStartDate={weekStartDate}
            departureTime={trip.departureTime}
            selectedDays={selectedDays}
            alreadyBookedDates={alreadyBookedDates}
            onToggleDay={toggleDay}
            onPrevWeek={goPrevWeek}
            onNextWeek={goNextWeek}
            canGoPrev={canGoPrev}
          />

          <TripAmenities />
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handleWalletPayment}
        durationText={`${selectedDays.size * numberOfWeeks} Rides Selected`}
        seatsCount={1}
        selectedDaysCount={selectedDays.size}
        startDate={weekStartDate}
        endDate={numberOfWeeks > 1 ? addWeeks(weekStartDate, numberOfWeeks - 1) : addWeeks(weekStartDate, 0)}
        baseFare={scheduleData?.trip?.pricePerSeat * selectedDays.size * numberOfWeeks || 0}
        serviceFee={scheduleData?.trip?.pricePerSeat * selectedDays.size * numberOfWeeks * 0.05 || 0}
        totalAmount={(scheduleData?.trip?.pricePerSeat * selectedDays.size * numberOfWeeks * 1.05) || 0}
        isLoading={isBooking}
        walletPaid={walletPaid}
      />
    </div>
  );
}

"use client";

import { ChevronRight, ChevronLeft, ChevronRight as ChevronRightIcon, Check } from "lucide-react";

export interface DayAvailability {
  date: string;
  dayLabel: string;      // "Sun", "Mon", …
  booked: number;
  remaining: number;
  capacity: number;
  isFull: boolean;
  isPast: boolean;
  isToday: boolean;
}

interface ScheduleGridProps {
  schedule: DayAvailability[];
  weekStartDate: string;          // ISO Sunday
  departureTime: string;
  selectedDays: Set<string>;
  alreadyBookedDates?: string[];  // dates already booked by this user this week
  onToggleDay: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  canGoPrev: boolean;             // false when weekStartDate == currentWeekStart
  readOnly?: boolean;
}

const DAY_FULL: Record<string, string> = {
  Sun: "Sunday", Mon: "Monday", Tue: "Tuesday",
  Wed: "Wednesday", Thu: "Thursday",
};

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00Z");
  const end = new Date(weekStart + "T00:00:00Z");
  end.setUTCDate(end.getUTCDate() + 4); // Thu
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

function formatTime(iso: string): string {
  const parts = iso.match(/(\d{1,2}):(\d{2})/);
  if (!parts) return iso;
  const h = parseInt(parts[1]);
  const m = parts[2];
  return `${String(h > 12 ? h - 12 : h || 12).padStart(2, "0")}:${m} ${h >= 12 ? "PM" : "AM"}`;
}

export function ScheduleGrid({
  schedule,
  weekStartDate,
  departureTime,
  selectedDays,
  alreadyBookedDates = [],
  onToggleDay,
  onPrevWeek,
  onNextWeek,
  canGoPrev,
  readOnly = false,
}: ScheduleGridProps) {
  const depTime = formatTime(departureTime);
  const alreadyBookedSet = new Set(alreadyBookedDates);

  return (
    <div className="space-y-5">
      {/* Header: week label + navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-on-surface)" }}>
            Schedule &amp; Availability
          </h2>
          <p className="text-xs font-medium mt-0.5" style={{ color: "var(--color-on-surface-variant)" }}>
            Working week: {formatWeekLabel(weekStartDate)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevWeek}
            disabled={!canGoPrev}
            className="p-2 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100"
            title="Previous week"
          >
            <ChevronLeft className="w-4 h-4" style={{ color: "var(--color-on-surface-variant)" }} />
          </button>
          <button
            onClick={onNextWeek}
            className="p-2 rounded-xl transition-colors hover:bg-slate-100"
            title="Next week"
          >
            <ChevronRightIcon className="w-4 h-4" style={{ color: "var(--color-on-surface-variant)" }} />
          </button>
        </div>
      </div>

      {/* Working-days legend */}
      <div className="flex gap-1 flex-wrap">
        {["Sun", "Mon", "Tue", "Wed", "Thu"].map((d) => (
          <span key={d} className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
            style={{ backgroundColor: "var(--color-surface-container-high)", color: "var(--color-on-surface-variant)" }}>
            {d}
          </span>
        ))}
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-1"
          style={{ backgroundColor: "var(--color-surface-container)", color: "var(--color-on-surface-variant)" }}>
          Fri &amp; Sat off
        </span>
      </div>

      {/* Day cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {schedule.map((day) => {
          const isSelected = !readOnly && selectedDays.has(day.date);
          const isAlreadyBooked = !readOnly && alreadyBookedSet.has(day.date);
          const isDisabled = readOnly || day.isPast || day.isFull || isAlreadyBooked;
          const isLow = !day.isFull && day.remaining > 0 && day.remaining <= 3;

          return (
            <button
              key={day.date}
              onClick={() => !isDisabled && !readOnly && onToggleDay(day.date)}
              disabled={isDisabled}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all text-left w-full ${
                isDisabled && !readOnly ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"
              } ${readOnly ? "cursor-default" : ""}`}
              style={{
                backgroundColor: isAlreadyBooked
                  ? "var(--color-secondary-container)"
                  : isSelected
                    ? "var(--color-primary-fixed)"
                    : "var(--color-surface-container-lowest)",
                outline: isSelected ? "2px solid var(--color-primary)" : undefined,
                outlineOffset: "2px",
              }}
            >
              {/* Date block */}
              <div
                className="w-16 h-16 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold"
                style={{
                  backgroundColor: isAlreadyBooked
                    ? "var(--color-secondary)"
                    : day.isPast
                      ? "var(--color-surface-container-high)"
                      : day.isFull
                        ? "var(--color-surface-container-highest)"
                        : isSelected
                          ? "var(--color-primary)"
                          : "var(--color-surface-container-low)",
                  color: isAlreadyBooked || isSelected ? "white" : "var(--color-on-surface)",
                }}
              >
                <span className="text-[10px] font-bold uppercase">{day.dayLabel}</span>
                <span className="text-lg font-black leading-tight">
                  {new Date(day.date + "T00:00:00Z").getUTCDate()}
                </span>
                {day.isToday && (
                  <span className="text-[8px] font-bold uppercase tracking-wider opacity-80">Today</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {isAlreadyBooked ? (
                  <>
                    <p className="text-sm font-bold" style={{ color: "var(--color-secondary)" }}>
                      ✓ Already Booked
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
                      {depTime} Departure
                    </p>
                  </>
                ) : day.isPast ? (
                  <>
                    <p className="text-sm font-medium line-through" style={{ color: "var(--color-on-surface-variant)" }}>
                      {depTime} Departure
                    </p>
                    <p className="text-xs font-medium" style={{ color: "var(--color-on-surface-variant)" }}>
                      Day passed
                    </p>
                  </>
                ) : day.isFull ? (
                  <>
                    <p className="text-sm font-medium line-through" style={{ color: "var(--color-on-surface-variant)" }}>
                      {depTime} Departure
                    </p>
                    <p className="text-xs font-bold" style={{ color: "var(--color-error)" }}>● Fully Booked</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold" style={{ color: "var(--color-on-surface)" }}>
                      {depTime} Departure
                    </p>
                    <p className="text-xs font-medium" style={{
                      color: isLow ? "var(--color-error)" : "var(--color-secondary)",
                    }}>
                      ● {isLow ? `Last ${day.remaining} seats!` : `${day.remaining} seats remaining`}
                    </p>
                  </>
                )}
              </div>

              {/* Right indicator */}
              <div className="shrink-0">
                {readOnly ? (
                  day.isPast ? (
                    <span className="text-[10px] font-bold uppercase line-through" style={{ color: "var(--color-on-surface-variant)" }}>Past</span>
                  ) : day.isFull ? (
                    <span className="text-[10px] font-bold uppercase text-red-500">Full</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase text-green-600">{day.remaining} left</span>
                  )
                ) : isAlreadyBooked ? (
                  <Check className="w-5 h-5" style={{ color: "var(--color-secondary)" }} />
                ) : day.isFull || day.isPast ? (
                  <span className="text-[10px] font-bold uppercase" style={{ color: "var(--color-on-surface-variant)" }}>
                    {day.isPast ? "Past" : "Full"}
                  </span>
                ) : isSelected ? (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-primary)" }}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <ChevronRight className="w-5 h-5" style={{ color: "var(--color-on-surface-variant)" }} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Full-week hint */}
      {schedule.filter((d) => !d.isPast && !d.isFull).length === schedule.filter((d) => selectedDays.has(d.date)).length &&
       selectedDays.size === 5 && (
        <div className="flex items-center gap-2 p-3 rounded-xl"
          style={{ backgroundColor: "var(--color-secondary-container)" }}>
          <Check className="w-4 h-4" style={{ color: "var(--color-secondary)" }} />
          <p className="text-sm font-bold" style={{ color: "var(--color-secondary)" }}>
            Full week selected! You&apos;ve booked all 5 working days.
          </p>
        </div>
      )}
    </div>
  );
}

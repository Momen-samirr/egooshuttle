"use client";

import { Minus, Plus } from "lucide-react";

interface WeeksPickerProps {
  value: number;
  onChange: (weeks: number) => void;
  min?: number;
  max?: number;
}

const PRESETS = [1, 2, 4] as const;

export function WeeksPicker({ value, onChange, min = 1, max = 12 }: WeeksPickerProps) {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--color-on-surface)" }}>
            Number of Weeks
          </p>
          <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
            Repeat your selected day pattern
          </p>
        </div>
        {/* Counter */}
        <div className="flex items-center gap-3">
          <button
            onClick={decrement}
            disabled={value <= min}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--color-surface-container-high)" }}
          >
            <Minus className="w-4 h-4" style={{ color: "var(--color-on-surface)" }} />
          </button>

          <span
            className="w-10 text-center text-xl font-black"
            style={{ color: "var(--color-primary)" }}
          >
            {value}
          </span>

          <button
            onClick={increment}
            disabled={value >= max}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--color-surface-container-high)" }}
          >
            <Plus className="w-4 h-4" style={{ color: "var(--color-on-surface)" }} />
          </button>
        </div>
      </div>

      {/* Preset chips */}
      <div className="flex gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              backgroundColor:
                value === preset ? "var(--color-primary)" : "var(--color-surface-container-high)",
              color: value === preset ? "white" : "var(--color-on-surface)",
            }}
          >
            {preset === 1 ? "1 week" : preset === 4 ? "1 month" : `${preset} weeks`}
          </button>
        ))}
        {![1, 2, 4].includes(value) && (
          <div
            className="flex-1 py-2 rounded-xl text-xs font-bold text-center"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "white",
            }}
          >
            {value}w custom
          </div>
        )}
      </div>

      {value > 1 && (
        <p className="text-[10px]" style={{ color: "var(--color-on-surface-variant)" }}>
          Booking starts this week and repeats for {value} consecutive working weeks.
        </p>
      )}
    </div>
  );
}

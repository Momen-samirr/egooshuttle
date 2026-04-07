"use client";

import { Loader2 } from "lucide-react";

interface BookingSummaryProps {
  pricePerSeat: number;
  selectedDaysCount: number;   // days per week (pattern)
  numberOfWeeks: number;       // how many consecutive weeks
  seatsCount: number;
  onConfirm: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

const CONVENIENCE_FEE_PERCENT = 0.05;

export function BookingSummary({
  pricePerSeat,
  selectedDaysCount,
  numberOfWeeks,
  seatsCount,
  onConfirm,
  isLoading,
  isDisabled,
}: BookingSummaryProps) {
  const effectiveDays = selectedDaysCount * numberOfWeeks;
  const subtotal = pricePerSeat * effectiveDays * seatsCount;
  const convenienceFee = Math.round(subtotal * CONVENIENCE_FEE_PERCENT * 100) / 100;
  const total = subtotal + convenienceFee;

  const hasSelection = selectedDaysCount > 0;

  return (
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
    >
      <h3 className="text-lg font-bold" style={{ color: "var(--color-on-surface)" }}>
        Booking Summary
      </h3>

      <div className="space-y-3">
        {/* Fare row */}
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--color-on-surface-variant)" }}>
            {hasSelection ? (
              <>
                EGP {pricePerSeat} × {selectedDaysCount} day{selectedDaysCount !== 1 ? "s" : ""}
                {numberOfWeeks > 1 && <> × {numberOfWeeks} weeks</>}
              </>
            ) : (
              "Standard Fare"
            )}
          </span>
          <span className="font-medium" style={{ color: "var(--color-on-surface)" }}>
            {hasSelection ? `EGP ${subtotal.toFixed(2)}` : "—"}
          </span>
        </div>

        {/* Convenience fee */}
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--color-on-surface-variant)" }}>Service Fee (5%)</span>
          <span className="font-medium" style={{ color: "var(--color-on-surface)" }}>
            {hasSelection ? `EGP ${convenienceFee.toFixed(2)}` : "—"}
          </span>
        </div>

        {/* Summary badge for multi-week */}
        {hasSelection && numberOfWeeks > 1 && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
            style={{
              backgroundColor: "var(--color-primary-fixed)",
              color: "var(--color-primary)",
            }}
          >
            📅 {numberOfWeeks} weeks × {selectedDaysCount} days = {effectiveDays} total rides
          </div>
        )}

        <div
          className="h-px"
          style={{ backgroundColor: "var(--color-outline-variant)", opacity: 0.2 }}
        />

        <div className="flex justify-between items-center">
          <span className="text-base font-bold" style={{ color: "var(--color-on-surface)" }}>
            Total
          </span>
          <span className="text-2xl font-black" style={{ color: "var(--color-primary)" }}>
            {hasSelection ? `EGP ${total.toFixed(2)}` : "—"}
          </span>
        </div>
      </div>

      <button
        onClick={onConfirm}
        disabled={isDisabled || isLoading}
        className="w-full py-4 rounded-2xl text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)",
          boxShadow:
            hasSelection && !isDisabled
              ? "0 8px 24px rgba(0, 91, 191, 0.25)"
              : "none",
        }}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        ) : hasSelection ? (
          `Confirm ${effectiveDays} Ride${effectiveDays !== 1 ? "s" : ""}`
        ) : (
          "Select Days to Book"
        )}
      </button>

      <p className="text-[10px] text-center" style={{ color: "var(--color-on-surface-variant)" }}>
        By confirming, you agree to EgooBus&apos;s Terms of Service and Cancellation Policy.
      </p>
    </div>
  );
}

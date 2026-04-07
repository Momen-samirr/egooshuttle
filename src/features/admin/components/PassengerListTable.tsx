"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Mail, XCircle, SlidersHorizontal, Download, CreditCard, Banknote } from "lucide-react";
import { useState } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";

export interface PassengerRow {
  bookingId: Id<"bookings">;
  userName: string;
  userPhone: string | null;
  userEmail: string | null;
  paymentMethod: "cash" | "card" | "instapay";
  paymentStatus: "pending" | "paid" | "failed";
  bookingStatus: "pending" | "confirmed" | "cancelled";
  seatsBooked: number;
  totalAmount: number;
  bookedDates: string[];
  daysCount: number;
  weekStartDate: string | undefined;
}

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  paid:      { label: "Paid",      className: "bg-green-100 text-green-700" },
  pending:   { label: "Unpaid",    className: "bg-amber-100 text-amber-700" },
  failed:    { label: "Failed",    className: "bg-rose-100 text-rose-700" },
};

const BOOKING_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-700" },
  pending:   { label: "Pending",   className: "bg-slate-100 text-slate-600" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; icon: any }> = {
  card:     { label: "Card",     icon: CreditCard },
  cash:     { label: "Cash",     icon: Banknote },
  instapay: { label: "InstaPay", icon: Banknote },
};

interface PassengerListTableProps {
  passengers: PassengerRow[];
}

export function PassengerListTable({ passengers }: PassengerListTableProps) {
  const cancelBooking = useMutation(api.admin.cancelBookingAdmin);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const handleCancel = async (bookingId: Id<"bookings">) => {
    if (!confirm("Cancel this passenger's booking?")) return;
    setCancelling(bookingId);
    try {
      await cancelBooking({ bookingId });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setCancelling(null);
    }
  };

  const activePassengers = passengers.filter((p) => p.bookingStatus !== "cancelled");

  return (
    <div className="rounded-xl overflow-hidden shadow-ambient" style={{ backgroundColor: "var(--color-surface-container-lowest)" }}>
      {/* Header */}
      <div className="px-6 py-5 flex justify-between items-center" style={{ borderBottom: "1px solid rgba(193,198,214,0.1)" }}>
        <h3 className="text-lg font-semibold">Passenger List</h3>
        <div className="flex gap-2">
          <button className="p-2 rounded-lg transition-colors hover:bg-slate-100">
            <SlidersHorizontal className="w-5 h-5" style={{ color: "var(--color-on-surface-variant)" }} />
          </button>
          <button className="p-2 rounded-lg transition-colors hover:bg-slate-100">
            <Download className="w-5 h-5" style={{ color: "var(--color-on-surface-variant)" }} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead style={{ backgroundColor: "var(--color-surface-container-low)" }}>
            <tr>
              {["Name", "Days Booked", "Price", "Payment", "Booking", "Method", "Actions"].map((h) => (
                <th key={h} className="px-6 py-4 text-label-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "rgba(193,198,214,0.1)" }}>
            {activePassengers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-400">
                  No passengers booked yet.
                </td>
              </tr>
            ) : (
              activePassengers.map((p) => {
                const payCfg = PAYMENT_STATUS_CONFIG[p.paymentStatus] ?? PAYMENT_STATUS_CONFIG.pending;
                const bookCfg = BOOKING_STATUS_CONFIG[p.bookingStatus] ?? BOOKING_STATUS_CONFIG.pending;
                const methodCfg = PAYMENT_METHOD_CONFIG[p.paymentMethod] ?? PAYMENT_METHOD_CONFIG.cash;
                const MethodIcon = methodCfg.icon;

                return (
                  <tr key={p.bookingId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm">{p.userName}</p>
                      <p className="text-[11px]" style={{ color: "var(--color-on-surface-variant)" }}>
                        {p.userPhone ?? p.userEmail ?? "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold">{p.daysCount} day{p.daysCount > 1 ? "s" : ""}</span>
                        <div className="flex flex-wrap gap-1">
                          {p.bookedDates.slice(0, 3).map((date) => {
                            const dateObj = new Date(date + "T00:00:00");
                            const dateLabel = !isNaN(dateObj.getTime())
                              ? dateObj.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })
                              : date;
                            return (
                              <span key={date} className="text-[9px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: "var(--color-surface-container-highest)" }}>
                                {dateLabel}
                              </span>
                            );
                          })}
                          {p.bookedDates.length > 3 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium text-slate-400">
                              +{p.bookedDates.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-black" style={{ color: "var(--color-on-surface)" }}>
                        EGP {p.totalAmount.toFixed(0)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`${payCfg.className} px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tight`}>
                        {payCfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`${bookCfg.className} px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tight`}>
                        {bookCfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "var(--color-on-surface-variant)" }}>
                        <MethodIcon className="w-3.5 h-3.5" />
                        {methodCfg.label}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded transition-colors hover:bg-blue-50"
                          style={{ color: "var(--color-primary)" }}
                          title="Contact passenger">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded transition-colors hover:bg-red-50 disabled:opacity-40"
                          style={{ color: "var(--color-error)" }}
                          onClick={() => handleCancel(p.bookingId)}
                          disabled={cancelling === p.bookingId}
                          title="Cancel booking"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { CheckCircle2, CalendarDays, X, Wallet, ArrowRight, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  // Booking Summary Data
  durationText: string;
  seatsCount: number;
  selectedDaysCount: number;
  startDate: string;
  endDate: string;
  baseFare: number;
  serviceFee: number;
  totalAmount: number;
  isLoading: boolean;
  // Wallet (instant confirm)
  walletPaid?: boolean;
}

export function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  durationText,
  seatsCount,
  selectedDaysCount,
  startDate,
  endDate,
  baseFare,
  serviceFee,
  totalAmount,
  isLoading,
  walletPaid,
}: PaymentModalProps) {
  const router = useRouter();
  const walletData = useQuery(api.wallet.getMyWallet);

  const hasEnoughBalance = walletData && walletData.balance >= totalAmount;
  const shortfall = walletData ? totalAmount - walletData.balance : totalAmount;

  useEffect(() => {
    if (walletPaid) {
      router.push("/bookings");
    }
  }, [walletPaid, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* ── Success State ── */}
        {walletPaid ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-900">Payment Successful!</h2>
            <p className="text-slate-500">Redirecting to your bookings...</p>
          </div>
        ) : (
          /* ── Confirm Booking ── */
          <div className="p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Confirm Booking</h2>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Booking Summary */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                Booking Summary
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Duration</p>
                  <p className="text-sm font-bold text-slate-900">{durationText}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Daily Seats</p>
                  <p className="text-sm font-bold text-slate-900">{seatsCount} Seat Secured</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-green-600 w-4 h-4" />
                    <span className="text-xs font-medium text-slate-700">
                      Availability confirmed for all {selectedDaysCount} days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Period */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarDays className="text-blue-600 w-5 h-5" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Selected Period
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {startDate} - {endDate}
                  </p>
                </div>
              </div>
              <button disabled={isLoading} onClick={onClose} className="text-blue-600 text-xs font-bold hover:opacity-80 disabled:opacity-50">
                Change
              </button>
            </div>

            {/* ── Wallet Payment Method (Only Option) ── */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Payment Method
                </span>
              </div>

              {/* Wallet Card — always selected */}
              <div className="border-2 border-emerald-600 bg-emerald-50 rounded-2xl p-5 relative">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">EgooBus Wallet</p>
                    <p className="text-xs text-slate-500 mt-0.5">Instant confirmation</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-600">
                      EGP {(walletData?.balance ?? 0).toFixed(2)}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Balance
                    </p>
                  </div>
                </div>

                {/* Check mark */}
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                </div>
              </div>

              {/* Balance Status */}
              <div className="mt-4">
                {walletData === undefined ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100">
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium text-slate-500">Loading wallet...</span>
                  </div>
                ) : hasEnoughBalance ? (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold">
                      Sufficient balance — EGP {walletData.balance.toFixed(2)} available
                    </span>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-xl space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-red-600">
                          Insufficient balance
                        </p>
                        <p className="text-xs text-red-500 mt-0.5">
                          You need <strong>EGP {shortfall.toFixed(2)}</strong> more.
                          Current balance: EGP {(walletData?.balance ?? 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/wallet"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
                    >
                      <Wallet className="w-4 h-4" />
                      Top Up Wallet
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Base Fare</span>
                <span className="font-bold text-slate-900">EGP {baseFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Service Fee</span>
                <span className="font-bold text-slate-900">EGP {serviceFee.toFixed(2)}</span>
              </div>
              <div className="h-px bg-slate-200 my-2" />
              <div className="flex justify-between text-lg font-black">
                <span className="text-slate-900">Total</span>
                <span className="text-blue-600">EGP {totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={onConfirm}
              disabled={isLoading || !hasEnoughBalance}
              className={cn(
                "w-full py-4 rounded-xl font-black text-lg shadow-lg active:scale-[0.98] transition-all flex justify-center items-center gap-2",
                hasEnoughBalance
                  ? "bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              )}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : hasEnoughBalance ? (
                <>
                  <Wallet className="w-5 h-5" />
                  Pay with Wallet
                </>
              ) : (
                "Insufficient Balance"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

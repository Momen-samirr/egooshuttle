"use client";

import { CreditCard, HelpCircle, CheckCircle2, CalendarDays, X, Banknote } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { InstaPayWorkflow } from "./InstaPayWorkflow";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMethod: "card-iframe" | "instapay";
  onMethodChange: (method: "card-iframe" | "instapay") => void;
  onConfirm: (method: "card-iframe" | "instapay") => void;
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
  // Iframe rendering
  paymentKey?: string;
  iframeId?: string;
  intentId?: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  selectedMethod,
  onMethodChange,
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
  paymentKey,
  iframeId,
  intentId,
}: PaymentModalProps) {
  const router = useRouter();

  const intentStatus = useQuery(api.payments.getIntentStatus, {
    intentId: intentId,
  });

  useEffect(() => {
    if (intentStatus?.status === "success") {
      router.push("/bookings"); // redirect to bookings page on success
    } else if (intentStatus?.status === "failed") {
      alert(`Payment failed: ${intentStatus.failureReason}`);
      onClose(); // Auto close to let them retry
    }
  }, [intentStatus, router, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {paymentKey && iframeId ? (
          <div className="flex flex-col h-[85vh] w-full relative">
            <div className="p-4 border-b flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-lg font-bold text-slate-900">
                  Secure Payment Gateway
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title="Cancel Payment"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 w-full bg-slate-50 relative overflow-hidden flex flex-col p-6">
                <iframe 
                  src={`https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`}
                  className="w-full h-full absolute inset-0 border-0"
                  allow="payment *"
                  title="Paymob Payment"
                />
            </div>
          </div>
        ) : intentId && selectedMethod === "instapay" ? (
          <div className="p-8 overflow-y-auto">
            <InstaPayWorkflow 
              paymentIntentId={intentId as Id<"paymentHistory">}
              amount={totalAmount}
              onClose={onClose}
            />
          </div>
        ) : intentStatus?.status === "success" ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
             <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
             <h2 className="text-2xl font-bold text-slate-900">Payment Successful!</h2>
             <p className="text-slate-500">Redirecting to your bookings...</p>
          </div>
        ) : (
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

            <div className="bg-slate-50 rounded-2xl p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Payment Method
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onMethodChange("card-iframe")}
                  className={cn(
                    "border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all",
                    selectedMethod === "card-iframe" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  )}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-sm font-bold whitespace-nowrap">Pay with card</span>
                </button>
                <button
                  onClick={() => onMethodChange("instapay")}
                  className={cn(
                    "border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all",
                    selectedMethod === "instapay" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  )}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="text-sm font-bold whitespace-nowrap">InstaPay</span>
                </button>
              </div>
            </div>

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

            <button
              onClick={() => onConfirm(selectedMethod)}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-lg shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : selectedMethod === "instapay" ? "Confirm Booking" : "Proceed to Payment"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

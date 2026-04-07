"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const success = searchParams.get("success") === "true";
  const id = searchParams.get("id"); // Paymob transaction ID

  useEffect(() => {
    // Optionally redirect back to the trips/dashboard page after 5 seconds
    const timer = setTimeout(() => {
      // Typically you might direct them back to a receipt page or their trips page
      router.push("/trips");
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white max-w-sm w-full rounded-3xl p-8 shadow-xl text-center flex flex-col items-center animate-in zoom-in duration-300">
        {success ? (
          <>
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 text-green-600 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Payment Successful!</h1>
            <p className="text-slate-500 text-sm mb-6">
              Your transaction <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{id || "completed"}</span> was processed successfully.
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6 text-red-600 shadow-inner">
              <XCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Payment Failed</h1>
            <p className="text-slate-500 text-sm mb-6">
              We couldn't process your payment. Please try again or use a different payment method.
            </p>
          </>
        )}

        <button
          onClick={() => router.push("/trips")}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
        >
          Return to Trips
        </button>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin" /></div>}>
      <CallbackContent />
    </Suspense>
  );
}

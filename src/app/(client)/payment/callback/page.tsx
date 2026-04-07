"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const processFailsafe = useAction(api.payments.processClientFailsafe);

  const success = searchParams.get("success") === "true";
  const id = searchParams.get("id"); // Paymob transaction ID
  const hmac = searchParams.get("hmac");

  useEffect(() => {
    const handleCallback = async () => {
      // 1. Gather all query parameters for HMAC failsafe validation
      const queryData: Record<string, string> = {};
      searchParams.forEach((val, key) => {
        queryData[key] = val;
      });

      // 2. Trigger Convex Failsafe if HMAC is present
      if (hmac && Object.keys(queryData).length > 0) {
        try {
          await processFailsafe({ hmac, queryData });
        } catch (err) {
          console.error("Failsafe verification error:", err);
        }
      }

      // 3. Break out of iframe and redirect to final destination immediately
      const top = window.top;
      const targetUrl = success ? "/bookings" : "/dashboard?payment_failed=true";

      if (top !== window.self && top) {
        top.location.href = targetUrl;
      } else {
        router.push(targetUrl);
      }
    };

    handleCallback();
  }, [searchParams, processFailsafe, success, router]);

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

        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Redirecting to your dashboard...</span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" /></div>}>
      <CallbackContent />
    </Suspense>
  );
}

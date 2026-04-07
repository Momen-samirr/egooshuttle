"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";

function CallbackContent() {
  const searchParams = useSearchParams();

  const processFailsafe = useAction(api.payments.processClientFailsafe);

  useEffect(() => {
    // Collect all query params to send to Convex for HMAC validation
    const queryData: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      queryData[key] = val;
    });

    const success = searchParams.get("success");
    const hmac = searchParams.get("hmac");

    const handleRedirect = async () => {
      if (hmac && Object.keys(queryData).length > 0) {
        try {
          await processFailsafe({ hmac, queryData });
        } catch (err) {
          console.error("Failsafe verification error:", err);
        }
      }

      const top = window.top;
      if (top !== window.self && top) {
        if (success === "true") top.location.href = "/bookings";
        else top.location.href = "/dashboard?payment_failed=true";
      } else {
        if (success === "true") window.location.href = "/bookings";
        else window.location.href = "/dashboard?payment_failed=true";
      }
    };

    handleRedirect();
  }, [searchParams, processFailsafe]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-bold">Redirecting you back securely...</p>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Clock, 
  ExternalLink,
  User,
  MapPin,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * InstaPayVerificationPanel
 * 
 * Admin tool to review and verify manual InstaPay payments.
 */
export function InstaPayVerificationPanel() {
  const pending = useQuery(api.instapay.getPendingVerifications);
  const verify = useMutation(api.instapay.verifyInstaPayPayment);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleVerify = async (id: Id<"paymentHistory">, action: "approve" | "reject") => {
    setIsProcessing(id);
    try {
      await verify({
        paymentIntentId: id,
        action,
        reason: action === "reject" ? "Payment proof was invalid or not found." : undefined,
      });
    } catch (err) {
      console.error("Verification failed:", err);
      alert("Failed to process verification.");
    } finally {
      setIsProcessing(null);
    }
  };

  if (pending === undefined) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="bg-slate-50 rounded-3xl p-12 text-center border border-dashed border-slate-200">
        <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
        <p className="text-slate-500 text-sm">No InstaPay payments currently under review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          Verification Required
          <span className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-bold">
            {pending.length}
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pending.map((item) => (
          <div 
            key={item._id}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
          >
            {/* Header: User & Trip */}
            <div className="p-6 border-b border-slate-50 flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <User className="w-4 h-4 text-blue-600" />
                  {item.userName || "Unknown User"}
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <MapPin className="w-3.5 h-3.5" />
                  {item.tripInfo}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-slate-900">EGP {item.amount.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Proof Section */}
            <div className="flex-1 p-6 flex flex-col gap-4 bg-slate-50/50">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-200 border border-slate-200 group">
                {item.proofUrl ? (
                  <>
                    <img 
                      src={item.proofUrl} 
                      alt="Payment Proof" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button 
                        onClick={() => setSelectedProof(item.proofUrl!)}
                        className="p-2 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform"
                        title="View Fullsize"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <a 
                        href={item.proofUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <AlertCircle className="w-8 h-8" />
                    <span className="text-xs font-bold">No Image Uploaded</span>
                  </div>
                )}
              </div>

              {item.proofReference && (
                <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Ref Number</span>
                  <span className="text-xs font-bold text-slate-900">{item.proofReference}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 bg-white border-t border-slate-50 grid grid-cols-2 gap-3">
              <button
                onClick={() => handleVerify(item._id, "reject")}
                disabled={isProcessing === item._id}
                className="py-3 px-4 rounded-xl border-2 border-slate-100 text-slate-400 font-bold text-sm hover:bg-red-50 hover:border-red-100 hover:text-red-600 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing === item._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject
              </button>
              <button
                onClick={() => handleVerify(item._id, "approve")}
                disabled={isProcessing === item._id}
                className="py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isProcessing === item._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Image Lightbox */}
      {selectedProof && (
        <div 
          className="fixed inset-0 bg-slate-900/95 z-[200] flex items-center justify-center p-10 animate-in fade-in duration-200"
          onClick={() => setSelectedProof(null)}
        >
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
            <XCircle className="w-8 h-8" />
          </button>
          <img 
            src={selectedProof} 
            alt="Proof Large" 
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

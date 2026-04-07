"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Copy,
  Info,
  Upload,
  Loader2,
  CheckCircle2,
  Lock,
  Smartphone,
  Clock,
  FileText,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Constants
// ============================================================================
const QUICK_AMOUNTS = [50, 100, 200, 500];
const MIN_TOPUP = 10;
const MAX_TOPUP = 5000;

export default function InstaPayTopUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if we're resuming from a previously created intent
  const resumeIntentId = searchParams.get("intentId");
  const resumeAmount = searchParams.get("amount");

  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "EgooBus";
  const instaPayNumber = process.env.NEXT_PUBLIC_INSTAPAY_NUMBER || "01000000000";

  // Step 1: Enter Amount (skipped if resuming)
  // Step 2: Payment Details + "I Have Paid"
  // Step 3: Upload Proof
  // Step 4: Success / Under Review
  const [step, setStep] = useState<1 | 2 | 3 | 4>(resumeIntentId ? 2 : 1);

  // Amount state
  const [selectedAmount, setSelectedAmount] = useState(
    resumeAmount ? parseFloat(resumeAmount) : 100
  );
  const [customAmount, setCustomAmount] = useState(resumeAmount || "");

  // Intent state
  const [paymentIntentId, setPaymentIntentId] = useState<Id<"paymentHistory"> | null>(
    resumeIntentId as Id<"paymentHistory"> | null
  );
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [proofReference, setProofReference] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutations
  const initiateTopUp = useMutation(api.wallet.initiateTopUp);
  const generateUploadUrl = useMutation(api.instapay.generateUploadUrl);
  const submitProof = useMutation(api.instapay.submitInstaPayProof);

  // Copy Helper
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Get the effective amount
  const getAmount = () => {
    if (customAmount) return parseFloat(customAmount) || 0;
    return selectedAmount;
  };

  // ── Step 1 → Step 2: Create payment intent ──
  const handleProceedToDetails = async () => {
    const amount = getAmount();
    if (amount < MIN_TOPUP || amount > MAX_TOPUP) {
      alert(`Amount must be between EGP ${MIN_TOPUP} and EGP ${MAX_TOPUP}`);
      return;
    }

    setIsCreatingIntent(true);
    try {
      const result = await initiateTopUp({ amount, method: "instapay" });
      setPaymentIntentId(result.paymentIntentId as Id<"paymentHistory">);
      setStep(2);
    } catch (err: any) {
      alert(err.message || "Failed to initiate top-up");
    } finally {
      setIsCreatingIntent(false);
    }
  };

  // File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // ── Step 3: Submit Proof ──
  const handleSubmitProof = async () => {
    if (!selectedFile || !paymentIntentId) return;

    setIsUploading(true);
    try {
      // Get upload URL from Convex
      const postUrl = await generateUploadUrl();

      // Upload file to Convex Storage
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });
      const { storageId } = await result.json();

      // Link proof to payment intent
      await submitProof({
        paymentIntentId,
        proofImageId: storageId,
        proofReference: proofReference || undefined,
      });

      setStep(4);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload proof. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Step config for the stepper
  const steps = [
    { label: "Amount", step: 1 },
    { label: "Details", step: 2 },
    { label: "Upload", step: 3 },
    { label: "Done", step: 4 },
  ];

  // Current progress for the line
  const progressWidth = step === 1 ? "0%" : step === 2 ? "33%" : step === 3 ? "66%" : "100%";

  return (
    <div className="flex flex-col gap-10 max-w-2xl mx-auto page-enter">

      {/* ── Premium Progress Stepper ── */}
      <div className="relative">
        <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
        <div
          className="absolute top-5 left-0 h-1 -translate-y-1/2 z-0 rounded-full transition-all duration-700 ease-in-out"
          style={{ width: progressWidth, backgroundColor: "var(--color-primary)" }}
        />
        <div className="flex items-center justify-between relative z-10">
          {steps.map((s) => (
            <div key={s.step} className="flex flex-col items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm",
                  step >= s.step
                    ? "text-white shadow-lg"
                    : "bg-slate-100 text-slate-400"
                )}
                style={step >= s.step ? {
                  backgroundColor: "var(--color-primary)",
                  boxShadow: "0 8px 24px rgba(0,91,191,0.2)",
                } : undefined}
              >
                {step > s.step ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="font-bold text-sm">{s.step}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  step === s.step ? "" : "text-slate-400"
                )}
                style={step === s.step ? { color: "var(--color-primary)" } : undefined}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Content Card ── */}
      <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-[0_20px_50px_rgba(0,10,60,0.05)] border border-slate-50 relative overflow-hidden">

        {/* ═══════════════ STEP 1: ENTER AMOUNT ═══════════════ */}
        {step === 1 && (
          <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <h1 className="text-3xl font-black text-slate-900 mb-2">Top Up Amount</h1>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
                Choose how much you'd like to add to your wallet via InstaPay.
              </p>
            </div>

            {/* Quick Amount Grid */}
            <div className="grid grid-cols-4 gap-3">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
                  className="py-4 rounded-2xl font-black text-base border-2 transition-all duration-200"
                  style={{
                    borderColor: selectedAmount === amt && !customAmount
                      ? "var(--color-primary)"
                      : "var(--color-outline-variant)",
                    backgroundColor: selectedAmount === amt && !customAmount
                      ? "var(--color-primary-fixed)"
                      : "transparent",
                    color: selectedAmount === amt && !customAmount
                      ? "var(--color-primary)"
                      : "var(--color-on-surface-variant)",
                  }}
                >
                  EGP {amt}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-1 mb-2 block">
                Or enter custom amount
              </span>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-lg text-slate-300">
                  EGP
                </span>
                <input
                  type="number"
                  min={MIN_TOPUP}
                  max={MAX_TOPUP}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-16 pr-6 py-5 rounded-2xl text-2xl font-black outline-none input-fluid"
                  style={{ color: "var(--color-on-surface)" }}
                />
              </div>
            </div>

            {/* Amount Summary */}
            <div
              className="rounded-2xl p-5 flex justify-between items-center"
              style={{ backgroundColor: "var(--color-surface-container)" }}
            >
              <span className="text-sm text-slate-500">Amount to add</span>
              <span className="text-2xl font-black" style={{ color: "var(--color-primary)" }}>
                EGP {getAmount().toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleProceedToDetails}
              disabled={isCreatingIntent || getAmount() < MIN_TOPUP}
              className="w-full py-5 text-white rounded-[1.25rem] font-black text-lg shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--color-primary)",
                boxShadow: "0 8px 24px rgba(0,91,191,0.2)",
              }}
            >
              {isCreatingIntent ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Continue to Payment Details</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        )}

        {/* ═══════════════ STEP 2: PAYMENT DETAILS ═══════════════ */}
        {step === 2 && (
          <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center">
              <h1 className="text-3xl font-black text-slate-900 mb-2">Payment Details</h1>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
                Please transfer <span className="font-bold" style={{ color: "var(--color-primary)" }}>EGP {getAmount().toFixed(2)}</span> to the verified InstaPay account below.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-1">Company Name</span>
                  <div
                    className="flex items-center gap-2 group cursor-pointer"
                    onClick={() => copyToClipboard(companyName, "company")}
                  >
                    <p className="text-xl text-slate-900 font-bold">{companyName}</p>
                    {copiedField === "company" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-1">InstaPay Number</span>
                  <div
                    className="flex items-center gap-2 group cursor-pointer"
                    onClick={() => copyToClipboard(instaPayNumber, "number")}
                  >
                    <p className="text-2xl text-slate-900 font-black tracking-tight underline decoration-blue-600/30 underline-offset-4">
                      {instaPayNumber}
                    </p>
                    {copiedField === "number" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-1">Exact Amount</span>
                  <div
                    className="flex items-center gap-2 group cursor-pointer"
                    onClick={() => copyToClipboard(getAmount().toFixed(2), "amount")}
                  >
                    <p className="text-2xl font-black tracking-tight" style={{ color: "var(--color-primary)" }}>
                      EGP {getAmount().toFixed(2)}
                    </p>
                    {copiedField === "amount" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>

                <div className="bg-green-50/50 border border-green-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="bg-green-500 p-1 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-green-700 font-bold text-xs">Verified InstaPay Merchant</span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="bg-white p-4 rounded-3xl mb-4 shadow-sm">
                  <div className="w-32 h-32 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200">
                    <Smartphone className="w-12 h-12 text-slate-200" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-900 font-black uppercase tracking-widest bg-slate-200/50 px-3 py-1 rounded-full">Scan QR Code</span>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full py-5 text-white rounded-[1.25rem] font-black text-lg shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 group"
              style={{
                backgroundColor: "var(--color-primary)",
                boxShadow: "0 8px 24px rgba(0,91,191,0.2)",
              }}
            >
              <span>I have completed the payment</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* ═══════════════ STEP 3: UPLOAD PROOF ═══════════════ */}
        {step === 3 && (
          <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center">
              <h1 className="text-3xl font-black text-slate-900 mb-2">Verify Your Transaction</h1>
              <p className="text-slate-500 text-sm leading-relaxed px-10">
                Upload your payment screenshot to continue
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Left: Upload Drop Zone (3/5) */}
              <div className="md:col-span-3">
                <label
                  className={cn(
                    "group relative flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all duration-300",
                    selectedFile ? "border-blue-600 bg-blue-50/30" : "border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                  )}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className={cn(
                      "w-20 h-20 mb-5 rounded-full flex items-center justify-center transition-all shadow-sm",
                      selectedFile ? "bg-blue-600 text-white" : "bg-slate-50 text-blue-600 group-hover:scale-110"
                    )}>
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="mb-2 text-sm text-slate-900 font-bold">
                      {selectedFile ? selectedFile.name : "Drop your screenshot here"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                </label>
              </div>

              {/* Right: Preview + Tip (2/5) */}
              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="bg-slate-50 rounded-[1.5rem] p-5 flex-grow relative overflow-hidden border border-slate-100 flex flex-col h-full">
                  <span className="text-[10px] font-black text-blue-600 mb-3 uppercase tracking-tighter">Live Preview</span>
                  <div className="flex-grow rounded-2xl overflow-hidden bg-slate-200 border border-slate-100 shadow-inner min-h-[140px] relative">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Payment Preview"
                        className="w-full h-full object-cover animate-in zoom-in-95 duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <Smartphone className="w-12 h-12 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between bg-white/50 p-2 rounded-xl border border-white">
                    <span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">
                      {selectedFile?.name || "screenshot_01.jpg"}
                    </span>
                    <CheckCircle2 className={cn("w-4 h-4 transition-colors", selectedFile ? "text-blue-600 fill-blue-600" : "text-slate-200")} />
                  </div>
                </div>

                <div className="bg-green-50/50 rounded-[1.5rem] p-5 flex items-start gap-4 border border-green-100">
                  <Info className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-green-700 font-medium">
                    Ensure the <strong className="font-black">Transaction ID</strong> and <strong className="font-black">Amount</strong> are clearly visible for faster verification.
                  </p>
                </div>
              </div>
            </div>

            {/* Optional Reference */}
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-1 mb-2 block">
                Reference Number (optional)
              </span>
              <input
                type="text"
                value={proofReference}
                onChange={(e) => setProofReference(e.target.value)}
                placeholder="e.g. TRX-123456"
                className="w-full px-5 py-4 rounded-2xl outline-none input-fluid text-sm font-bold"
                style={{ color: "var(--color-on-surface)" }}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(2)}
                disabled={isUploading}
                className="flex items-center justify-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Details
              </button>

              <button
                onClick={handleSubmitProof}
                disabled={!selectedFile || isUploading}
                className="w-full sm:w-auto min-w-[260px] py-4 text-white rounded-2xl font-black text-base shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:grayscale disabled:scale-100"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)",
                  boxShadow: "0 8px 24px rgba(0,91,191,0.2)",
                }}
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Submit Payment Proof</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 4: SUCCESS / UNDER REVIEW ═══════════════ */}
        {step === 4 && (
          <div className="flex flex-col items-center text-center py-6 animate-in fade-in zoom-in-95 duration-700">
            {/* Header Icon */}
            <div className="w-24 h-24 rounded-full bg-green-50/50 flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-green-500/10 rounded-full animate-ping duration-[3s]" />
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 relative z-10">
                <CheckCircle2 className="w-9 h-9 text-white" />
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Your top-up is under review
              </h1>
              <p className="text-slate-500 text-sm max-w-[380px] mx-auto leading-relaxed">
                We've received your payment proof. Our team will verify the transaction and credit your wallet shortly.
              </p>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-10">
              <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50 flex flex-col items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Time</span>
                <div className="flex items-center gap-2 text-slate-900">
                  <Clock className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                  <span className="font-bold text-sm">within 1–2 hours</span>
                </div>
              </div>
              <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50 flex flex-col items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top-up Status</span>
                <div className="badge-pending flex items-center gap-2 px-4 py-1.5 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
                  <span className="font-black text-[10px] uppercase tracking-tighter">Pending Review</span>
                </div>
              </div>
            </div>

            {/* Transaction Data Footer */}
            <div className="w-full pt-8 border-t border-slate-100 flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-slate-200/50" style={{ backgroundColor: "var(--color-primary-fixed)" }}>
                  <Wallet className="w-6 h-6" style={{ color: "var(--color-primary)" }} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</p>
                  <p className="text-sm font-black text-slate-900 tracking-tight">Wallet Top-up</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Amount</p>
                <p className="text-2xl font-black tracking-tight" style={{ color: "var(--color-primary)" }}>
                  EGP {getAmount().toFixed(2)}
                </p>
              </div>
            </div>

            <div className="w-full space-y-4">
              <button
                onClick={() => router.push("/wallet")}
                className="w-full py-5 text-white rounded-[1.25rem] font-black text-lg shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
                style={{
                  backgroundColor: "var(--color-primary)",
                  boxShadow: "0 8px 24px rgba(0,91,191,0.2)",
                }}
              >
                Back to Wallet
              </button>
              <button
                onClick={() => router.push("/bookings")}
                className="w-full py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                View My Bookings
              </button>
            </div>
          </div>
        )}

        {/* Ambient Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-600/5 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* Trust Footer */}
      <div className="text-center space-y-6">
        <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed">
          You will receive a notification once the review is complete. Your wallet balance will be updated automatically upon approval.
        </p>
        <div className="text-center opacity-30">
          <p className="text-[9px] uppercase tracking-[0.3em] font-black text-slate-900 flex items-center justify-center gap-2">
            <Lock className="w-3 h-3" />
            Secure End-to-End Encryption Enabled
          </p>
        </div>
      </div>
    </div>
  );
}

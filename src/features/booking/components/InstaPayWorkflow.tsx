"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
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
  ShieldCheck,
  Smartphone,
  Clock,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InstaPayWorkflowProps {
  paymentIntentId: Id<"paymentHistory">;
  amount: number;
  onClose: () => void;
}

/**
 * InstaPayWorkflow
 * 
 * Implements the 3-step manual verification flow:
 * Step 1: Payment Details (Account Info + QR)
 * Step 2: Proof Upload (Screenshot + Ref)
 * Step 3: Success / Under Review status
 */
export function InstaPayWorkflow({ paymentIntentId, amount, onClose }: InstaPayWorkflowProps) {
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "EgooBus";
  const instaPayNumber = process.env.NEXT_PUBLIC_INSTAPAY_NUMBER || "01000000000";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [proofReference, setProofReference] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutations
  const generateUploadUrl = useMutation(api.instapay.generateUploadUrl);
  const submitProof = useMutation(api.instapay.submitInstaPayProof);

  // 1. Copy Helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // 2. Handle File Selection (Pre-upload)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // 3. Handle Actual Submission
  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Step A: Get a short-lived upload URL from Convex
      const postUrl = await generateUploadUrl();

      // Step B: Post the file to Convex Storage
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });
      const { storageId } = await result.json();

      // Step C: Link the storage ID to the payment intent
      await submitProof({
        paymentIntentId,
        proofImageId: storageId,
        proofReference: proofReference || undefined,
      });

      setStep(3); // Move to success step
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload proof. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      
      {/* Premium Progress Stepper */}
      <div className="relative">
        {/* Progress Lines */}
        <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
        <div 
          className="absolute top-5 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 rounded-full transition-all duration-700 ease-in-out" 
          style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
        />
        
        <div className="flex items-center justify-between relative z-10">
          {/* Step 1 */}
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm",
              step >= 1 ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-slate-100 text-slate-400"
            )}>
              {step > 1 ? <CheckCircle className="w-5 h-5" /> : <span className="font-bold text-sm">1</span>}
            </div>
            <span className={cn("text-[10px] font-black uppercase tracking-widest", step === 1 ? "text-blue-600" : "text-slate-400")}>Details</span>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm",
              step >= 2 ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-slate-100 text-slate-400",
              step === 2 && "ring-4 ring-blue-50"
            )}>
              {step > 2 ? <CheckCircle className="w-5 h-5" /> : <span className="font-bold text-sm">2</span>}
            </div>
            <span className={cn("text-[10px] font-black uppercase tracking-widest", step === 2 ? "text-blue-600" : "text-slate-400")}>Upload Proof</span>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm",
              step >= 3 ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-slate-100 text-slate-300"
            )}>
              <span className="font-black text-sm">3</span>
            </div>
            <span className={cn("text-[10px] font-black uppercase tracking-widest", step === 3 ? "text-blue-600" : "text-slate-400")}>Done</span>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-[0_20px_50px_rgba(0,10,60,0.05)] border border-slate-50 relative overflow-hidden">
        
        {step === 1 && (
          <div className="flex flex-col gap-10">
            <div className="text-center">
              <h1 className="text-3xl font-black text-slate-900 mb-2">Payment Details</h1>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
                Please transfer <span className="font-bold text-blue-600">EGP {amount.toFixed(2)}</span> to the verified InstaPay account below.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-1">Company Name</span>
                  <div className="flex items-center gap-2 group cursor-pointer" onClick={() => copyToClipboard(companyName)}>
                    <p className="text-xl text-slate-900 font-bold">{companyName}</p>
                    <Copy className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest pl-1">InstaPay Number</span>
                  <div className="flex items-center gap-2 group cursor-pointer" onClick={() => copyToClipboard(instaPayNumber)}>
                    <p className="text-2xl text-slate-900 font-black tracking-tight underline decoration-blue-600/30 underline-offset-4">{instaPayNumber}</p>
                    <Copy className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
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
              onClick={() => setStep(2)}
              className="w-full py-5 bg-blue-600 text-white rounded-[1.25rem] font-black text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 group"
            >
              <span>I have completed the payment</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-10">
            <div className="text-center">
              <h1 className="text-3xl font-black text-slate-900 mb-2 font-headline">Verify Your Transaction</h1>
              <p className="text-slate-500 text-sm leading-relaxed px-10">
                Upload your payment screenshot to continue
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Left Column: Upload Drop Zone (3/5) */}
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
                    <p className="mb-2 text-sm text-slate-900 font-bold">Drop your screenshot here</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">PNG, JPG up to 10MB</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                </label>
              </div>

              {/* Right Column: Preview & Tip (2/5) */}
              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="bg-slate-50 rounded-[1.5rem] p-5 flex-grow relative overflow-hidden group border border-slate-100 flex flex-col h-full">
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

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setStep(1)}
                disabled={isUploading}
                className="flex items-center justify-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Details
              </button>

              <button 
                onClick={handleSubmit}
                disabled={!selectedFile || isUploading}
                className="w-full sm:w-auto min-w-[260px] py-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl font-black text-md shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:grayscale disabled:scale-100"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>Submit Payment Proof</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center text-center py-6 animate-in fade-in zoom-in-95 duration-700">
            {/* Header Icon */}
            <div className="w-24 h-24 rounded-full bg-green-50/50 flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-green-500/10 rounded-full animate-ping duration-[3s]" />
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 relative z-10">
                <CheckCircle2 className="w-9 h-9 text-white" />
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight font-headline">Your payment is under review</h1>
              <p className="text-slate-500 text-sm max-w-[380px] mx-auto leading-relaxed">
                We've received your transaction details and our security team is verifying the request.
              </p>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-10">
              <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50 flex flex-col items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Time</span>
                <div className="flex items-center gap-2 text-slate-900">
                   <Clock className="w-4 h-4 text-blue-600" />
                   <span className="font-bold text-sm text-slate-900">within 1–2 hours</span>
                </div>
              </div>
              <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50 flex flex-col items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking Status</span>
                <div className="flex items-center gap-2 bg-orange-50 px-4 py-1.5 rounded-full border border-orange-100">
                   <div className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
                   <span className="font-black text-[10px] text-orange-600 uppercase tracking-tighter">Pending Payment Review</span>
                </div>
              </div>
            </div>

            {/* Transaction Data Footer */}
            <div className="w-full pt-8 border-t border-slate-100 flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200/50">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reference Number</p>
                  <p className="text-sm font-black text-slate-900 tracking-tight">#{proofReference || "TRX-GENERATING"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Amount</p>
                <p className="text-2xl font-black text-blue-600 tracking-tight">EGP {amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="w-full space-y-4">
              <button 
                onClick={onClose}
                className="w-full py-5 bg-blue-600 text-white rounded-[1.25rem] font-black text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all font-headline"
              >
                Back to Dashboard
              </button>
              <button className="w-full py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
                View Transaction Details
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
          You will receive a confirmation email once the review is complete. For urgent matters, please contact our 24/7 support desk.
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

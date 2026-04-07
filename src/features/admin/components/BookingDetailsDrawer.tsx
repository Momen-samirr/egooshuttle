"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  X,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Edit,
  Calendar,
  CreditCard,
  Banknote,
  ShieldCheck,
  Eye,
  ExternalLink,
  Clock,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";

interface BookingDetailsDrawerProps {
  bookingId: Id<"bookings"> | null;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Human-readable status labels for the frontend contract
// ---------------------------------------------------------------------------
const INSTAPAY_STATUS_LABELS: Record<string, { label: string; color: string; bg: string; ring: string }> = {
  pending:      { label: "Waiting for payment",  color: "text-amber-700",   bg: "bg-amber-50",   ring: "ring-amber-200" },
  under_review: { label: "Under review",         color: "text-indigo-700",  bg: "bg-indigo-50",  ring: "ring-indigo-200" },
  paid:         { label: "Payment approved",      color: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200" },
  failed:       { label: "Payment rejected",      color: "text-rose-700",    bg: "bg-rose-50",    ring: "ring-rose-200" },
};

export function BookingDetailsDrawer({ bookingId, onClose }: BookingDetailsDrawerProps) {
  const booking = useQuery(api.admin.getAdminBookingDetail, bookingId ? { bookingId } : "skip");
  const updateStatus = useMutation(api.admin.updateBookingStatusAdmin);
  const verifyInstaPay = useMutation(api.instapay.verifyInstaPayPayment);
  const paymentDetail = useQuery(
    api.instapay.getPaymentDetailForBooking,
    bookingId && booking?.paymentMethod === "instapay" ? { bookingId } : "skip"
  );

  const [updating, setUpdating] = useState(false);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const isInstaPay = booking?.paymentMethod === "instapay";

  // ---------- Generic action (card/cash only) ----------
  const handleGenericAction = async (status: "confirmed" | "cancelled", paymentStatus?: "paid") => {
    if (!bookingId) return;
    if (status === "cancelled" && !confirm("Are you sure you want to cancel this booking? This will restore seats to the trip.")) return;

    setUpdating(true);
    try {
      await updateStatus({ bookingId, status, paymentStatus });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setUpdating(false);
    }
  };

  // ---------- InstaPay-specific action ----------
  const handleInstaPayAction = async (action: "approve" | "reject") => {
    if (!paymentDetail?._id) return;

    if (action === "reject" && !rejectReason.trim()) {
      setShowRejectInput(true);
      return;
    }

    if (action === "approve" && !confirm("Approve this InstaPay payment? The booking will be confirmed and seats permanently reserved.")) return;

    setUpdating(true);
    try {
      await verifyInstaPay({
        paymentIntentId: paymentDetail._id,
        action,
        reason: action === "reject" ? (rejectReason || "Payment proof rejected by admin") : undefined,
      });
      setShowRejectInput(false);
      setRejectReason("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setUpdating(false);
    }
  };

  if (!bookingId) return null;

  const isOpen = !!bookingId;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className={`fixed right-0 top-0 h-screen w-full max-w-[520px] bg-white shadow-[0_0_80px_rgba(0,0,0,0.15)] z-[70] transform transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {!booking ? (
          <div className="flex-1 flex items-center justify-center p-20 gap-6 flex-col">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-slate-900 font-black text-lg">Fetching Manifest</p>
              <p className="text-slate-400 font-medium">Securing encrypted transaction data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-20">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Booking Profile</h3>
                <div className="flex items-center gap-2 mt-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    <p className="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">ID: #EB-{booking._id.slice(0, 8)}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-[1.25rem] transition-all active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12">
              {/* Customer Profile Section */}
              <section>
                <div className="bg-slate-50/50 border border-slate-100 p-8 rounded-[3rem] flex flex-col sm:flex-row items-center sm:items-start gap-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-600/10 transition-colors" />

                  <div className="w-28 h-28 rounded-[2rem] bg-white shadow-xl ring-[10px] ring-white overflow-hidden flex-shrink-0 relative z-10 transition-transform duration-500 group-hover:scale-105">
                    {booking.user?.avatarUrl ? (
                      <img src={booking.user.avatarUrl} alt={booking.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 font-black text-3xl">
                        {booking.user?.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-center sm:text-left relative z-10">
                    <h4 className="font-black text-2xl text-slate-900 mb-1 leading-tight">{booking.user?.name}</h4>
                    <p className="text-base text-slate-500 font-medium">{booking.user?.email}</p>
                    <div className="flex justify-center sm:justify-start gap-3 mt-6">
                      <a href={`mailto:${booking.user?.email}`} className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold text-sm">
                        <Mail className="w-4 h-4" />
                        Email
                      </a>
                      <a href={`tel:${booking.user?.phone}`} className="flex items-center gap-2 px-5 py-3 bg-white text-slate-900 border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold text-sm">
                        <Phone className="w-4 h-4" />
                        Call
                      </a>
                    </div>
                  </div>
                </div>
              </section>

              {/* Navigation Intelligence */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Route Intelligence</p>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
                        Trip: {booking.trip?.tripCode || 'N/A'}
                    </span>
                </div>
                <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden border border-slate-100/50">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.03),transparent_70%)] pointer-events-none" />
                  <div className="flex items-start gap-6 relative z-10">
                    <div className="flex flex-col items-center gap-1.5 mt-1.5">
                      <div className="w-4 h-4 rounded-full border-[3px] border-blue-600 bg-white shadow-sm" />
                      <div className="w-0.5 h-16 bg-gradient-to-b from-blue-100 to-emerald-100 rounded-full" />
                      <MapPin className="w-5 h-5 text-emerald-600 drop-shadow-sm" />
                    </div>
                    <div className="flex-1 space-y-10">
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] leading-none mb-2">Primary Departure</p>
                        <p className="text-lg font-black text-slate-800 tracking-tight">{booking.trip?.origin}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] leading-none mb-2">Final Destination</p>
                        <p className="text-lg font-black text-slate-800 tracking-tight">{booking.trip?.destination}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ================================================================
                  INSTAPAY: Payment Verification Section  
                  Only shown for InstaPay bookings
                  ================================================================ */}
              {isInstaPay && (
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">InstaPay Verification</p>
                    {booking.paymentStatus && INSTAPAY_STATUS_LABELS[booking.paymentStatus] && (
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${INSTAPAY_STATUS_LABELS[booking.paymentStatus].bg} ${INSTAPAY_STATUS_LABELS[booking.paymentStatus].color} ring-1 ${INSTAPAY_STATUS_LABELS[booking.paymentStatus].ring}`}>
                        {INSTAPAY_STATUS_LABELS[booking.paymentStatus].label}
                      </span>
                    )}
                  </div>

                  {/* Proof Screenshot Preview */}
                  <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Proof</span>
                      {paymentDetail === undefined && (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      )}
                    </div>

                    {paymentDetail?.proofUrl ? (
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-200 border border-slate-200 group cursor-pointer" onClick={() => setSelectedProof(paymentDetail.proofUrl!)}>
                        <img
                          src={paymentDetail.proofUrl}
                          alt="Payment Proof Screenshot"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <div className="p-2.5 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform shadow-lg">
                            <Eye className="w-5 h-5" />
                          </div>
                          <a
                            href={paymentDetail.proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2.5 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform shadow-lg"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ) : paymentDetail && !paymentDetail.proofUrl ? (
                      <div className="aspect-video rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <ImageIcon className="w-10 h-10" />
                        <span className="text-xs font-bold">No proof uploaded yet</span>
                        {paymentDetail.expiresAt && (
                          <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase">
                              {paymentDetail.expiresAt > Date.now()
                                ? `Expires in ${Math.round((paymentDetail.expiresAt - Date.now()) / 60000)} min`
                                : "Expired"
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Reference Number */}
                    {paymentDetail?.proofReference && (
                      <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Ref Number</span>
                        <span className="text-sm font-bold text-slate-900">{paymentDetail.proofReference}</span>
                      </div>
                    )}

                    {/* Failure Reason (if rejected) */}
                    {paymentDetail?.failureReason && (
                      <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mb-1">Rejection Reason</p>
                          <p className="text-sm text-rose-700 font-medium">{paymentDetail.failureReason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Manifest Sync */}
              <section className="space-y-6">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Manifest Sync</p>
                <div className="grid grid-cols-7 gap-3">
                  {booking.bookingDays.map((day) => {
                    const dateObj = new Date(day.date + "T00:00:00");
                    const label = dateObj.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
                    const dayNum = dateObj.getDate();
                    const isActive = day.status === 'active';
                    const isReserved = day.status === 'reserved';
                    return (
                      <div key={day.date} className="flex flex-col items-center gap-2.5">
                        <span className="text-[10px] text-slate-400 font-black tracking-widest">{label}</span>
                        <div className={`w-full aspect-square rounded-[1.25rem] flex items-center justify-center text-xs font-black shadow-sm ring-2 ring-white transition-all duration-300 ${
                          isActive ? 'bg-blue-600 text-white scale-110 shadow-xl shadow-blue-200 rotate-1' :
                          isReserved ? 'bg-amber-500 text-white scale-105 shadow-lg shadow-amber-200' :
                          'bg-slate-50 text-slate-300 hover:bg-slate-100'
                        }`}>
                          {dayNum}
                        </div>
                        {isReserved && (
                          <span className="text-[8px] text-amber-600 font-black uppercase">Hold</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Financial Ledger */}
              <section className="space-y-6 pb-6">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Financial Ledger</p>
                <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl shadow-slate-300 overflow-hidden relative group">
                    <div className="absolute -bottom-12 -right-12 opacity-10 blur-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000">
                        <CreditCard className="w-64 h-64" />
                    </div>
                  <div className="relative z-10 flex flex-col gap-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                       <div className="flex items-center gap-4 px-5 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                         <div className={`p-2.5 rounded-xl shadow-lg ${isInstaPay ? 'bg-indigo-500 shadow-indigo-500/20' : 'bg-blue-500 shadow-blue-500/20'}`}>
                            {isInstaPay ? <Banknote className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-none mb-1.5">Asset Type</span>
                            <span className="text-sm font-black capitalize tracking-tight">
                              {isInstaPay ? "InstaPay Transfer" : `${booking.paymentMethod} Payment`}
                            </span>
                         </div>
                       </div>
                       <div className="text-right pl-2 sm:pl-0">
                          <span className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-none mb-1.5 block">Settlement Amount</span>
                          <span className="text-4xl font-black tracking-tighter leading-none">EGP {booking.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                       </div>
                    </div>
                    <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                       <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest italic">Verification ID Secured</span>
                       </div>
                       <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-inner ${
                         booking.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' :
                         booking.paymentStatus === 'under_review' ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30' :
                         booking.paymentStatus === 'failed' ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30' :
                         'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30'
                       }`}>
                         {booking.paymentStatus === 'paid' ? 'Settled Complete' :
                          booking.paymentStatus === 'under_review' ? 'Pending Admin Review' :
                          booking.paymentStatus === 'failed' ? 'Payment Rejected' :
                          'Awaiting Payment'}
                       </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* ================================================================
                TACTICAL ACTIONS — Different for InstaPay vs Card/Cash
                ================================================================ */}
            <div className="p-10 border-t border-slate-100 bg-slate-50/30 backdrop-blur-md sticky bottom-0">
              {isInstaPay ? (
                /* InstaPay-specific action panel */
                <div className="space-y-4">
                  {/* Reject reason input (shown on click) */}
                  {showRejectInput && (
                    <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-200">
                      <input
                        type="text"
                        placeholder="Reason for rejection (required)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-5 py-4 border-2 border-rose-200 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-400 transition-all"
                        autoFocus
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-5">
                    <button
                      disabled={updating || booking.paymentStatus === 'failed' || booking.paymentStatus === 'paid' || !paymentDetail || paymentDetail.status !== 'under_review'}
                      onClick={() => handleInstaPayAction("reject")}
                      className="bg-white text-rose-600 border-2 border-rose-100 font-black py-5 px-6 rounded-[1.75rem] hover:bg-rose-50 hover:border-rose-200 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-40 disabled:translate-y-0 flex items-center justify-center gap-3 group text-sm"
                    >
                      {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                      Reject Payment
                    </button>
                    <button
                      disabled={updating || booking.paymentStatus === 'paid' || booking.paymentStatus === 'failed' || !paymentDetail || paymentDetail.status !== 'under_review'}
                      onClick={() => handleInstaPayAction("approve")}
                      className="bg-emerald-600 text-white font-black py-5 px-6 rounded-[1.75rem] shadow-2xl shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-40 disabled:translate-y-0 flex items-center justify-center gap-3 group text-sm"
                    >
                      {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                      Approve Payment
                    </button>
                  </div>

                  {/* Status explanation */}
                  {booking.paymentStatus === 'pending' && (
                    <p className="text-center text-[11px] text-amber-600 font-bold bg-amber-50 px-4 py-3 rounded-xl flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      Waiting for customer to upload payment proof
                    </p>
                  )}
                  {booking.paymentStatus === 'paid' && (
                    <p className="text-center text-[11px] text-emerald-600 font-bold bg-emerald-50 px-4 py-3 rounded-xl flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      This payment has been approved. Booking is confirmed.
                    </p>
                  )}
                  {booking.paymentStatus === 'failed' && (
                    <p className="text-center text-[11px] text-rose-600 font-bold bg-rose-50 px-4 py-3 rounded-xl flex items-center justify-center gap-2">
                      <XCircle className="w-4 h-4" />
                      This payment was rejected. Booking is cancelled.
                    </p>
                  )}
                </div>
              ) : (
                /* Generic Card/Cash actions */
                <div>
                  <div className="grid grid-cols-2 gap-5">
                    <button
                      disabled={updating || booking.paymentStatus === 'paid'}
                      onClick={() => handleGenericAction("confirmed", "paid")}
                      className="bg-emerald-600 text-white font-black py-5 px-6 rounded-[1.75rem] shadow-2xl shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-3 group text-sm"
                    >
                      <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      Approve Settlement
                    </button>
                    <button
                      disabled={updating || booking.status === 'cancelled'}
                      onClick={() => handleGenericAction("cancelled")}
                      className="bg-white text-rose-600 border-2 border-rose-100 font-black py-5 px-6 rounded-[1.75rem] hover:bg-rose-50 hover:border-rose-200 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-3 group text-sm"
                    >
                      <XCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      Terminate Order
                    </button>
                  </div>
                  <button
                    disabled={updating}
                    className="w-full mt-5 bg-white border border-slate-100/50 text-slate-400 font-black py-4 px-6 rounded-[1.5rem] hover:bg-slate-50 hover:text-slate-900 transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Advanced Ledger Modification
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      {/* Fullscreen Proof Lightbox */}
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
    </>
  );
}

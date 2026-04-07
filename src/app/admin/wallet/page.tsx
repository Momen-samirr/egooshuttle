"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  Wrench,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  ExternalLink,
  XCircle,
  Image as ImageIcon,
  MapPin,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";

type TransactionType = "TOP_UP" | "PAYMENT" | "REFUND" | "ADMIN_ADJUSTMENT";

const TX_ICONS: Record<TransactionType, typeof ArrowUpCircle> = {
  TOP_UP: ArrowUpCircle,
  PAYMENT: ArrowDownCircle,
  REFUND: RotateCcw,
  ADMIN_ADJUSTMENT: Wrench,
};

const TX_COLORS: Record<TransactionType, string> = {
  TOP_UP: "text-emerald-500 bg-emerald-500/10",
  PAYMENT: "text-red-400 bg-red-400/10",
  REFUND: "text-blue-400 bg-blue-400/10",
  ADMIN_ADJUSTMENT: "text-amber-400 bg-amber-400/10",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  under_review: "bg-orange-50 text-orange-700 border border-orange-200",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  failed: "bg-red-50 text-red-700 border border-red-200",
  confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
};

interface AdminTransaction {
  _id: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  topUpStatus?: string;
  topUpMethod?: string;
  paymentIntentId?: string;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  proofUrl?: string | null;
  proofReference?: string | null;
  failureReason?: string | null;
  bookingInfo?: {
    tripRoute: string;
    bookingDate: string;
    seats: number;
    status: string;
  } | null;
  idempotencyKey?: string;
}

export default function AdminWalletPage() {
  const stats = useQuery(api.admin.getWalletDashboardStats);
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>(undefined);
  const transactions = useQuery(api.admin.getAdminWalletTransactions, {
    typeFilter: typeFilter,
  });

  // Expandable row tracking
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  // Proof lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Manual adjustment state
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const adjustWallet = useMutation(api.admin.adminAdjustWallet);

  const handleAdjust = async () => {
    if (!adjustUserId || !adjustAmount || !adjustReason) {
      alert("Please fill all fields");
      return;
    }
    setAdjustLoading(true);
    try {
      await adjustWallet({
        userId: adjustUserId as Id<"appUsers">,
        amount: parseFloat(adjustAmount),
        reason: adjustReason,
      });
      alert("Adjustment applied successfully!");
      setAdjustUserId("");
      setAdjustAmount("");
      setAdjustReason("");
    } catch (err: any) {
      alert(err.message || "Adjustment failed");
    } finally {
      setAdjustLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTx(expandedTx === id ? null : id);
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Wallet Management</h1>
          <p className="text-sm text-slate-500">Manage user wallets, view transactions, and make adjustments</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Wallets", value: stats.totalWallets, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Total Balance", value: `EGP ${stats.totalBalance.toFixed(2)}`, icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
          { label: "Active Wallets", value: stats.activeWallets, icon: TrendingUp, color: "text-indigo-600 bg-indigo-50" },
          { label: "Pending Top Ups", value: stats.pendingTopUpCount, icon: Clock, color: "text-amber-600 bg-amber-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Manual Adjustment */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Wrench className="w-5 h-5 text-amber-600" />
          Manual Adjustment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="User ID"
            value={adjustUserId}
            onChange={(e) => setAdjustUserId(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-600 outline-none"
          />
          <input
            type="number"
            placeholder="Amount (+/-)"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-600 outline-none"
          />
          <input
            type="text"
            placeholder="Reason"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-600 outline-none"
          />
          <button
            onClick={handleAdjust}
            disabled={adjustLoading}
            className="bg-amber-600 text-white rounded-xl px-6 py-3 text-sm font-bold hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {adjustLoading ? "Applying..." : "Apply Adjustment"}
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">All Transactions</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setTypeFilter(undefined)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                !typeFilter ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              All
            </button>
            {(["TOP_UP", "PAYMENT", "REFUND", "ADMIN_ADJUSTMENT"] as TransactionType[]).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                  typeFilter === type ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {type.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {!transactions || transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No transactions found</p>
            </div>
          ) : (
            transactions.map((tx: AdminTransaction) => {
              const Icon = TX_ICONS[tx.type as TransactionType];
              const colorClass = TX_COLORS[tx.type as TransactionType];
              const isCredit = tx.type === "TOP_UP" || tx.type === "REFUND" ||
                (tx.type === "ADMIN_ADJUSTMENT" && tx.balanceAfter > tx.balanceBefore);
              const isExpanded = expandedTx === tx._id;

              return (
                <div key={tx._id}>
                  {/* ── Main Row ── */}
                  <div
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors",
                      isExpanded ? "bg-blue-50/50" : "hover:bg-slate-50"
                    )}
                    onClick={() => toggleExpand(tx._id)}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", colorClass)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-slate-900 truncate">{tx.userName}</p>
                        <span className="text-xs text-slate-400">{tx.userEmail}</span>
                        {tx.topUpStatus && (
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            STATUS_BADGE[tx.topUpStatus] || "bg-slate-100 text-slate-500"
                          )}>
                            {tx.topUpStatus}
                          </span>
                        )}
                        {tx.proofUrl && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            Proof
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{tx.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("font-black text-sm", isCredit ? "text-emerald-600" : "text-red-500")}>
                        {isCredit ? "+" : "-"} EGP {tx.amount.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="shrink-0 text-slate-300">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* ── Expanded Detail Panel ── */}
                  {isExpanded && (
                    <div className="px-6 pb-6 bg-slate-50/70 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">

                        {/* Left: Transaction Details */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Transaction Details
                          </h4>

                          <div className="bg-white rounded-2xl p-5 border border-slate-100 space-y-4">
                            <DetailRow label="Transaction ID" value={`#${tx._id.slice(-8).toUpperCase()}`} />
                            <DetailRow label="Type" value={tx.type.replace("_", " ")} />
                            <DetailRow label="Amount" value={`EGP ${tx.amount.toFixed(2)}`} highlight={isCredit ? "green" : "red"} />
                            <DetailRow label="Balance Before" value={`EGP ${tx.balanceBefore.toFixed(2)}`} />
                            <DetailRow label="Balance After" value={`EGP ${tx.balanceAfter.toFixed(2)}`} />
                            <DetailRow label="Date" value={new Date(tx.createdAt).toLocaleString("en-GB", {
                              day: "2-digit", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit"
                            })} />

                            {tx.topUpMethod && (
                              <DetailRow label="Top-up Method" value={tx.topUpMethod.toUpperCase()} />
                            )}
                            {tx.paymentStatus && (
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</span>
                                <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full",
                                  STATUS_BADGE[tx.paymentStatus] || "bg-slate-100 text-slate-500"
                                )}>
                                  {tx.paymentStatus}
                                </span>
                              </div>
                            )}
                            {tx.proofReference && (
                              <DetailRow label="Proof Reference" value={tx.proofReference} />
                            )}
                            {tx.failureReason && (
                              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Failure Reason</p>
                                <p className="text-xs text-red-700 font-medium">{tx.failureReason}</p>
                              </div>
                            )}
                          </div>

                          {/* Booking Info (for PAYMENT type) */}
                          {tx.bookingInfo && (
                            <div className="bg-white rounded-2xl p-5 border border-slate-100 space-y-3">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Linked Booking
                              </h4>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-bold text-slate-900">{tx.bookingInfo.tripRoute}</span>
                              </div>
                              <DetailRow label="Booking Date" value={tx.bookingInfo.bookingDate} />
                              <DetailRow label="Seats" value={String(tx.bookingInfo.seats)} />
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                                <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full",
                                  STATUS_BADGE[tx.bookingInfo.status] || "bg-slate-100 text-slate-500"
                                )}>
                                  {tx.bookingInfo.status}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right: Proof Image */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Payment Proof
                          </h4>

                          {tx.proofUrl ? (
                            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                              <div className="relative aspect-video group">
                                <img
                                  src={tx.proofUrl}
                                  alt="Payment Proof"
                                  className="w-full h-full object-cover"
                                />
                                {/* Hover overlay with actions */}
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setLightboxUrl(tx.proofUrl!); }}
                                    className="p-3 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform shadow-lg"
                                    title="View Fullsize"
                                  >
                                    <Eye className="w-5 h-5" />
                                  </button>
                                  <a
                                    href={tx.proofUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-3 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform shadow-lg"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                              {tx.proofReference && (
                                <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Ref Number</span>
                                  <span className="text-xs font-bold text-slate-900">{tx.proofReference}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                              <ImageIcon className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                              <p className="text-sm font-bold text-slate-400">No proof uploaded</p>
                              <p className="text-xs text-slate-300 mt-1">
                                {tx.type === "TOP_UP" && tx.topUpMethod === "card"
                                  ? "Card payments are verified automatically"
                                  : tx.type === "ADMIN_ADJUSTMENT"
                                    ? "Admin adjustments don't require proof"
                                    : "No image was attached to this transaction"}
                              </p>
                            </div>
                          )}

                          {/* User Info Card */}
                          <div className="bg-white rounded-2xl p-5 border border-slate-100 space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              User
                            </h4>
                            <DetailRow label="Name" value={tx.userName} />
                            <DetailRow label="Email" value={tx.userEmail} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Fullscreen Image Lightbox ── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-slate-900/95 z-[200] flex items-center justify-center p-10 animate-in fade-in duration-200"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <XCircle className="w-8 h-8" />
          </button>
          <img
            src={lightboxUrl}
            alt="Proof Large"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Detail Row Helper
// ============================================================================
function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "green" | "red";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span
        className={cn(
          "text-xs font-bold",
          highlight === "green" ? "text-emerald-600" :
          highlight === "red" ? "text-red-500" :
          "text-slate-900"
        )}
      >
        {value}
      </span>
    </div>
  );
}

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ArrowRight, CreditCard, Banknote, MoreVertical } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

interface BookingTableProps {
  onRowClick: (bookingId: Id<"bookings">) => void;
  statusFilter: string;
  paymentStatusFilter: string;
  searchQuery: string;
}

export function BookingTable({ onRowClick, statusFilter, paymentStatusFilter, searchQuery }: BookingTableProps) {
  const bookings = useQuery(api.admin.getAdminBookings, {
    status: (statusFilter === "all" ? undefined : statusFilter) as any,
    paymentStatus: (paymentStatusFilter === "all" ? undefined : paymentStatusFilter) as any,
    search: searchQuery || undefined,
  });

  if (!bookings) {
    return (
      <div className="bg-white rounded-3xl shadow-ambient p-20 flex flex-col items-center justify-center gap-6 border border-slate-100">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-slate-900 font-bold text-lg">Loading Records</p>
          <p className="text-slate-500">Synchronizing with the booking engine...</p>
        </div>
      </div>
    );
  }

  const formatDates = (days?: string[]) => {
    if (!days || days.length === 0) return "Single Day";
    if (days.length === 1) return days[0];
    
    // Simple range for now, assuming sorted
    const start = new Date(days[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(days[days.length - 1]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${start} - ${end}`;
  };

  return (
    <div className="bg-white rounded-3xl shadow-ambient overflow-hidden border border-slate-100">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
              <th className="px-8 py-5">Customer</th>
              <th className="px-8 py-5">Route</th>
              <th className="px-8 py-5">Selected Dates</th>
              <th className="px-8 py-5 text-center">Status</th>
              <th className="px-8 py-5">Payment</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                       <ArrowRight className="w-8 h-8 rotate-45" />
                    </div>
                    <p className="text-slate-400 font-medium italic">No matches found in the ledger.</p>
                  </div>
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr 
                  key={booking._id} 
                  onClick={() => onRowClick(booking._id)}
                  className="hover:bg-blue-50/40 transition-all cursor-pointer group"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 flex-shrink-0 overflow-hidden ring-4 ring-white shadow-sm group-hover:shadow-md transition-shadow">
                        {booking.userAvatarUrl ? (
                          <img src={booking.userAvatarUrl} alt={booking.userName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-700 font-black text-sm uppercase">
                            {booking.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 mb-0.5">{booking.userName}</p>
                        <p className="text-xs text-slate-500 font-medium">{booking.userPhone || booking.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-slate-700">{booking.origin}</span>
                      <div className="h-0.5 w-4 bg-blue-100 rounded-full" />
                      <span className="text-sm font-medium text-slate-400">{booking.destination}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800">{formatDates(booking.selectedDays)}</span>
                      <span className="text-[10px] text-blue-600 font-bold tracking-tight uppercase mt-0.5">
                        {booking.selectedDays?.length || 1} Days Total
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                      booking.status === "confirmed" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" :
                      booking.status === "cancelled" ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200" : 
                      booking.status === "under_review" ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" :
                      "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                    }`}>
                      {booking.status === "under_review" ? "Under Review" : booking.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2.5">
                       <div className={`p-2 rounded-lg ${booking.paymentStatus === 'paid' ? 'bg-slate-100 text-slate-900' : 'bg-slate-50 text-slate-400'}`}>
                         {booking.paymentMethod === 'card' ? <CreditCard className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                       </div>
                       <div className="flex flex-col">
                         <span className="text-xs font-bold text-slate-700 capitalize">{booking.paymentMethod}</span>
                         <span className={`text-[10px] font-bold uppercase ${booking.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-slate-400'}`}>
                           {booking.paymentStatus}
                         </span>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2.5 rounded-xl text-slate-300 hover:text-blue-600 hover:bg-white hover:shadow-sm transition-all active:scale-95">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="bg-slate-50/30 px-8 py-5 border-t border-slate-100 flex items-center justify-between">
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
          Total: {bookings.length} Manifest Entries
        </p>
        <div className="flex gap-2">
           {[...Array(3)].map((_, i) => (
             <button key={i} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${i===0 ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-400 hover:bg-white'}`}>
               {i+1}
             </button>
           ))}
        </div>
      </div>
    </div>
  );
}

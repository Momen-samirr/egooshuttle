"use client";

import { useState } from "react";
import { BookingStats } from "./BookingStats";
import { BookingTable } from "./BookingTable";
import { BookingDetailsDrawer } from "./BookingDetailsDrawer";
import { Search, Filter, Download, CreditCard } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

export function BookingManagementTab() {
  const [selectedBookingId, setSelectedBookingId] = useState<Id<"bookings"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  return (
    <div className="space-y-12 pb-20">
      {/* Stats Section */}
      <BookingStats />

      {/* Main Content Area */}
      <section className="space-y-8">
        {/* Filters Header */}
        <div className="bg-white/50 backdrop-blur-3xl p-8 rounded-[3rem] border border-white shadow-ambient flex flex-wrap items-center justify-between gap-8">
          <div className="flex items-center gap-6 flex-1 min-w-[320px]">
            <div className="relative flex-1 group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-blue-600 transition-all duration-300" />
               <input 
                 type="text" 
                 placeholder="Search manifests, customers, or trip codes..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-white border-2 border-slate-50 rounded-3xl py-5 pl-16 pr-8 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-600/20 focus:ring-[12px] focus:ring-blue-600/5 transition-all shadow-inner"
               />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Status Filter */}
             <div className="flex items-center gap-3 bg-white border border-slate-100 px-6 py-4 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
               <Filter className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
               <select 
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
                 className="bg-transparent text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 focus:outline-none cursor-pointer"
               >
                 <option value="all">All Status</option>
                 <option value="confirmed">Confirmed</option>
                 <option value="pending">Pending</option>
                 <option value="under_review">Under Review</option>
                 <option value="cancelled">Cancelled</option>
               </select>
             </div>

             {/* Payment Filter */}
             <div className="flex items-center gap-3 bg-white border border-slate-100 px-6 py-4 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
               <CreditCard className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
               <select 
                 value={paymentFilter}
                 onChange={(e) => setPaymentFilter(e.target.value)}
                 className="bg-transparent text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 focus:outline-none cursor-pointer"
               >
                 <option value="all">All Payments</option>
                 <option value="paid">Settled</option>
                 <option value="pending">Awaiting</option>
                 <option value="under_review">Under Review</option>
                 <option value="failed">Failed</option>
               </select>
             </div>

             <button className="p-5 bg-slate-900 text-white rounded-3xl shadow-xl shadow-slate-200 hover:bg-black hover:scale-110 active:scale-95 transition-all duration-300">
               <Download className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Table Section */}
        <BookingTable 
          onRowClick={setSelectedBookingId}
          statusFilter={statusFilter}
          paymentStatusFilter={paymentFilter}
          searchQuery={searchQuery}
        />
      </section>

      {/* Details Drawer */}
      <BookingDetailsDrawer 
        bookingId={selectedBookingId}
        onClose={() => setSelectedBookingId(null)}
      />
    </div>
  );
}

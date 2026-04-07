"use client";

import { useState } from "react";
import { TripStats } from "./TripStats";
import { TripTable } from "./TripTable";
import { TripEditDrawer } from "./TripEditDrawer";
import { Search, Filter, Download, Route, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";

export function TripManagementTab() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingTripId, setEditingTripId] = useState<Id<"trips"> | null>(null);

  return (
    <div className="space-y-12 pb-20">
      {/* Stats Section */}
      <TripStats />

      {/* Main Content Area */}
      <section className="space-y-8">
        {/* Filters Header */}
        <div className="bg-white/50 backdrop-blur-3xl p-8 rounded-[3rem] border border-white shadow-ambient flex flex-wrap items-center justify-between gap-8">
          <div className="flex items-center gap-6 flex-1 min-w-[320px]">
            <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-blue-600 transition-all duration-300" />
              <input
                type="text"
                placeholder="Search by trip code, origin, or destination..."
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="full">Full</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Fleet Tools Link */}
            <button
              onClick={() => {
                const el = document.getElementById("fleet-tools-panel");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                } else {
                  router.push("/admin");
                }
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-3xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-[11px] font-black uppercase tracking-wider"
            >
              <Plus className="w-5 h-5" />
              New Trip
            </button>
          </div>
        </div>

        {/* Table Section */}
        <TripTable
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          onEditTrip={(id) => setEditingTripId(id)}
        />
      </section>

      {/* Edit Drawer */}
      <TripEditDrawer
        tripId={editingTripId}
        onClose={() => setEditingTripId(null)}
      />
    </div>
  );
}

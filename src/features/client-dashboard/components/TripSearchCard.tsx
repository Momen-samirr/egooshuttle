"use client";

import { useState } from "react";
import { Search, MapPin, Flag, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingMode } from "../types";

export function TripSearchCard() {
  const [mode, setMode] = useState<BookingMode>("range");
  const [pickup, setPickup] = useState("Downtown Terminal A");
  const [dropoff, setDropoff] = useState("Business District");
  const [startDate, setStartDate] = useState("Oct 24, 2023");
  const [endDate, setEndDate] = useState("Oct 31, 2023");

  return (
    <div className="bg-white rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,91,191,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#181c20]">Find a Trip</h2>
        <div className="flex gap-2">
          <button
            id="trip-mode-range"
            onClick={() => setMode("range")}
            className={cn(
              "text-xs font-bold px-3 py-1 rounded-full transition-all",
              mode === "range"
                ? "text-[#005bbf] bg-[#005bbf]/5"
                : "text-[#414754] bg-[#e5e8ee]"
            )}
          >
            Book Range
          </button>
          <button
            id="trip-mode-one-way"
            onClick={() => setMode("one-way")}
            className={cn(
              "text-xs font-bold px-3 py-1 rounded-full transition-all",
              mode === "one-way"
                ? "text-[#005bbf] bg-[#005bbf]/5"
                : "text-[#414754] bg-[#e5e8ee]"
            )}
          >
            One Way
          </button>
        </div>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Pickup + Dropoff */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#414754] ml-1 mb-1 block">
              Pickup Point
            </label>
            <div className="flex items-center bg-[#f1f4fa] rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#005bbf]/10 transition-all">
              <MapPin className="w-4 h-4 text-[#005bbf] mr-3 flex-shrink-0" />
              <input
                id="pickup-input"
                type="text"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="bg-transparent border-none w-full p-0 text-[#181c20] font-medium focus:outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#414754] ml-1 mb-1 block">
              Drop-off Point
            </label>
            <div className="flex items-center bg-[#f1f4fa] rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#005bbf]/10 transition-all">
              <Flag className="w-4 h-4 text-[#ba1a1a] mr-3 flex-shrink-0" />
              <input
                id="dropoff-input"
                type="text"
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                placeholder="Enter destination"
                className="bg-transparent border-none w-full p-0 text-[#181c20] font-medium focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Right: Dates + Search */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#414754] mb-1 block">
                Start Date
              </label>
              <div className="flex items-center gap-2 bg-[#f1f4fa] rounded-xl px-4 py-3 cursor-pointer hover:bg-[#e5e8ee] transition-colors">
                <Calendar className="w-3.5 h-3.5 text-[#414754] flex-shrink-0" />
                <span className="text-sm font-semibold text-[#181c20]">{startDate}</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#414754] mb-1 block">
                {mode === "range" ? "End Date" : "Return"}
              </label>
              <div className="flex items-center gap-2 bg-[#f1f4fa] rounded-xl px-4 py-3 cursor-pointer hover:bg-[#e5e8ee] transition-colors">
                <Calendar className="w-3.5 h-3.5 text-[#414754] flex-shrink-0" />
                <span className="text-sm font-semibold text-[#181c20]">{endDate}</span>
              </div>
            </div>
          </div>

          <button
            id="search-trips-btn"
            className="w-full h-[52px] bg-[#005bbf] text-white font-bold rounded-xl shadow-lg shadow-[#005bbf]/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-1"
          >
            <Search className="w-4 h-4" />
            Search Available Trips
          </button>
        </div>
      </div>
    </div>
  );
}

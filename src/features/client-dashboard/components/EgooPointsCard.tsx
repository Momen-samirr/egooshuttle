"use client";

import type { EgooPoints } from "../types";

interface EgooPointsCardProps {
  points: EgooPoints;
}

export function EgooPointsCard({ points }: EgooPointsCardProps) {
  return (
    <div className="bg-gradient-to-br from-[#005bbf] to-[#1a73e8] rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-[#005bbf]/10 flex-shrink-0">
      {/* Icon */}
      <div className="bg-white/20 p-2 rounded-xl flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      </div>

      {/* Points */}
      <div>
        <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
          Egoo Points
        </p>
        <p className="text-xl font-black text-white">
          {points.total.toLocaleString()}
        </p>
      </div>

      {/* Progress */}
      <div className="ml-4 pl-4 border-l border-white/20">
        <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
          Next Reward
        </p>
        <div className="w-24 h-1.5 bg-white/20 rounded-full mt-1.5">
          <div
            className="h-full bg-[#89fa9b] rounded-full transition-all duration-700"
            style={{ width: `${points.progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Loader2, User, CheckCircle, XCircle, Search, ShieldAlert } from "lucide-react";

export function DriverManagementTab() {
  const drivers = useQuery(api.admin.getAdminDrivers);
  const approveDriver = useMutation(api.drivers.approveDriver);

  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (drivers === undefined) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#005bbf]" />
      </div>
    );
  }

  const handleApprove = async (driverId: any) => {
    try {
      setProcessingId(driverId);
      await approveDriver({ driverId });
    } catch (err) {
      console.error(err);
      alert("Failed to approve driver");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredDrivers = drivers.filter((d: any) => 
    d.userName.toLowerCase().includes(search.toLowerCase()) ||
    d.licenseNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#181c20]">Driver Directory</h2>
          <p className="text-[#414754] text-sm mt-1">Review and approve incoming driver applications</p>
        </div>

        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search drivers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border-2 border-[#e0e4f0] rounded-xl focus:border-[#005bbf] outline-none text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(24,28,32,0.04)] border border-[#e0e4f0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f8f9fc] text-[#414754] uppercase font-semibold text-xs border-b border-[#e0e4f0]">
              <tr>
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4">License & Vehicle</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Registered</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e4f0]">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#727785]">
                    No drivers found.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver: any) => (
                  <tr key={driver._id} className="hover:bg-[#f8f9fc]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#e0e4f0] rounded-full flex items-center justify-center overflow-hidden">
                          {driver.userAvatar ? (
                            <img src={driver.userAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[#181c20]">{driver.userName}</p>
                          <p className="text-xs text-[#727785]">{driver.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-[#181c20] bg-slate-100 px-2 flex self-start rounded-md text-xs py-0.5 border">
                          {driver.licenseNumber}
                        </span>
                        <span className="text-xs text-[#727785]">
                          {driver.vehicleMake} {driver.vehicleModel} • {driver.vehiclePlate}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {driver.isVerified ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e6f4ea] text-[#137333] text-xs font-semibold border border-[#ceead6]">
                          <CheckCircle className="w-3.5 h-3.5" /> Activated
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fff4e5] text-[#b06000] text-xs font-semibold border border-[#feefc3] animate-pulse">
                          <ShieldAlert className="w-3.5 h-3.5" /> Pending
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#414754]">
                      {new Date(driver.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!driver.isVerified && (
                        <button
                          onClick={() => handleApprove(driver._id)}
                          disabled={processingId === driver._id}
                          className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                        >
                          {processingId === driver._id ? "Approving..." : "Approve"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

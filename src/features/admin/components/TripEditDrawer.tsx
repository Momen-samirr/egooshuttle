"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { X, Loader2, CheckCircle2, MapPin, Clock, DollarSign, Users } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

interface TripEditDrawerProps {
  tripId: Id<"trips"> | null;
  onClose: () => void;
}

export function TripEditDrawer({ tripId, onClose }: TripEditDrawerProps) {
  const trip = useQuery(api.trips.getTripById, tripId ? { tripId } : "skip");
  const updateTrip = useMutation(api.admin.updateTrip);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [availableSeats, setAvailableSeats] = useState("");
  const [pricePerSeat, setPricePerSeat] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Populate form when trip loads
  useEffect(() => {
    if (trip) {
      setOrigin(trip.origin ?? "");
      setDestination(trip.destination ?? "");
      setDepartureTime(trip.departureTime ?? "");
      setAvailableSeats(String(trip.availableSeats ?? ""));
      setPricePerSeat(String(trip.pricePerSeat ?? ""));
      setStatus(trip.status ?? "pending");
    }
  }, [trip]);

  const handleSave = async () => {
    if (!tripId) return;
    setSaving(true);
    setSuccess(false);

    try {
      const args: any = { tripId };

      if (origin && origin !== trip?.origin) args.origin = origin;
      if (destination && destination !== trip?.destination) args.destination = destination;
      if (departureTime && departureTime !== trip?.departureTime) args.departureTime = departureTime;
      if (availableSeats && Number(availableSeats) !== trip?.availableSeats) args.availableSeats = Number(availableSeats);
      if (pricePerSeat && Number(pricePerSeat) !== trip?.pricePerSeat) args.pricePerSeat = Number(pricePerSeat);
      if (status && status !== trip?.status) args.status = status;

      await updateTrip(args);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update trip");
    } finally {
      setSaving(false);
    }
  };

  if (!tripId) return null;

  const isOpen = !!tripId;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 h-screen w-full max-w-[480px] bg-white shadow-[0_0_80px_rgba(0,0,0,0.15)] z-[70] transform transition-transform duration-700 cubic-bezier(0.16,1,0.3,1) flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-20">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Edit Trip
            </h3>
            <p className="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase mt-1">
              {trip?.tripCode ?? "Loading..."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-[1.25rem] transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!trip ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Origin */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                  Origin
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                  Destination
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Departure Time */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  Departure Time
                </label>
                <input
                  type="text"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  placeholder="e.g. 08:00 or ISO date"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Capacity + Price row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    Total Seats
                  </label>
                  <input
                    type="number"
                    value={availableSeats}
                    onChange={(e) => setAvailableSeats(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <DollarSign className="w-3.5 h-3.5" />
                    Price / Seat
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pricePerSeat}
                    onChange={(e) => setPricePerSeat(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "available", label: "Active", color: "emerald" },
                    { value: "pending", label: "Pending", color: "amber" },
                    { value: "cancelled", label: "Inactive", color: "slate" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(opt.value)}
                      className={`py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                        status === opt.value
                          ? opt.color === "emerald"
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                            : opt.color === "amber"
                              ? "bg-amber-500 text-white shadow-lg shadow-amber-200"
                              : "bg-slate-700 text-white shadow-lg shadow-slate-300"
                          : "bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/30 backdrop-blur-md sticky bottom-0">
              {success ? (
                <div className="flex items-center justify-center gap-3 py-5 text-emerald-600 font-black">
                  <CheckCircle2 className="w-6 h-6" />
                  Trip Updated Successfully
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={onClose}
                    disabled={saving}
                    className="py-4 px-6 rounded-2xl font-black text-sm bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="py-4 px-6 rounded-2xl font-black text-sm bg-blue-600 text-white shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

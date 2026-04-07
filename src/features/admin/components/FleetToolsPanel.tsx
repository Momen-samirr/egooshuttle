"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Upload, Loader2, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { TripService } from "@/features/trips/services/trip.service";

type StatusMsg = { type: "idle" | "loading" | "success" | "error"; message: string };

export function FleetToolsPanel() {
  // --- CSV Upload State ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTripsMutation = useMutation(api.trips.uploadTrips);
  const [uploadStatus, setUploadStatus] = useState<StatusMsg>({ type: "idle", message: "" });

  // --- Quick Manual Add State ---
  const createSingleTrip = useMutation(api.admin.createSingleTrip);
  const [routeName, setRouteName] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("24");
  const [addStatus, setAddStatus] = useState<StatusMsg>({ type: "idle", message: "" });

  // --- Delete All State ---
  const deleteAllMut = useMutation(api.admin.deleteAllTrips);
  const [deleteStatus, setDeleteStatus] = useState<StatusMsg>({ type: "idle", message: "" });

  // --------------- CSV File Upload ---------------
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setUploadStatus({ type: "error", message: "File too large. Max 50MB." });
      return;
    }

    setUploadStatus({ type: "loading", message: "Processing file..." });

    try {
      const text = await file.text();
      const processed = TripService.processUploadedTrips(text);
      const validPayload = TripService.extractValidTripsPayload(processed);

      if (validPayload.length === 0) {
        setUploadStatus({ type: "error", message: "No valid trips found in the file." });
        return;
      }

      const res = await uploadTripsMutation({ trips: validPayload });
      const skippedMsg = res.skipped > 0 ? ` (${res.skipped} duplicates skipped)` : "";
      setUploadStatus({ type: "success", message: `Uploaded ${res.count} trips successfully!${skippedMsg}` });
    } catch (err: unknown) {
      setUploadStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to upload trips.",
      });
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --------------- Quick Manual Add ---------------
  const handleQuickAdd = async () => {
    if (!routeName.trim()) return;
    setAddStatus({ type: "loading", message: "Creating trip..." });

    try {
      const result = await createSingleTrip({
        routeName: routeName.trim(),
        price: parseFloat(price) || 0,
        capacity: parseInt(capacity, 10) || 24,
      });
      setAddStatus({ type: "success", message: `Trip ${result.tripCode} created!` });
      setRouteName("");
      setPrice("");
      setCapacity("24");
      setTimeout(() => setAddStatus({ type: "idle", message: "" }), 3000);
    } catch (err: unknown) {
      setAddStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create trip.",
      });
    }
  };

  return (
    <div id="fleet-tools-panel" className="space-y-6">
      <h2 className="text-2xl font-semibold" style={{ color: "var(--color-on-surface)" }}>
        Predefined Fleet Tools
      </h2>

      {/* ---- Bulk Upload + Quick Add Card ---- */}
      <div className="p-8 rounded-3xl space-y-6" style={{ backgroundColor: "var(--color-surface-container-low)" }}>
        {/* Bulk Upload */}
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--color-primary)" }} />
          <h4 className="text-lg font-bold">Bulk Trip Upload</h4>
          <p className="text-xs mt-2" style={{ color: "var(--color-on-surface-variant)" }}>
            Import .CSV or .XLSX files to schedule multiple routes instantly.
          </p>
        </div>

        {/* Drop Zone */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={handleFileSelect}
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer hover:bg-white"
          style={{
            borderColor: "var(--color-outline-variant)",
            backgroundColor: "rgba(255,255,255,0.5)",
          }}
        >
          <p className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
            Click to select files
          </p>
          <p className="text-[10px] mt-1" style={{ color: "var(--color-on-surface-variant)" }}>
            Maximum file size: 50MB
          </p>
        </div>

        {/* Upload status */}
        {uploadStatus.type !== "idle" && (
          <div className="flex items-center gap-2 text-sm font-medium">
            {uploadStatus.type === "loading" && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
            {uploadStatus.type === "success" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
            {uploadStatus.type === "error" && <AlertCircle className="w-4 h-4 text-red-600" />}
            <span className={
              uploadStatus.type === "success" ? "text-green-600" :
              uploadStatus.type === "error" ? "text-red-600" : "text-slate-600"
            }>
              {uploadStatus.message}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="h-px opacity-20" style={{ backgroundColor: "var(--color-outline-variant)" }} />

        {/* Quick Manual Add */}
        <div className="space-y-4">
          <h5 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-on-surface-variant)" }}>
            Quick Manual Add
          </h5>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase ml-1" style={{ color: "var(--color-on-surface-variant)" }}>
                Route Name
              </label>
              <input
                id="admin-route-name"
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                className="w-full border-none rounded-xl text-sm py-3 px-4 focus:ring-2 transition-all outline-none"
                style={{
                  backgroundColor: "var(--color-surface-container-highest)",
                  color: "var(--color-on-surface)",
                }}
                placeholder="e.g. Central Station → Tech District"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase ml-1" style={{ color: "var(--color-on-surface-variant)" }}>
                  Price
                </label>
                <input
                  id="admin-trip-price"
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border-none rounded-xl text-sm py-3 px-4 focus:ring-2 transition-all outline-none"
                  style={{
                    backgroundColor: "var(--color-surface-container-highest)",
                    color: "var(--color-on-surface)",
                  }}
                  placeholder="$0.00"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase ml-1" style={{ color: "var(--color-on-surface-variant)" }}>
                  Capacity
                </label>
                <input
                  id="admin-trip-capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full border-none rounded-xl text-sm py-3 px-4 focus:ring-2 transition-all outline-none"
                  style={{
                    backgroundColor: "var(--color-surface-container-highest)",
                    color: "var(--color-on-surface)",
                  }}
                  placeholder="24"
                />
              </div>
            </div>

            {/* Add status */}
            {addStatus.type !== "idle" && (
              <div className="flex items-center gap-2 text-sm font-medium">
                {addStatus.type === "loading" && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
                {addStatus.type === "success" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                {addStatus.type === "error" && <AlertCircle className="w-4 h-4 text-red-600" />}
                <span className={
                  addStatus.type === "success" ? "text-green-600" :
                  addStatus.type === "error" ? "text-red-600" : "text-slate-600"
                }>
                  {addStatus.message}
                </span>
              </div>
            )}

            <button
              id="admin-schedule-trip"
              onClick={handleQuickAdd}
              disabled={!routeName.trim() || addStatus.type === "loading"}
              className="w-full py-3 font-bold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--color-surface-container-highest)",
                color: "var(--color-primary)",
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = "var(--color-primary)";
                  e.currentTarget.style.color = "white";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-surface-container-highest)";
                e.currentTarget.style.color = "var(--color-primary)";
              }}
            >
              Schedule Single Trip
            </button>
          </div>
        </div>
      </div>

      {/* ---- Heatmap Card ---- */}
      <div
        className="p-6 rounded-3xl shadow-sm"
        style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
      >
        <h4 className="text-sm font-bold mb-4">Upcoming Schedule Heatmap</h4>
        <div className="grid grid-cols-7 gap-1">
          {[0.2, 0.4, 0.1, 0.8, 1.0, 0.3, 0.1].map((opacity, i) => (
            <div
              key={i}
              className="h-8 rounded-lg"
              style={{ backgroundColor: "var(--color-primary)", opacity }}
            />
          ))}
        </div>
        <p className="text-[10px] mt-4 text-center" style={{ color: "var(--color-on-surface-variant)" }}>
          Peak demand projected for tomorrow at 08:00 AM
        </p>
      </div>

      {/* ---- Danger Zone ---- */}
      <div className="p-8 rounded-3xl border-2 border-dashed border-rose-200 bg-rose-50/30 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 rounded-xl">
            <Trash2 className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h4 className="text-sm font-black text-rose-700">Danger Zone</h4>
            <p className="text-[10px] text-rose-500 font-medium">
              Irreversible destructive operations
            </p>
          </div>
        </div>

        {deleteStatus.type !== "idle" && (
          <div className="flex items-center gap-2 text-sm font-medium">
            {deleteStatus.type === "loading" && <Loader2 className="w-4 h-4 animate-spin text-rose-500" />}
            {deleteStatus.type === "success" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
            {deleteStatus.type === "error" && <AlertCircle className="w-4 h-4 text-red-600" />}
            <span className={
              deleteStatus.type === "success" ? "text-green-600" :
              deleteStatus.type === "error" ? "text-red-600" : "text-rose-600"
            }>
              {deleteStatus.message}
            </span>
          </div>
        )}

        <button
          id="admin-delete-all-trips"
          disabled={deleteStatus.type === "loading"}
          onClick={async () => {
            const c1 = confirm(
              "⚠️ DELETE ALL TRIPS?\n\nThis will permanently delete:\n• All trips\n• All bookings\n• All booking days\n• All payment history\n\nThis action CANNOT be undone."
            );
            if (!c1) return;
            const c2 = confirm(
              "FINAL CONFIRMATION\n\nType OK to confirm you want to delete ALL trip data from the database."
            );
            if (!c2) return;

            setDeleteStatus({ type: "loading", message: "Deleting... this may take a moment." });
            try {
              let totalDeleted = 0;
              let done = false;
              while (!done) {
                const res = await deleteAllMut();
                totalDeleted += res.deleted;
                done = res.done;
                if (!done) {
                  setDeleteStatus({ type: "loading", message: `Deleted ${totalDeleted} records so far...` });
                }
              }
              setDeleteStatus({ type: "success", message: `Done! Deleted ${totalDeleted} records.` });
              setTimeout(() => setDeleteStatus({ type: "idle", message: "" }), 5000);
            } catch (err) {
              setDeleteStatus({
                type: "error",
                message: err instanceof Error ? err.message : "Failed to delete trips.",
              });
            }
          }}
          className="w-full py-3.5 font-black rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98] shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
        >
          {deleteStatus.type === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          Delete All Trips & Related Data
        </button>
      </div>
    </div>
  );
}

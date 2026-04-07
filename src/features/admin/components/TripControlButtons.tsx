"use client";

import { Play, Megaphone, Printer, Trash2, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROUTES } from "@/lib/constants";
import type { Id } from "../../../../convex/_generated/dataModel";

interface TripControlButtonsProps {
  tripId: Id<"trips">;
  status: string;
}

export function TripControlButtons({ tripId, status }: TripControlButtonsProps) {
  const router = useRouter();
  const updateStatus = useMutation(api.admin.updateTripStatus);
  const deleteTripMut = useMutation(api.admin.deleteTrip);
  const [busy, setBusy] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setBusy(action);
    try {
      if (action === "start") {
        await updateStatus({ tripId, status: "assigned" });
      } else if (action === "activate") {
        await updateStatus({ tripId, status: "available" });
      } else if (action === "deactivate") {
        if (!confirm("Deactivate this trip? It will no longer appear for customers.")) {
          setBusy(null);
          return;
        }
        await updateStatus({ tripId, status: "cancelled" });
      } else if (action === "cancel") {
        if (!confirm("Are you sure you want to cancel this trip? This action cannot be undone.")) {
          setBusy(null);
          return;
        }
        await deleteTripMut({ tripId });
        router.push(ROUTES.ADMIN);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const isCancelled = status === "cancelled";
  const isCompleted = status === "completed";
  const disabled = isCompleted;

  const actions = [
    {
      key: "start",
      label: "Start Trip",
      icon: Play,
      primary: true,
      disabled: disabled || status === "assigned" || isCancelled,
    },
    ...(isCancelled
      ? [
          {
            key: "activate",
            label: "Activate",
            icon: ToggleRight,
            primary: false,
            activate: true,
            disabled: false,
          },
        ]
      : [
          {
            key: "deactivate",
            label: "Deactivate",
            icon: ToggleLeft,
            primary: false,
            danger: false,
            deactivate: true,
            disabled: disabled || isCancelled,
          },
        ]),
    {
      key: "notify",
      label: "Notify All",
      icon: Megaphone,
      primary: false,
      disabled: disabled || isCancelled,
    },
    {
      key: "print",
      label: "Print Manifest",
      icon: Printer,
      primary: false,
      disabled: false,
    },
    {
      key: "cancel",
      label: "Cancel Trip",
      icon: Trash2,
      primary: false,
      danger: true,
      disabled: disabled || isCancelled,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {actions.map((a) => {
        const Icon = a.icon;
        const loading = busy === a.key;

        let style: React.CSSProperties = {};
        let className = "flex flex-col items-center justify-center gap-3 p-6 rounded-xl transition-all text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed";

        if (a.primary) {
          style = { backgroundColor: "var(--color-primary)", color: "white" };
          className += " shadow-ambient hover:opacity-90";
        } else if ((a as any).activate) {
          style = { border: "2px solid rgba(22,163,74,0.3)", color: "#16a34a" };
          className += " hover:bg-emerald-50";
        } else if ((a as any).deactivate) {
          style = { border: "2px solid rgba(100,116,139,0.2)", color: "#64748b" };
          className += " hover:bg-slate-50";
        } else if ((a as any).danger) {
          style = { border: "2px solid rgba(186,26,26,0.2)", color: "var(--color-error)" };
          className += " hover:bg-red-50";
        } else {
          style = { backgroundColor: "var(--color-surface-container-highest)", color: "var(--color-on-surface)" };
          className += " hover:opacity-80";
        }

        return (
          <button
            key={a.key}
            className={className}
            style={style}
            disabled={a.disabled || loading}
            onClick={() => handleAction(a.key)}
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Icon className="w-6 h-6" />}
            <span>{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}

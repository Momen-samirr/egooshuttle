"use client";

import { Search, Bell, Settings } from "lucide-react";
import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";

export function AdminTopBar() {
  const { appUser } = useGoogleAuth();

  const initials = (() => {
    const name = appUser?.name;
    if (name?.trim()) {
      const parts = name.trim().split(/\s+/);
      return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "A";
    }
    return "A";
  })();

  return (
    <header
      className="fixed top-0 w-full flex justify-between items-center px-6 h-16 bg-white z-40 shadow-sm"
    >
      {/* Left: Brand + Search */}
      <div className="flex items-center gap-8">
        <span className="text-xl font-bold tracking-tight text-blue-700">
          EgooBus Admin
        </span>
        <div className="hidden md:flex items-center px-4 py-2 rounded-xl" style={{ backgroundColor: "var(--color-surface-container-low)" }}>
          <Search className="w-4 h-4 mr-2" style={{ color: "var(--color-on-surface-variant)" }} />
          <input
            id="admin-global-search"
            className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-64 placeholder:text-slate-400"
            placeholder="Search trips, drivers, or users..."
            type="text"
          />
        </div>
      </div>

      {/* Right: Actions + Profile */}
      <div className="flex items-center gap-4">
        <button
          id="admin-notifications"
          className="p-2 rounded-full hover:bg-slate-50 transition-colors relative"
        >
          <Bell className="w-5 h-5 text-slate-500" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-error)" }} />
        </button>
        <button
          id="admin-settings"
          className="p-2 rounded-full hover:bg-slate-50 transition-colors"
        >
          <Settings className="w-5 h-5 text-slate-500" />
        </button>

        <div className="h-8 w-px opacity-20" style={{ backgroundColor: "var(--color-outline-variant)" }} />

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold" style={{ color: "var(--color-on-surface)" }}>
              {appUser?.name ?? "Admin"}
            </p>
            <p className="text-[10px]" style={{ color: "var(--color-on-surface-variant)" }}>
              Administrator
            </p>
          </div>
          {appUser?.avatarUrl ? (
            <img
              alt="Admin avatar"
              className="w-10 h-10 rounded-full object-cover border-2"
              style={{ borderColor: "var(--color-primary-fixed)" }}
              src={appUser.avatarUrl}
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-container))" }}
            >
              {initials}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

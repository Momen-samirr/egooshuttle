"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { useClientDashboardStore } from "@/store/client-dashboard-store";
import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";

const links = [
  { href: ROUTES.DASHBOARD, label: "Dashboard" },
  { href: ROUTES.TRIPS, label: "Find Trips" },
  { href: ROUTES.BOOKINGS, label: "My Bookings" },
] as const;

export function ClientTopNav({
  userInitials,
}: {
  userInitials: string;
}) {
  const pathname = usePathname();
  const navSearchQuery = useClientDashboardStore((s) => s.navSearchQuery);
  const setNavSearchQuery = useClientDashboardStore((s) => s.setNavSearchQuery);
  const { signOut } = useGoogleAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[color-mix(in_srgb,var(--color-outline-variant)_20%,transparent)] bg-white/80 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-950/80 dark:shadow-none">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link
            href={ROUTES.DASHBOARD}
            className="text-2xl font-bold tracking-tight text-[#1a56b8] dark:text-blue-400"
          >
            EgooBus
          </Link>
          <div className="hidden gap-6 md:flex">
            {links.map(({ href, label }) => {
              const isActive =
                pathname === href || (href !== ROUTES.DASHBOARD && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-lg px-3 py-1 text-sm font-medium transition-colors",
                    isActive
                      ? "border-b-2 border-[#1a56b8] py-1 font-bold text-[#1a56b8] dark:border-blue-400 dark:text-blue-400"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-on-surface-variant)]" />
            <input
              type="search"
              value={navSearchQuery}
              onChange={(e) => setNavSearchQuery(e.target.value)}
              placeholder="Search routes..."
              className="w-64 rounded-full border-none bg-[var(--color-surface-container-highest)] py-2 pl-10 pr-4 text-sm transition-all focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]"
              aria-label="Search routes"
            />
          </div>
          <button
            type="button"
            className="rounded-full p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-[var(--color-on-surface-variant)]" />
          </button>
          <div className="flex items-center gap-4 border-l border-[color-mix(in_srgb,var(--color-outline-variant)_30%,transparent)] pl-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-container)] text-xs font-bold text-[var(--color-on-primary)]">
              {userInitials}
            </div>
            <button
              onClick={signOut}
              className="group flex flex-col items-center justify-center text-slate-500 hover:text-red-600 transition-colors"
              aria-label="Sign Out"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-[10px] font-semibold mt-0.5">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

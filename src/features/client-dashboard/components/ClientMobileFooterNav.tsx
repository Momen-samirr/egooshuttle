"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus, Home, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

const items = [
  { href: ROUTES.DASHBOARD, label: "Dashboard", icon: Home },
  { href: ROUTES.TRIPS, label: "Find", icon: Search },
  { href: ROUTES.BOOKINGS, label: "Trips", icon: Bus },
  { href: ROUTES.PROFILE, label: "Profile", icon: User },
] as const;

export function ClientMobileFooterNav() {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-3xl border-t border-slate-100 bg-white px-4 pb-6 pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden dark:border-slate-800 dark:bg-slate-900">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== ROUTES.DASHBOARD && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center px-5 py-2 duration-200 ease-out",
              active
                ? "scale-90 rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "text-slate-400 dark:text-slate-500",
            )}
          >
            <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 2} />
            <span className="mt-0.5 text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </footer>
  );
}

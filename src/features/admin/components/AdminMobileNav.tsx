"use client";

import { usePathname } from "next/navigation";
import { LayoutDashboard, Route, Users, BarChart3, Plus } from "lucide-react";
import { ROUTES } from "@/lib/constants";

const MOBILE_NAV = [
  { label: "Dash",  icon: LayoutDashboard, href: ROUTES.ADMIN },
  { label: "Trips", icon: Route,           href: ROUTES.ADMIN_TRIPS },
  { label: "Users", icon: Users,           href: ROUTES.ADMIN_USERS },
  { label: "Stats", icon: BarChart3,       href: ROUTES.ADMIN_ANALYTICS },
];

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 flex justify-around items-center h-16 z-50">
      {MOBILE_NAV.slice(0, 2).map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center ${isActive ? "text-blue-700" : "text-slate-400"}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-bold">{item.label}</span>
          </a>
        );
      })}

      {/* Elevated FAB */}
      <a
        href={ROUTES.ADMIN}
        className="text-white p-3 rounded-full -translate-y-4 shadow-lg"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <Plus className="w-5 h-5" />
      </a>

      {MOBILE_NAV.slice(2).map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center ${isActive ? "text-blue-700" : "text-slate-400"}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-bold">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

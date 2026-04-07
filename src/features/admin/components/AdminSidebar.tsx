"use client";

import { usePathname, useRouter } from "next/navigation";
import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";
import { ROUTES } from "@/lib/constants";
import {
  LayoutDashboard, Route, UserCog, Users, Bus, BarChart3,
  Plus, HelpCircle, LogOut, Banknote, Wallet,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: ROUTES.ADMIN },
  { label: "Bookings",  icon: Users,           href: ROUTES.ADMIN_BOOKINGS },
  { label: "InstaPay",  icon: Banknote,        href: ROUTES.ADMIN_INSTAPAY },
  { label: "Wallet",    icon: Wallet,          href: ROUTES.ADMIN_WALLET },
  { label: "Trips",     icon: Route,           href: ROUTES.ADMIN_TRIPS },
  { label: "Drivers",   icon: UserCog,         href: ROUTES.ADMIN_DRIVERS },
  { label: "Users",     icon: Users,           href: ROUTES.ADMIN_USERS },
  { label: "Vehicles",  icon: Bus,             href: ROUTES.ADMIN_VEHICLES },
  { label: "Analytics", icon: BarChart3,       href: ROUTES.ADMIN_ANALYTICS },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useGoogleAuth();

  const handleCreateTrip = () => {
    const el = document.getElementById("fleet-tools-panel");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(ROUTES.ADMIN);
    }
  };

  return (
    <aside
      className="fixed left-0 h-full w-64 border-r border-slate-100 bg-slate-50 flex-col pt-20 pb-4 overflow-y-auto hidden md:flex z-30"
    >
      {/* Branding */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-black text-blue-700 uppercase tracking-widest">
          EgooBus
        </h2>
        <p className="text-[10px] font-medium text-slate-500 tracking-[0.2em] uppercase">
          Precision Concierge
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm ${
                isActive
                  ? "text-blue-700 border-r-4 border-blue-700 bg-white font-semibold"
                  : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Icon className="w-5 h-5" style={isActive ? { fill: "currentColor", fillOpacity: 0.15 } : undefined} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Create New Trip CTA */}
      <div className="px-4 mt-8">
        <button
          id="admin-create-trip-cta"
          onClick={handleCreateTrip}
          className="w-full py-4 px-4 text-white rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] transition-transform active:scale-95 duration-100 text-sm font-bold"
          style={{
            background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)",
            boxShadow: "0 8px 24px rgba(0, 91, 191, 0.2)",
          }}
        >
          <Plus className="w-5 h-5" />
          Create New Trip
        </button>
      </div>

      {/* Footer */}
      <div className="mt-auto px-4 space-y-1">
        <a
          href="#"
          className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Help Center</span>
        </a>
        <button
          id="admin-logout"
          onClick={() => signOut()}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors hover:bg-red-50"
          style={{ color: "var(--color-error)" }}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}

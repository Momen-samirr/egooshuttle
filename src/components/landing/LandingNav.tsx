"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Bus, Menu, X, User } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useGoogleAuth } from "@/features/auth/hooks/useGoogleAuth";


const navLinks = [
  { label: "How it Works", href: "#how-it-works" },
  { label: "For Drivers", href: "#drivers" },
  { label: "Payments", href: "#payments" },
  { label: "Safety", href: "#safety" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, isLoading, appUser } = useGoogleAuth();


  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      role="banner"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "shadow-ambient"
          : "",
      )}
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        backgroundColor: scrolled
          ? "rgba(247, 249, 255, 0.95)"
          : "rgba(247, 249, 255, 0.80)",
      }}
    >
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-10">
          <Link href={ROUTES.HOME} id="nav-logo" className="flex items-center gap-2.5" aria-label="EgooBus home">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ color: "var(--color-primary)" }}>
              EgooBus
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8">
            {navLinks.map((link, i) => (
              <a
                key={link.label}
                href={link.href}
                id={`nav-link-${i}`}
                className={cn(
                  "text-sm font-medium transition-colors duration-150",
                  i === 0
                    ? "border-b-2 pb-0.5 font-semibold"
                    : "hover:opacity-70"
                )}
                style={{
                  color: i === 0 ? "var(--color-primary)" : "var(--color-on-surface-variant)",
                  borderColor: i === 0 ? "var(--color-primary)" : "transparent",
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isLoading ? (
            <div className="w-40 h-10 rounded-xl bg-slate-200/50 animate-pulse" />
          ) : isAuthenticated ? (
            <Link
              href={ROUTES.DASHBOARD}
              id="nav-go-dashboard"
              className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 hover:opacity-90 active:scale-95 shadow-ambient flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg, #005bbf 0%, #1a73e8 100%)",
                color: "var(--color-on-primary)",
              }}
            >
              {appUser?.avatarUrl ? (
                <img src={appUser.avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href={ROUTES.LOGIN}
                id="nav-login"
                className="px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:opacity-80"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Login
              </Link>
              <Link
                href={ROUTES.SIGN_UP}
                id="nav-get-started"
                className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 hover:opacity-90 active:scale-95 shadow-ambient"
                style={{
                  background: "linear-gradient(135deg, #005bbf 0%, #1a73e8 100%)",
                  color: "var(--color-on-primary)",
                }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>


        {/* Mobile hamburger */}
        <button
          id="nav-mobile-toggle"
          className="md:hidden p-2 rounded-lg transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          style={{ color: "var(--color-on-surface)" }}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden absolute top-20 left-0 right-0 shadow-ambient"
          style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
        >
          <nav className="px-6 py-6 space-y-4" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block text-sm font-medium py-2"
                style={{ color: "var(--color-on-surface)" }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t" style={{ borderColor: "rgba(193,198,214,0.2)" }}>
              {isLoading ? (
                <div className="h-10 rounded-xl bg-slate-200/50 animate-pulse" />
              ) : isAuthenticated ? (
                <Link href={ROUTES.DASHBOARD} className="py-3 text-center rounded-xl text-sm font-bold text-white gradient-brand flex items-center justify-center gap-2">
                  {appUser?.avatarUrl ? (
                    <img src={appUser.avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href={ROUTES.LOGIN} className="py-3 text-center rounded-xl text-sm font-medium" style={{ backgroundColor: "var(--color-surface-container-highest)", color: "var(--color-on-surface)" }}>Login</Link>
                  <Link href={ROUTES.SIGN_UP} className="py-3 text-center rounded-xl text-sm font-bold text-white gradient-brand">Get Started</Link>
                </>
              )}
            </div>

          </nav>
        </div>
      )}
    </header>
  );
}

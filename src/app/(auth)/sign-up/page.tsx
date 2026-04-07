import type { Metadata } from "next";
import Link from "next/link";
import { Bus, ShieldCheck, Clock } from "lucide-react";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Create Account | EgooBus",
  description:
    "Join EgooBus — Egypt's shared trip booking platform. Create your account and start booking affordable shuttle trips today.",
};

const features = [
  {
    icon: ShieldCheck,
    title: "Reliable Schedules",
    description: "Punctuality is our core signature.",
  },
  {
    icon: Bus,
    title: "Premium Fleet",
    description: "Travel in climate-controlled, comfortable coaches.",
  },
  {
    icon: Clock,
    title: "Real-time Tracking",
    description: "Know exactly when your bus arrives.",
  },
];

export default function SignUpPage() {
  return (
    <main
      className="min-h-screen flex flex-col md:flex-row"
      style={{ backgroundColor: "var(--color-surface)" }}
      dir="ltr"
    >
      {/* ===== Left: Branding Panel ===== */}
      <section
        aria-label="EgooBus branding"
        className="hidden md:flex md:w-5/12 lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{
          background: "linear-gradient(135deg, #005bbf 0%, #1a73e8 100%)",
        }}
      >
        {/* Decorative blobs — depth without heavy elements */}
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(134, 248, 152, 0.2)" }} /* secondary-container glow */
        />
        <div
          className="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(0, 27, 65, 0.3)" }}
        />
        {/* Asymmetric right-side breathing space — per DESIGN.md §6 */}
        <div className="relative z-10 w-full max-w-md mr-0 ml-auto pr-0 pl-4">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <Bus className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              EgooBus
            </span>
          </div>

          {/* Display headline */}
          <h1 className="text-display-lg mb-5 text-white leading-tight">
            Your Precision
            <br />
            Journey Awaits.
          </h1>

          <p
            className="text-body-md leading-relaxed mb-10"
            style={{ color: "var(--color-primary-fixed)" }}
          >
            Experience the gold standard in regional transit. Real-time
            tracking, premium comfort, and seamless booking for the modern
            traveler.
          </p>

          {/* Glass feature cards — per DESIGN.md §2 Glass & Gradient Rule */}
          <div className="space-y-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    background: "rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.12)" }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: "var(--color-secondary-fixed)" }}
                    />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {feature.title}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--color-primary-fixed)" }}
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Right: Form Panel ===== */}
      {/*
        Elevation via tonal layering — form sits on surface-container-low
        which is lighter than the base surface, making the form "well" feel recessed.
        The card (surface-container-lowest = white) then pops above it.
      */}
      <section
        className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-16 overflow-y-auto"
        style={{ backgroundColor: "var(--color-surface-container-low)" }}
      >
        <div className="w-full max-w-md">
          {/* Mobile-only logo */}
          <div className="md:hidden mb-8 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mb-3">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <span
              className="text-xl font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              EgooBus
            </span>
          </div>

          {/*
            Form "card" — surface-container-lowest (white) sitting on
            surface-container-low background creates natural elevation.
            NO explicit border per the No-Line Rule.
          */}
          <div
            className="rounded-3xl p-8 shadow-ambient"
            style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
          >
            {/* Header */}
            <div className="mb-8">
              <h2
                className="text-headline-sm mb-1.5 tracking-tight"
                style={{ color: "var(--color-on-surface)" }}
              >
                Create Account
              </h2>
              <p
                className="text-body-md"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Join Egypt&apos;s most reliable travel network today.
              </p>
            </div>

            {/* Form Component */}
            <SignUpForm />

            {/* Login link */}
            <p
              className="text-center text-sm mt-6"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Already have an account?{" "}
              <Link
                href={ROUTES.LOGIN}
                id="signup-link-login"
                className="font-bold hover:underline ml-0.5"
                style={{ color: "var(--color-primary)" }}
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer
        className="w-full absolute bottom-0 left-0 right-0 hidden md:flex items-center justify-between px-8 py-4"
        style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
      >
        <Link
          href={ROUTES.HOME}
          id="footer-logo"
          className="text-sm font-semibold hover:underline transition-colors"
          style={{ color: "var(--color-on-surface)" }}
        >
          EgooBus
        </Link>
        <div className="flex gap-5">
          {["Privacy Policy", "Terms of Service", "Cookie Settings"].map(
            (label) => (
              <a
                key={label}
                href="#"
                id={`footer-${label.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-xs hover:underline opacity-70 hover:opacity-100 transition-opacity"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                {label}
              </a>
            )
          )}
        </div>
        <p
          className="text-xs opacity-70"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          © {new Date().getFullYear()} EgooBus. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

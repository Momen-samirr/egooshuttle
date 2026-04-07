"use client";

import Link from "next/link";
import { Bus, Globe, Share2 } from "lucide-react";
import { ROUTES } from "@/lib/constants";

const footerLinks = {
  Company: [
    { label: "About Us", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
  ],
  Safety: [
    { label: "Verified Drivers", href: "#" },
    { label: "Route Guidelines", href: "#" },
    { label: "Safety FAQ", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "Contact", href: "#" },
  ],
};

export function LandingFooter() {
  return (
    <footer
      role="contentinfo"
      className="w-full py-16 px-6 lg:px-12"
      style={{ backgroundColor: "var(--color-surface-container-low)", borderTop: "1px solid rgba(193,198,214,0.2)" }}
    >
      <div className="max-w-screen-xl mx-auto">
        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href={ROUTES.HOME} className="flex items-center gap-2.5 mb-4" id="footer-logo">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0">
                <Bus className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold" style={{ color: "var(--color-on-surface)" }}>EgooBus</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs" style={{ color: "var(--color-on-surface-variant)" }}>
              The precision travel network for modern cities. Scheduled luxury at an accessible price.
            </p>
            <div className="flex gap-3">
              {[Globe, Share2].map((Icon, i) => (
                <button
                  key={i}
                  aria-label={i === 0 ? "Language" : "Share"}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-105"
                  style={{
                    backgroundColor: "var(--color-surface-container-highest)",
                    color: "var(--color-on-surface-variant)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-primary)";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-surface-container-highest)";
                    e.currentTarget.style.color = "var(--color-on-surface-variant)";
                  }}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h5
                className="text-label-sm font-bold mb-5"
                style={{ color: "var(--color-primary)" }}
              >
                {category}
              </h5>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm transition-colors duration-150 hover:underline"
                      style={{ color: "var(--color-on-surface-variant)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-primary)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-on-surface-variant)"; }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(193,198,214,0.15)" }}
        >
          <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
            © {new Date().getFullYear()} EgooBus. All rights reserved. Precision Concierge Travel.
          </span>
          <div className="flex gap-6">
            {["ISO 27001 Certified", "GDPR Compliant"].map((badge) => (
              <span key={badge} className="text-label-sm font-bold opacity-60" style={{ color: "var(--color-outline)" }}>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

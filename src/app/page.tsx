import type { Metadata } from "next";

import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PassengersSection } from "@/components/landing/PassengersSection";
import { PaymentsSection } from "@/components/landing/PaymentsSection";
import { DriversSection } from "@/components/landing/DriversSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "EgooBus | Travel with Precision",
  description:
    "EgooBus — Egypt's premium scheduled shuttle network. Guaranteed seats, predefined routes, and luxury at an accessible price. Book your seat today.",
  keywords: [
    "EgooBus",
    "shared shuttle",
    "scheduled bus",
    "Egypt transport",
    "premium commute",
    "book bus seat",
  ],
  openGraph: {
    title: "EgooBus | Travel with Precision",
    description:
      "Guaranteed seats, predefined routes, and luxury at an accessible price.",
    type: "website",
    locale: "en_EG",
  },
};

/**
 * Home Marketing Landing Page
 *
 * Sections (in order):
 *  1. LandingNav      — sticky nav with glass effect
 *  2. HeroSection     — headline + bus image + floating badge
 *  3. FeaturesSection — bento grid (routes, timing, seats, 8+ rule)
 *  4. PassengersSection — commuter benefits
 *  5. PaymentsSection — three payment cards
 *  6. DriversSection  — driver earnings pitch
 *  7. TrustSection    — safety & vetting
 *  8. CtaSection      — final conversion CTA
 *  9. LandingFooter   — links + copyright
 */
export default function HomePage() {
  return (
    <>
      <LandingNav />

      <main id="main-content">
        {/* Skip-to-main-content anchor for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold"
          style={{ backgroundColor: "var(--color-primary)", color: "white" }}
        >
          Skip to main content
        </a>

        <HeroSection />
        <FeaturesSection />
        <PassengersSection />
        <PaymentsSection />
        <DriversSection />
        <TrustSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </>
  );
}

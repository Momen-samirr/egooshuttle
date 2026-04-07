import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";
import { ROUTES } from "@/lib/constants";

export function HeroSection() {
  return (
    <section
      id="hero"
      aria-label="Hero"
      className="relative overflow-hidden min-h-[870px] flex items-center pt-20"
      style={{ backgroundColor: "var(--color-surface-container-low)" }}
    >
      {/* Background blobs */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, #d8e2ff 0%, transparent 70%)" }}
      />

      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-20 w-full grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: copy */}
        <div className="z-10">
          <span className="text-label-sm font-bold tracking-widest mb-4 block" style={{ color: "var(--color-primary)" }}>
            Precision Travel
          </span>

          <h1 className="text-display-lg mb-8 leading-[1.08]" style={{ color: "var(--color-on-surface)" }}>
            Travel with{" "}
            <span
              className="bg-clip-text text-transparent block"
              style={{ backgroundImage: "linear-gradient(135deg, #005bbf 0%, #1a73e8 100%)" }}
            >
              Precision
            </span>
          </h1>

          <p className="text-xl leading-relaxed mb-10 max-w-lg" style={{ color: "var(--color-on-surface-variant)" }}>
            Say goodbye to on-demand unpredictability. EgooBus offers scheduled, luxury shuttle
            routes designed for modern professionals and students.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={ROUTES.SIGN_UP}
              id="hero-book-seat"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-[0_8px_32px_rgba(0,91,191,0.25)]"
              style={{ background: "linear-gradient(135deg, #005bbf 0%, #1a73e8 100%)" }}
            >
              Book Your Seat <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              id="hero-view-routes"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 hover:opacity-80"
              style={{
                backgroundColor: "var(--color-surface-container-lowest)",
                color: "var(--color-primary)",
                boxShadow: "0 0 0 1.5px rgba(193,198,214,0.3)",
              }}
            >
              View Routes
            </a>
          </div>
        </div>

        {/* Right: bus image + floating badge */}
        <div className="relative">
          {/* Decorative blobs */}
          <div
            aria-hidden="true"
            className="absolute -top-12 -left-12 w-64 h-64 rounded-full blur-3xl pointer-events-none"
            style={{ backgroundColor: "rgba(216, 226, 255, 0.5)" }}
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full blur-3xl pointer-events-none"
            style={{ backgroundColor: "rgba(137, 250, 155, 0.3)" }}
          />

          {/* Bus image — slightly rotated */}
          <div className="relative rounded-[2rem] overflow-hidden shadow-[0_32px_80px_rgba(24,28,32,0.2)] rotate-2">
            <Image
              src="/images/hero-bus.png"
              alt="Premium EgooBus shuttle driving on a suburban road at golden hour"
              width={700}
              height={500}
              className="w-full h-[500px] object-cover"
              priority
            />
          </div>

          {/* Floating "Guaranteed Seat" badge */}
          <div
            className="absolute bottom-10 -left-8 p-5 rounded-2xl shadow-xl max-w-xs -rotate-2"
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              backgroundColor: "rgba(255, 255, 255, 0.85)",
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: "var(--color-secondary)" }} />
              <span className="font-bold" style={{ color: "var(--color-on-surface)" }}>
                Guaranteed Seat
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
              Your morning commute is reserved. No standing, no waiting.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

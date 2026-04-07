"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { ROUTES } from "@/lib/constants";

export function ClientQuickActionFab() {
  return (
    <Link
      href={ROUTES.TRIPS}
      className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-2xl transition-all hover:scale-110 active:scale-95 md:bottom-12 md:right-12"
      aria-label="Find a trip"
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </Link>
  );
}

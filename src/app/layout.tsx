import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ConvexClientProvider } from "@/lib/convex-provider";
import { GlobalOnboardingGuard } from "@/components/GlobalOnboardingGuard";
import "./globals.css";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "EgooBus — Shared Trip Booking",
    template: "%s | EgooBus",
  },
  description:
    "Book affordable shared bus trips with EgooBus. Predefined routes, real-time availability, and easy payment.",
  keywords: ["shared trips", "bus booking", "shuttle", "Egypt transport", "EgooBus"],
  authors: [{ name: "EgooBus" }],
  robots: "index, follow",
  openGraph: {
    title: "EgooBus — Shared Trip Booking",
    description: "Book affordable shared bus trips with EgooBus.",
    type: "website",
    locale: "en_EG",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#005bbf",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased bg-[#f7f9ff] text-[#181c20]">
        <ConvexClientProvider>
          <GlobalOnboardingGuard>
            {children}
          </GlobalOnboardingGuard>
        </ConvexClientProvider>
      </body>
    </html>

  );
}

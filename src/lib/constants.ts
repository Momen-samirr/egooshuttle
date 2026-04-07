/**
 * Application-wide constants for EgooBus.
 * No hardcoded data — only configuration values.
 * Design System: Fluid Authority (see egoo_core/DESIGN.md)
 */

// Business Rules
export const TRIP_DRIVER_VISIBILITY_THRESHOLD = 8; // Min passengers before driver can see trip
export const MAX_SEATS_PER_BOOKING = 6;
export const MIN_SEATS_PER_TRIP = 1;

// Route Paths
// NOTE: Auth routes live inside the (auth) route group (Next.js App Router).
// SIGN_UP is the canonical registration page — /register is removed.
export const ROUTES = {
  HOME: "/",
  // Auth
  LOGIN: "/login",
  SIGN_UP: "/sign-up",
  ONBOARDING_PROFILE: "/onboarding/profile",
  ONBOARDING_ROLE: "/onboarding/role",
  ONBOARDING_LOCATION: "/onboarding/location",
  ONBOARDING_DRIVER: "/onboarding/driver",
  // Dashboard (inside (dashboard) route group)



  DASHBOARD: "/dashboard",
  TRIPS: "/trips",
  BOOKINGS: "/bookings",
  WALLET: "/wallet",
  WALLET_INSTAPAY: "/wallet/instapay",
  PROFILE: "/profile",
  // Driver
  DRIVER: "/driver",
  DRIVER_PENDING: "/driver/pending",
  DRIVER_AVAILABLE_TRIPS: "/driver/trips",
  // Admin
  ADMIN: "/admin",
  ADMIN_TRIPS: "/admin/trips",
  ADMIN_BOOKINGS: "/admin/bookings",
  ADMIN_INSTAPAY: "/admin/instapay",
  ADMIN_WALLET: "/admin/wallet",
  ADMIN_DRIVERS: "/admin/drivers",
  ADMIN_USERS: "/admin/users",
  ADMIN_VEHICLES: "/admin/vehicles",
  ADMIN_ANALYTICS: "/admin/analytics",
} as const;

// Payment Methods
export const PAYMENT_METHODS = [
  { label: "Cash", value: "cash", icon: "Banknote" },
  { label: "Card (Coming Soon)", value: "card", icon: "CreditCard", disabled: true },
  { label: "Wallet", value: "wallet", icon: "Wallet" },
] as const;

// Trip Status Labels
export const TRIP_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  available: "Available",
  assigned: "Assigned",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Trip Status Badge CSS classes (Fluid Authority design tokens via globals.css)
// Matches DESIGN.md §5 Status Badges
export const TRIP_STATUS_BADGE_CLASS: Record<string, string> = {
  pending:   "badge-pending",
  available: "badge-ready",
  assigned:  "badge-assigned",
  completed: "badge-ready",
  cancelled: "badge-cancelled",
};

// Booking Status Badge CSS classes
export const BOOKING_STATUS_BADGE_CLASS: Record<string, string> = {
  pending:      "badge-pending",
  under_review: "badge-pending",
  confirmed:    "badge-ready",
  cancelled:    "badge-cancelled",
};


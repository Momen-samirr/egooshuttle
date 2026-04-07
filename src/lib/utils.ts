import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with conflict resolution.
 * Used by all UI components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a price in EGP currency.
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a date string into a human-readable format.
 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

/**
 * Returns initials from a full name (e.g. "Ahmed Ali" => "AA").
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Checks if a trip has enough passengers to become visible to drivers.
 * Business rule: bookedPassengers must be >= 8
 */
export function isTripVisibleToDrivers(bookedPassengers: number): boolean {
  return bookedPassengers >= 8;
}

/**
 * Calculates the fill percentage of a trip.
 */
export function getTripFillPercentage(
  booked: number,
  available: number
): number {
  const total = booked + available;
  if (total === 0) return 0;
  return Math.round((booked / total) * 100);
}

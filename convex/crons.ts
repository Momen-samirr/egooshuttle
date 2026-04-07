import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every 5 minutes to expire stale InstaPay pending bookings.
// If a user hasn't uploaded payment proof within 30 minutes,
// the booking is auto-cancelled and reserved seats are released.
crons.interval(
  "expire stale instapay bookings",
  { minutes: 5 },
  internal.bookingDays.expireStaleInstapayBookings,
  {}
);

export default crons;

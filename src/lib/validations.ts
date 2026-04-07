import { z } from "zod";

// -------
// Auth Validation
// -------
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(11, "Please enter a valid phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["customer", "driver"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// -------
// Booking Validation
// -------
export const createBookingSchema = z.object({
  tripId: z.string().min(1, "Trip ID is required"),
  seatsBooked: z
    .number()
    .min(1, "At least 1 seat required")
    .max(6, "Maximum 6 seats per booking"),
  paymentMethod: z.enum(["cash", "card"]),
});

// -------
// Trip Validation (Admin)
// -------
export const createTripSchema = z.object({
  origin: z.string().min(2, "Origin is required"),
  destination: z.string().min(2, "Destination is required"),
  departureTime: z.string().min(1, "Departure time is required"),
  availableSeats: z.number().min(1).max(50),
  pricePerSeat: z.number().min(1, "Price must be greater than 0"),
});

// TypeScript inferred types from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CreateBookingFormData = z.infer<typeof createBookingSchema>;
export type CreateTripFormData = z.infer<typeof createTripSchema>;

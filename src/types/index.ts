// =====================
// Shared / Global Types
// =====================

export type UserRole = "customer" | "driver" | "admin";

export type PaymentMethod = "cash" | "card";

export type TripStatus = "pending" | "available" | "assigned" | "completed" | "cancelled";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

// -------
// User
// -------
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

// -------
// Trip
// -------
export interface Trip {
  id: string;
  tripCode?: string;
  origin: string;
  destination: string;
  departureTime: string; // Acts as startTime
  endTime?: string;
  availableSeats: number;
  bookedPassengers: number;
  pricePerSeat: number;
  status: TripStatus;
  driverId?: string;
  createdBy?: string; // Admin who created the trip
  vehicleInfo?: VehicleInfo;
  createdAt: string;
}

// -------
// Booking
// -------
export interface Booking {
  id: string;
  tripId: string;
  userId: string;
  seatsBooked: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "paid" | "failed";
  status: BookingStatus;
  totalAmount: number;
  createdAt: string;
}

// -------
// Driver
// -------
export interface Driver {
  id: string;
  userId: string;
  licenseNumber: string;
  isVerified: boolean;
  isAvailable: boolean;
  vehicle?: VehicleInfo;
  rating?: number;
  totalTrips: number;
  createdAt: string;
}

export interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  color: string;
  capacity: number;
}

// -------
// API / Response Helpers
// -------
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

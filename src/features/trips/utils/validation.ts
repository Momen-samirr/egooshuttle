export interface ValidatedTripPayload {
  origin: string;
  destination: string;
  departureTime: string;
  endTime?: string;
  availableSeats: number;
  pricePerSeat: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateTripRow(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.origin || typeof data.origin !== "string" || data.origin.trim() === "") {
    errors.push("Missing or invalid 'origin'.");
  }

  if (!data.destination || typeof data.destination !== "string" || data.destination.trim() === "") {
    errors.push("Missing or invalid 'destination'.");
  }

  if (!data.departureTime || isNaN(Date.parse(data.departureTime))) {
    errors.push("Missing or invalid 'startTime' (must be parseable date string).");
  }

  if (data.endTime && isNaN(Date.parse(data.endTime))) {
    errors.push("Invalid 'endTime' (must be parseable date string).");
  }

  if (data.availableSeats === undefined || isNaN(Number(data.availableSeats)) || Number(data.availableSeats) <= 0) {
    errors.push("Missing or invalid 'availableSeats'. Must be > 0.");
  }

  if (data.pricePerSeat === undefined || isNaN(Number(data.pricePerSeat)) || Number(data.pricePerSeat) < 0) {
    errors.push("Missing or invalid 'pricePerSeat'. Must be >= 0.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

import { CSVParserService } from "./parser.service";
import { validateTripRow, ValidationResult } from "../utils/validation";
import { generateTripCode } from "../domain/trip-code";

export interface ProcessedTripRow {
  data: any;
  isValid: boolean;
  errors: string[];
  tripCode?: string;
}

export class TripService {
  /**
   * Processes a raw CSV string into a list of validated trips with generated trip codes.
   */
  public static processUploadedTrips(csvText: string): ProcessedTripRow[] {
    const rawRows = CSVParserService.parseCSV(csvText);

    return rawRows.map(row => {
      const validation: ValidationResult = validateTripRow(row);
      
      let tripCode;
      if (validation.isValid) {
        // Generate code only for valid rows
        tripCode = generateTripCode(row.origin, row.destination);
      }

      return {
        data: row,
        isValid: validation.isValid,
        errors: validation.errors,
        tripCode,
      };
    });
  }

  /**
   * Prepares valid trips for batch upload to Convex.
   */
  public static extractValidTripsPayload(processedRows: ProcessedTripRow[]) {
    return processedRows
      .filter(row => row.isValid)
      .map(row => ({
        tripCode: row.tripCode as string,
        origin: row.data.origin,
        destination: row.data.destination,
        departureTime: row.data.departureTime,
        endTime: row.data.endTime,
        availableSeats: Number(row.data.availableSeats),
        pricePerSeat: Number(row.data.pricePerSeat),
      }));
  }
}

import { ValidatedTripPayload } from "../utils/validation";

// ---------------------------------------------------------------------------
// Header name mapping: CSV column → normalized field name
// ---------------------------------------------------------------------------
const HEADER_MAP: Record<string, string> = {
  // Standard headers (existing)
  "origin": "origin",
  "destination": "destination",
  "departuretime": "departureTime",
  "endtime": "endTime",
  "availableseats": "availableSeats",
  "priceperseat": "pricePerSeat",
  "tripcode": "tripCode",

  // Egyptian CSV format (new)
  "start": "origin",
  "end": "destination",
  "start time": "departureTime",
  "end time": "endTime",
  "code": "tripCode",
  "price": "pricePerSeat",
  "capacity": "availableSeats",
  "driver": "driver",  // ignored downstream
};


const DEFAULT_SEATS = 14;

export class CSVParserService {
  /**
   * Normalizes a header string for lookup in HEADER_MAP.
   */
  private static normalizeHeader(h: string): string {
    return h.trim().toLowerCase();
  }

  /**
   * Strips known suffixes from trip codes (e.g., "#Generalised").
   */
  private static cleanTripCode(raw: string): string {
    return raw.replace(/#.*$/, "").trim();
  }

  /**
   * Converts a bare HH:mm:ss time to today's ISO string.
   */
  private static timeToISO(time: string): string {
    const trimmed = time.trim();
    // Already an ISO string (contains T or -)
    if (trimmed.includes("T") || trimmed.includes("-")) return trimmed;
    // Bare time → attach today's date
    const today = new Date().toISOString().split("T")[0];
    return `${today}T${trimmed}`;
  }

  /**
   * Helper to parse a specific string format:
   * "Smart Village -> Maadi - Start: 16:10:00 End: 18:30:23"
   */
  public static parseHumanReadableFormat(line: string): Partial<ValidatedTripPayload> | null {
    const regex = /^(.*?)\s*->\s*(.*?)\s*-\s*Start:\s*(.*?)(?:\s*End:\s*(.*))?$/i;
    const match = line.match(regex);
    if (!match) return null;

    const [, origin, destination, startTime, endTime] = match;
    const today = new Date().toISOString().split("T")[0];

    return {
      origin: origin.trim(),
      destination: destination.trim(),
      departureTime: `${today}T${startTime.trim()}`,
      endTime: endTime ? `${today}T${endTime.trim()}` : undefined,
    };
  }

  /**
   * Parses standard CSV (with headers) with flexible column name mapping.
   * Supports both the original EgooBus format and the Egyptian trips CSV.
   */
  public static parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length === 0) return [];

    const results: any[] = [];

    // Check if it's standard CSV by checking commas
    if (lines[0].includes(",")) {
      const rawHeaders = lines[0].split(",").map((h) => h.trim());

      // Map raw headers to normalized field names
      const fieldNames = rawHeaders.map((h) => {
        const normalized = this.normalizeHeader(h);
        return HEADER_MAP[normalized] ?? h;
      });

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = line.split(",");
        const obj: any = {};
        fieldNames.forEach((field, index) => {
          const val = values[index]?.trim();
          if (!val) return;
          obj[field] = val;
        });

        // --- Post-processing ---

        // Clean trip code
        if (obj.tripCode) {
          obj.tripCode = this.cleanTripCode(obj.tripCode);
        }

        // Convert bare times to ISO
        if (obj.departureTime) {
          obj.departureTime = this.timeToISO(obj.departureTime);
        }
        if (obj.endTime) {
          obj.endTime = this.timeToISO(obj.endTime);
        }

        // Default capacity if missing
        if (!obj.availableSeats) {
          obj.availableSeats = DEFAULT_SEATS;
        }

        // Ensure pricePerSeat is a number
        if (obj.pricePerSeat) {
          obj.pricePerSeat = Number(obj.pricePerSeat);
        }

        // Remove ignored fields
        delete obj.driver;

        results.push(obj);
      }
    } else {
      // Treat as line-by-line human readable format
      for (const line of lines) {
        if (!line.trim()) continue;
        const parsed = this.parseHumanReadableFormat(line);
        if (parsed) {
          results.push({
            ...parsed,
            availableSeats: DEFAULT_SEATS,
            pricePerSeat: 10,
          });
        }
      }
    }

    return results;
  }
}

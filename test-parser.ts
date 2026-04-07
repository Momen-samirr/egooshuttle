import { CSVParserService } from "./src/features/trips/services/parser.service";
import { TripService } from "./src/features/trips/services/trip.service";
import { SearchService } from "./src/features/trips/services/search.service";

const csv1 = `origin,destination,departureTime,availableSeats,pricePerSeat
October,Heliopolis,2026-10-15T05:25:00Z,14,25
Maadi,Nasr City,2026-10-16T10:00:00Z,10,30`;

const csv2 = `Smart Village -> Maadi - Start: 16:10:00 End: 18:30:23
October -> Heliopolis - Start: 05:25:00`;

console.log("=== CSV 1 -> Standard ===");
const res1 = TripService.processUploadedTrips(csv1);
console.log(JSON.stringify(TripService.extractValidTripsPayload(res1), null, 2));

console.log("\n=== CSV 2 -> Human String ===");
const res2 = TripService.processUploadedTrips(csv2);
console.log(JSON.stringify(TripService.extractValidTripsPayload(res2), null, 2));

console.log("\n=== Search Logic ===");
console.log(SearchService.buildConvexQueryParams({ origin: " Oct", destination: "Helio "}));
console.log("Duration:", SearchService.formatTripDuration("2026-10-15T05:25:00Z", "2026-10-15T07:21:00Z"));

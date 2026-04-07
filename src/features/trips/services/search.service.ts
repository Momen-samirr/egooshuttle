export interface SearchTripFilters {
  origin?: string;
  destination?: string;
  date?: string; 
}

export class SearchService {
  /**
   * Transforms raw UI filter input into exact types for Convex.
   */
  public static buildConvexQueryParams(filters: SearchTripFilters) {
    return {
      origin: filters.origin?.trim() || undefined,
      destination: filters.destination?.trim() || undefined,
      date: filters.date?.trim() || undefined,
    };
  }

  /**
   * Formats the time display for client dashboard
   */
  public static formatTripDuration(startTime: string, endTime?: string): string {
    const startObj = new Date(startTime);
    const startStr = isNaN(startObj.getTime()) ? startTime : startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!endTime) return startStr;

    const endObj = new Date(endTime);
    const endStr = isNaN(endObj.getTime()) ? endTime : endObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `${startStr} - ${endStr}`;
  }
}

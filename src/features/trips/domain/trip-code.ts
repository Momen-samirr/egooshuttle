/**
 * Normalizes a string by converting it to TitleCase and removing spaces and special characters.
 * Useful for building predictable, readable codes.
 */
function normalizeString(str: string): string {
  if (!str) return "";
  
  // Split by spaces or special characters
  const words = str.split(/[\s,_\-]+/);
  
  return words
    .map(word => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
}

/**
 * Generates a unique trip code based on origin, destination, and an optional seed/hash.
 * Format: {Origin}_{Destination}_{Hash}
 * Example: October_Heliopolis_5011
 */
export function generateTripCode(origin: string, destination: string, uniqueId?: string): string {
  const normOrigin = normalizeString(origin);
  const normDestination = normalizeString(destination);
  
  // If no uniqueId is provided, generate a random 4-char string
  let hash = uniqueId;
  if (!hash) {
    hash = Math.random().toString(36).substring(2, 6).toUpperCase();
  } else {
    // If a UUID is provided, take the last 4 character segment
    hash = hash.split("-").pop()?.substring(0, 4).toUpperCase();
  }

  // Fallback if formatting failed
  if (!hash || hash.length === 0) {
    hash = Math.floor(1000 + Math.random() * 9000).toString();
  }

  return `${normOrigin}_${normDestination}_${hash}`;
}

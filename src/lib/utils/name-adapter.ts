/**
 * Player Name Adapter
 *
 * Adapter design pattern implementation for extracting first names from full names.
 * Splits names at spaces and returns only the first name part.
 *
 * Example: "John Smith" → "John", "Mary Jane Watson" → "Mary"
 */
class PlayerNameAdapter {
  /**
   * Extract the first name from a full name by splitting at spaces
   * @param fullName - The full name to extract first name from
   * @returns The first name, or the original string if no spaces found
   */
  adaptToFirstName(fullName: string): string {
    if (!fullName || typeof fullName !== "string") {
      return fullName || "";
    }

    const trimmed = fullName.trim();
    if (!trimmed) {
      return "";
    }

    // Split by spaces and take the first part
    const parts = trimmed.split(/\s+/);
    return parts[0] || trimmed;
  }

  /**
   * Adapt a combined player names string (e.g., "John & Mary") to first names only
   * @param combinedNames - The combined names string
   * @returns The adapted string with first names only
   */
  adaptCombinedNames(combinedNames: string): string {
    if (!combinedNames || typeof combinedNames !== "string") {
      return combinedNames || "";
    }

    // Split by "&" or "and" (case-insensitive), adapt each part, then rejoin
    const parts = combinedNames.split(/\s*(?:&|and)\s*/i);
    const firstNames = parts.map((part) => this.adaptToFirstName(part));
    return firstNames.join(" & ");
  }
}

// Singleton instance
const playerNameAdapter = new PlayerNameAdapter();

/**
 * Adapt player name to first name only
 *
 * Adapter function that extracts the first name from a full name by splitting at spaces.
 *
 * @param fullName - The full player name (e.g., "John Smith")
 * @returns The first name only (e.g., "John")
 *
 * @example
 * ```ts
 * const firstName = adaptPlayerNameToFirstName("John Smith"); // Returns "John"
 * const firstName = adaptPlayerNameToFirstName("Mary Jane Watson"); // Returns "Mary"
 * ```
 */
export function adaptPlayerNameToFirstName(fullName: string): string {
  return playerNameAdapter.adaptToFirstName(fullName);
}

/**
 * Adapt combined player names to first names only
 *
 * Adapter function that converts a combined names string to use only first names.
 * Handles both "&" and "and" as separators (case-insensitive).
 *
 * @param combinedNames - The combined player names (e.g., "John Smith & Mary Johnson")
 * @returns The adapted combined names using first names only (e.g., "John & Mary")
 *
 * @example
 * ```ts
 * const adapted = adaptCombinedNamesToFirstNames("John Smith & Mary Johnson"); // Returns "John & Mary"
 * ```
 */
export function adaptCombinedNamesToFirstNames(combinedNames: string): string {
  return playerNameAdapter.adaptCombinedNames(combinedNames);
}

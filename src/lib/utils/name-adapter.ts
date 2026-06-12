/**
 * Player name helpers — extract first names for display.
 */

/**
 * Extract the first name from a full name by splitting at whitespace.
 *
 * @example adaptPlayerNameToFirstName("John Smith") // "John"
 * @example adaptPlayerNameToFirstName("Mary Jane Watson") // "Mary"
 */
export function adaptPlayerNameToFirstName(fullName: string): string {
  if (!fullName || typeof fullName !== "string") {
    return fullName || "";
  }

  const trimmed = fullName.trim();
  if (!trimmed) return "";

  const parts = trimmed.split(/\s+/);
  return parts[0] || trimmed;
}

/**
 * Convert a combined player-names string to first names only. Splits on " & "
 * or the standalone word "and" (the "and" branch requires surrounding
 * whitespace so names like "Brandon" or "Sandy" aren't split on their internal
 * letters; "&" may be tightly packed, e.g. "John&Mary").
 *
 * @example adaptCombinedNamesToFirstNames("John Smith & Mary Johnson") // "John & Mary"
 */
export function adaptCombinedNamesToFirstNames(combinedNames: string): string {
  if (!combinedNames || typeof combinedNames !== "string") {
    return combinedNames || "";
  }

  const parts = combinedNames.split(/\s+and\s+|\s*&\s*/i);
  return parts.map((part) => adaptPlayerNameToFirstName(part)).join(" & ");
}

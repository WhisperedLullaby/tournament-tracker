import { db } from "../db/index";
import { tournaments } from "../db/schema";
import { eq, ne, and } from "drizzle-orm";

/**
 * Month names for slug generation
 */
const MONTH_NAMES = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

/**
 * Generate a slug from tournament name and date
 * Format: {name}-{month}-{year}
 * Example: "Two Peas in a Pod" + December 2025 → "two-peas-in-a-pod-dec-2025"
 *
 * @param name - The tournament name
 * @param date - The tournament date
 * @returns The generated slug (not guaranteed to be unique)
 */
export function generateSlug(name: string, date: Date): string {
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  // Sanitize name: lowercase, remove special chars, replace spaces with hyphens
  const baseName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

  return `${baseName}-${month}-${year}`;
}

/**
 * Ensure slug is unique by checking database and appending number if needed
 * If slug exists, appends -2, -3, etc.
 * Example: "two-peas-dec-2025" → "two-peas-dec-2025-2"
 *
 * @param baseSlug - The base slug to check
 * @param tournamentId - Optional tournament ID to exclude from check (for updates)
 * @returns A unique slug
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  tournamentId?: number
): Promise<string> {
  try {
    let slug = baseSlug;
    let counter = 2;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Check if slug exists
      const conditions = [eq(tournaments.slug, slug)];

      // If updating existing tournament, exclude it from check
      if (tournamentId) {
        conditions.push(ne(tournaments.id, tournamentId));
      }

      const existing = await db
        .select({ id: tournaments.id })
        .from(tournaments)
        .where(conditions.length > 1 ? and(...conditions) : conditions[0])
        .limit(1);

      if (existing.length === 0) {
        // Slug is unique!
        return slug;
      }

      // Slug exists, try with counter
      slug = `${baseSlug}-${counter}`;
      counter++;

      // Safety check to prevent infinite loop
      if (counter > 100) {
        throw new Error("Could not generate unique slug after 100 attempts");
      }
    }
  } catch (error) {
    console.error("Error ensuring unique slug:", error);
    throw error;
  }
}

/**
 * Generate a unique slug from tournament name and date
 * Combines generateSlug and ensureUniqueSlug
 *
 * @param name - The tournament name
 * @param date - The tournament date
 * @param tournamentId - Optional tournament ID to exclude from check (for updates)
 * @returns A unique slug
 */
export async function generateUniqueSlug(
  name: string,
  date: Date,
  tournamentId?: number
): Promise<string> {
  const baseSlug = generateSlug(name, date);
  return await ensureUniqueSlug(baseSlug, tournamentId);
}

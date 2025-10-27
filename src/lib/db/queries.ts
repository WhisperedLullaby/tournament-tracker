import { db } from "./index";
import { pods } from "./schema";
import { count } from "drizzle-orm";

/**
 * Get the total number of registered pods
 */
export async function getPodCount(): Promise<number> {
  try {
    const result = await db.select({ count: count() }).from(pods);
    return result[0]?.count || 0;
  } catch (error) {
    console.error("Error fetching pod count:", error);
    return 0;
  }
}

/**
 * Check if registration is open (less than 9 pods)
 */
export async function isRegistrationOpen(): Promise<boolean> {
  const podCount = await getPodCount();
  return podCount < 9;
}

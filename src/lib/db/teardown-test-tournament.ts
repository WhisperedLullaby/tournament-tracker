/**
 * Delete a test tournament and all its data (CASCADE).
 *
 * Usage:
 *   npm run test:teardown -- --slug=test-202603191045
 */

/* eslint-disable no-console */

import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./index";
import { tournaments } from "./schema";
import { eq } from "drizzle-orm";

const args = process.argv.slice(2);
const slugArg = args.find((a) => a.startsWith("--slug="));
const SLUG = slugArg ? slugArg.split("=")[1] : null;

async function teardown() {
  if (!SLUG) {
    console.error("❌ Missing --slug argument.");
    console.error("   Usage: npm run test:teardown -- --slug=test-202603191045");
    process.exit(1);
  }

  // Safety: only allow deleting slugs that start with "test-"
  if (!SLUG.startsWith("test-")) {
    console.error(`❌ Refusing to delete "${SLUG}" — slug must start with "test-" to use this script.`);
    process.exit(1);
  }

  console.log(`🗑️  Deleting tournament with slug: ${SLUG}`);

  const [deleted] = await db
    .delete(tournaments)
    .where(eq(tournaments.slug, SLUG))
    .returning({ id: tournaments.id, name: tournaments.name });

  if (!deleted) {
    console.error(`❌ No tournament found with slug "${SLUG}"`);
    process.exit(1);
  }

  console.log(`✅ Deleted "${deleted.name}" (ID ${deleted.id}) and all associated data.`);
  process.exit(0);
}

teardown().catch((err) => {
  console.error("❌ Teardown failed:", err);
  process.exit(1);
});

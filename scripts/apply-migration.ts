import { db } from "../src/lib/db/index";
import { sql } from "drizzle-orm";

async function applyMigration() {
  try {
    console.log("Adding email column to pods table...");

    await db.execute(
      sql`ALTER TABLE "pods" ADD COLUMN "email" text NOT NULL DEFAULT ''`
    );

    console.log("Adding unique constraint to email column...");
    await db.execute(
      sql`ALTER TABLE "pods" ADD CONSTRAINT "pods_email_unique" UNIQUE("email")`
    );

    console.log("✓ Migration applied successfully!");
  } catch (error) {
    console.error("Error applying migration:", error);
    process.exit(1);
  }
  process.exit(0);
}

applyMigration();

import { db } from "../src/lib/db/index";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Applying pickup_sessions payment_info migration...");

  await db.execute(
    sql`ALTER TABLE pickup_sessions ADD COLUMN IF NOT EXISTS payment_info JSONB`
  );
  console.log("  + payment_info");

  console.log("Done.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

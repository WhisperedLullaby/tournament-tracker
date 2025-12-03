/**
 * Check what tables exist in the database
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./index";
import { sql } from "drizzle-orm";

async function checkDatabase() {
  console.log("🔍 Checking database schema...\n");

  try {
    const tables = await db.execute(sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log("📊 Tables in database:");
    tables.forEach((table) => {
      console.log(`  - ${table.tablename}`);
    });
    console.log();

    // Check if tournaments table exists
    const tournamentsExists = tables.some(
      (t) => t.tablename === "tournaments"
    );

    if (tournamentsExists) {
      console.log("✅ tournaments table exists");

      // Check columns
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'tournaments'
        ORDER BY ordinal_position;
      `);

      console.log("\n📋 Tournaments table columns:");
      columns.forEach((col) => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log("❌ tournaments table does NOT exist");
      console.log("\n💡 You need to create the base tables first.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkDatabase();

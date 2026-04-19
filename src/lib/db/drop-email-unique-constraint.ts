import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    await sql`ALTER TABLE pods DROP CONSTRAINT IF EXISTS pods_email_unique`;
    console.log("✓ Dropped pods_email_unique constraint");
  } finally {
    await sql.end();
  }
}

main().catch(console.error);

import { config } from "dotenv";
import { readFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

config({ path: ".env.local" });

const STATE_FILE = join(__dirname, ".test-state.json");

export default async function globalTeardown() {
  if (!existsSync(STATE_FILE)) return;

  const { id, slug } = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    await sql`DELETE FROM tournaments WHERE id = ${id}`;
    console.log(`\n✓ Test tournament deleted: ${slug} (id: ${id})`);
  } finally {
    await sql.end();
    unlinkSync(STATE_FILE);
  }
}

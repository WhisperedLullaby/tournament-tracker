/**
 * Seeds fake pods for a tournament to fill remaining spots.
 * Usage: npx tsx --env-file=.env.local src/lib/db/seed-fake-pods.ts <slug>
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: npx tsx --env-file=.env.local src/lib/db/seed-fake-pods.ts <slug>");
  process.exit(1);
}

const FAKE_TEAMS = [
  ["Alex Smith", "Jordan Lee"],
  ["Morgan Chen", "Casey Park"],
  ["Riley Johnson", "Taylor Brown"],
  ["Sam Williams", "Drew Davis"],
  ["Jamie Wilson", "Quinn Martinez"],
  ["Avery Thompson", "Skyler Anderson"],
  ["Blake Robinson", "Cameron White"],
  ["Dakota Harris", "Reese Jackson"],
  ["Finley Thomas", "Harlow Moore"],
  ["Lennon Walker", "Remy Hall"],
  ["Sage Allen", "River Young"],
  ["Rowan King", "Phoenix Scott"],
];

async function main() {
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    const [tournament] = await sql`
      SELECT id, max_pods FROM tournaments WHERE slug = ${slug}
    `;

    if (!tournament) {
      console.error(`Tournament "${slug}" not found`);
      process.exit(1);
    }

    const existing = await sql`
      SELECT COUNT(*)::int AS count FROM pods WHERE tournament_id = ${tournament.id}
    `;
    const currentCount = existing[0].count;
    const spotsLeft = tournament.max_pods - currentCount;

    if (spotsLeft <= 0) {
      console.log(`Tournament is already full (${currentCount}/${tournament.max_pods} pods)`);
      process.exit(0);
    }

    const toInsert = FAKE_TEAMS.slice(0, spotsLeft);
    console.log(`Filling ${toInsert.length} remaining spot(s) (${currentCount}/${tournament.max_pods} already registered)`);

    for (let i = 0; i < toInsert.length; i++) {
      const [p1, p2] = toInsert[i];
      const fakeEmail = `fake-pod-${tournament.id}-${currentCount + i + 1}@test.invalid`;
      await sql`
        INSERT INTO pods (tournament_id, email, name, player1, player2)
        VALUES (
          ${tournament.id},
          ${fakeEmail},
          ${`${p1} & ${p2}`},
          ${p1},
          ${p2}
        )
      `;
      console.log(`  ✓ ${p1} & ${p2}`);
    }

    console.log(`\nDone! Tournament now has ${tournament.max_pods}/${tournament.max_pods} pods.`);
  } finally {
    await sql.end();
  }
}

main().catch(console.error);

import { config } from "dotenv";
import { writeFileSync } from "fs";
import { join } from "path";

config({ path: ".env.local" });

const STATE_FILE = join(__dirname, ".test-state.json");

// Fixed predictable values so display tests can assert exact text
export const TEST_TOURNAMENT_DATA = {
  name: "Playwright Test Tournament",
  date: "2030-06-15",           // displays as "June 15, 2030"
  registrationOpenDate: "2030-05-01",  // displays as "May 1, 2030"
  registrationDeadline: "2030-06-14", // displays as "June 14, 2030"
  startTime: "10:00",           // displays as "10:00 AM"
  estimatedEndTime: "15:00",    // displays as "3:00 PM"
  location: "123 Test Ave, Pittsburgh, PA 15201",
  prizeInfo: "Winners receive bragging rights and a high five.",
};

export default async function globalSetup() {
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL!);

  const slug = `test-tournament-${Date.now()}`;
  const now = new Date();
  const d = TEST_TOURNAMENT_DATA;

  try {
    const [tournament] = await sql`
      INSERT INTO tournaments (
        name,
        slug,
        date,
        location,
        status,
        tournament_type,
        bracket_style,
        level,
        max_pods,
        max_teams,
        scoring_rules,
        prize_info,
        start_time,
        estimated_end_time,
        registration_open_date,
        registration_deadline,
        is_public,
        is_test,
        require_auth,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        ${d.name},
        ${slug},
        ${new Date(d.date + "T12:00:00Z")},
        ${d.location},
        'upcoming',
        'pod_2',
        'single_elimination',
        'open',
        9,
        9,
        ${JSON.stringify({ startPoints: 0, endPoints: 21, winByTwo: true })}::jsonb,
        ${d.prizeInfo},
        ${d.startTime},
        ${d.estimatedEndTime},
        ${new Date(d.registrationOpenDate + "T12:00:00Z")},
        ${new Date(d.registrationDeadline + "T12:00:00Z")},
        true,
        false,
        false,
        'playwright-test-runner',
        ${now},
        ${now}
      )
      RETURNING id, slug
    `;

    writeFileSync(
      STATE_FILE,
      JSON.stringify({ id: tournament.id, slug: tournament.slug, ...d })
    );

    console.log(`\n✓ Test tournament created: ${tournament.slug} (id: ${tournament.id})`);
  } finally {
    await sql.end();
  }
}

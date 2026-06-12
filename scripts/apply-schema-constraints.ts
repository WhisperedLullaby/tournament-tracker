/**
 * PR 4 — Indexes + unique constraints.
 *
 * Adds the indexes and unique constraints declared in src/lib/db/schema.ts to
 * the live database (db:push is unreliable on this schema, so we apply raw SQL).
 *
 * The unique constraint on pool_standings (tournament_id, pod_id) is required by
 * the upsert in updatePoolStandings (INSERT ... ON CONFLICT). The constraint on
 * bracket_matches (tournament_id, game_number) protects the bracket from
 * silent corruption via setSlot.
 *
 * Inspect-first: reports duplicate rows before adding any unique constraint,
 * de-dupes the safe derived tables automatically, and refuses to touch
 * bracket_matches if it has duplicates (that would indicate real corruption
 * needing manual review). Idempotent — safe to re-run.
 *
 *   npx tsx --env-file=.env.local scripts/apply-schema-constraints.ts
 */
import { db } from "../src/lib/db/index";
import { sql } from "drizzle-orm";

async function countDuplicates(
  table: string,
  cols: string[]
): Promise<number> {
  const colList = cols.join(", ");
  const rows = (await db.execute(
    sql.raw(`
      SELECT COALESCE(SUM(c - 1), 0)::int AS extra
      FROM (
        SELECT COUNT(*) AS c
        FROM public."${table}"
        GROUP BY ${colList}
        HAVING COUNT(*) > 1
      ) d`)
  )) as unknown as { extra: number }[];
  return rows[0]?.extra ?? 0;
}

/** Delete duplicate rows, keeping the lowest id per key group. */
async function dedupeKeepLowest(table: string, cols: string[]) {
  const on = cols.map((c) => `a.${c} = b.${c}`).join(" AND ");
  await db.execute(
    sql.raw(
      `DELETE FROM public."${table}" a USING public."${table}" b WHERE a.id > b.id AND ${on}`
    )
  );
}

async function addConstraintIfMissing(
  table: string,
  name: string,
  cols: string[]
) {
  const colList = cols.join(", ");
  await db.execute(
    sql.raw(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN
          ALTER TABLE public."${table}" ADD CONSTRAINT "${name}" UNIQUE (${colList});
        END IF;
      END $$;`)
  );
}

async function run() {
  console.log("=== PR4: indexes + unique constraints ===");

  // --- Unique constraints (de-dupe first) ---
  // Safe-to-dedupe derived tables.
  for (const { table, name, cols } of [
    {
      table: "pool_standings",
      name: "pool_standings_tournament_pod_unique",
      cols: ["tournament_id", "pod_id"],
    },
    {
      table: "tournament_roles",
      name: "tournament_roles_tournament_user_role_unique",
      cols: ["tournament_id", "user_id", "role"],
    },
  ]) {
    const dups = await countDuplicates(table, cols);
    if (dups > 0) {
      console.log(`  ${table}: ${dups} duplicate row(s) — de-duping (keep lowest id)`);
      await dedupeKeepLowest(table, cols);
    }
    await addConstraintIfMissing(table, name, cols);
    console.log(`  + unique ${name}`);
  }

  // bracket_matches: do NOT auto-delete match rows. Abort that one constraint if
  // duplicates exist so they can be reviewed manually.
  const bmDups = await countDuplicates("bracket_matches", [
    "tournament_id",
    "game_number",
  ]);
  if (bmDups > 0) {
    console.warn(
      `  ! bracket_matches has ${bmDups} duplicate (tournament_id, game_number) row(s); ` +
        `skipping its unique constraint. Resolve manually, then re-run.`
    );
  } else {
    await addConstraintIfMissing(
      "bracket_matches",
      "bracket_matches_tournament_game_unique",
      ["tournament_id", "game_number"]
    );
    console.log("  + unique bracket_matches_tournament_game_unique");
  }

  // --- Indexes (idempotent) ---
  const indexes: [string, string, string][] = [
    ["pods_tournament_id_idx", "pods", "tournament_id"],
    ["pool_matches_tournament_status_idx", "pool_matches", "tournament_id, status"],
    ["tournament_roles_user_id_idx", "tournament_roles", "user_id"],
    ["pickup_registrations_session_status_idx", "pickup_registrations", "session_id, status"],
    ["pickup_series_session_id_idx", "pickup_series", "session_id"],
    ["pickup_games_series_id_idx", "pickup_games", "series_id"],
  ];
  for (const [name, table, cols] of indexes) {
    await db.execute(
      sql.raw(`CREATE INDEX IF NOT EXISTS "${name}" ON public."${table}" (${cols})`)
    );
    console.log(`  + index ${name}`);
  }

  console.log("Done.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Schema constraints migration failed:", err);
  process.exit(1);
});

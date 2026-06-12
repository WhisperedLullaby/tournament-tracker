/**
 * PR 1 — Database lockdown (RLS + grants).
 *
 * Closes a critical hole: RLS was disabled on 12/13 tables and the `anon` role
 * held full write privileges, so anyone with the public anon key (shipped in the
 * browser bundle) could read all PII and write/delete any row via PostgREST —
 * including granting themselves admin in `organizer_whitelist`.
 *
 * Server-side code uses Drizzle over DATABASE_URL (the `postgres` role), which
 * BYPASSES RLS and keeps full privileges, so this migration does not affect any
 * server-rendered page or API route. Only the browser's anon/authenticated
 * PostgREST + Realtime path is constrained.
 *
 * The browser only ever READS via Supabase (verified: zero insert/update/delete
 * calls). Read targets: pool_matches, bracket_matches, bracket_teams, pods
 * (PostgREST) and pickup_games, pickup_series (Realtime). Those get public
 * SELECT policies; everything else is deny-all through the API.
 *
 * Idempotent — safe to re-run.
 *
 *   npx tsx --env-file=.env.local scripts/apply-rls-lockdown.ts
 */
import { db } from "../src/lib/db/index";
import { sql } from "drizzle-orm";

const ALL_TABLES = [
  "tournaments",
  "pods",
  "pool_matches",
  "pool_standings",
  "bracket_teams",
  "bracket_matches",
  "tournament_roles",
  "organizer_whitelist",
  "pickup_sessions",
  "pickup_registrations",
  "pickup_series",
  "pickup_games",
  "pickup_player_stats",
];

// Tables the browser reads via PostgREST or subscribes to via Realtime.
// These get a public SELECT policy + SELECT grant. Everything else is API-denied.
const READ_TABLES = [
  "pool_matches",
  "bracket_matches",
  "bracket_teams",
  "pods",
  "pickup_games",
  "pickup_series",
];

// Columns on `pods` that must never be exposed to the anon/authenticated API
// roles. `pods` gets a column-level SELECT grant excluding these.
const PODS_HIDDEN_COLUMNS = ["email", "user_id"];

const API_ROLES = "anon, authenticated";

async function inspect(label: string) {
  const rls = (await db.execute(sql`
    SELECT c.relname AS table, c.relrowsecurity AS rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'`)) as unknown as {
    table: string;
    rls: boolean;
  }[];
  const writeGrants = (await db.execute(sql`
    SELECT count(*)::int AS n
    FROM information_schema.table_privileges
    WHERE table_schema = 'public'
      AND grantee IN ('anon', 'authenticated')
      AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')`)) as unknown as {
    n: number;
  }[];
  const enabled = rls.filter((r) => ALL_TABLES.includes(r.table) && r.rls).length;
  console.log(
    `[${label}] RLS enabled: ${enabled}/${ALL_TABLES.length} tables | ` +
      `anon/authenticated write grants remaining: ${writeGrants[0].n}`
  );
}

async function run() {
  console.log("=== PR1: RLS + grants lockdown ===");
  await inspect("before");

  // 1. Enable RLS on every table.
  for (const t of ALL_TABLES) {
    await db.execute(sql.raw(`ALTER TABLE public."${t}" ENABLE ROW LEVEL SECURITY`));
  }
  console.log(`  + RLS enabled on ${ALL_TABLES.length} tables`);

  // 2. Clean slate: revoke ALL privileges from the API roles on every table.
  //    (Server-side `postgres` role and `service_role` are untouched.)
  for (const t of ALL_TABLES) {
    await db.execute(sql.raw(`REVOKE ALL ON public."${t}" FROM ${API_ROLES}`));
  }
  console.log(`  + Revoked all anon/authenticated privileges on ${ALL_TABLES.length} tables`);

  // 3. Grant SELECT + add a public read policy only on browser-read tables.
  for (const t of READ_TABLES) {
    await db.execute(sql.raw(`DROP POLICY IF EXISTS "public_read" ON public."${t}"`));
    await db.execute(
      sql.raw(
        `CREATE POLICY "public_read" ON public."${t}" FOR SELECT TO ${API_ROLES} USING (true)`
      )
    );

    if (t === "pods") {
      // Column-level grant: every column EXCEPT the sensitive ones. A table-level
      // SELECT grant would override column restrictions, so we never issue one here.
      const colRows = (await db.execute(sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'pods'
        ORDER BY ordinal_position`)) as unknown as { column_name: string }[];
      const granted = colRows
        .map((r) => r.column_name)
        .filter((c) => !PODS_HIDDEN_COLUMNS.includes(c));
      const colList = granted.map((c) => `"${c}"`).join(", ");
      await db.execute(
        sql.raw(`GRANT SELECT (${colList}) ON public."pods" TO ${API_ROLES}`)
      );
      console.log(
        `  + pods: public read policy + column SELECT on [${granted.join(", ")}] ` +
          `(hidden: ${PODS_HIDDEN_COLUMNS.join(", ")})`
      );
    } else {
      await db.execute(sql.raw(`GRANT SELECT ON public."${t}" TO ${API_ROLES}`));
      console.log(`  + ${t}: public read policy + SELECT grant`);
    }
  }

  // 4. Drop the redundant legacy policy on pool_matches (superseded by public_read).
  await db.execute(
    sql.raw(`DROP POLICY IF EXISTS "Allow public read access" ON public."pool_matches"`)
  );

  await inspect("after");
  console.log("Done.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Lockdown migration failed:", err);
  process.exit(1);
});

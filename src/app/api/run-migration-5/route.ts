import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { createClient } from "@/lib/auth/server";

export async function GET() {
  try {
    // Optional: Check if user is authenticated (you can remove this if you want)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const results = [];

    // 1. Update pods foreign key
    await db.execute(sql`
      ALTER TABLE pods
      DROP CONSTRAINT IF EXISTS pods_tournament_id_fkey;
    `);
    await db.execute(sql`
      ALTER TABLE pods
      ADD CONSTRAINT pods_tournament_id_fkey
      FOREIGN KEY (tournament_id)
      REFERENCES tournaments(id)
      ON DELETE CASCADE;
    `);
    results.push("✓ pods.tournament_id updated");

    // 2. Update pool_matches foreign key
    await db.execute(sql`
      ALTER TABLE pool_matches
      DROP CONSTRAINT IF EXISTS pool_matches_tournament_id_fkey;
    `);
    await db.execute(sql`
      ALTER TABLE pool_matches
      ADD CONSTRAINT pool_matches_tournament_id_fkey
      FOREIGN KEY (tournament_id)
      REFERENCES tournaments(id)
      ON DELETE CASCADE;
    `);
    results.push("✓ pool_matches.tournament_id updated");

    // 3. Update pool_standings foreign key
    await db.execute(sql`
      ALTER TABLE pool_standings
      DROP CONSTRAINT IF EXISTS pool_standings_tournament_id_fkey;
    `);
    await db.execute(sql`
      ALTER TABLE pool_standings
      ADD CONSTRAINT pool_standings_tournament_id_fkey
      FOREIGN KEY (tournament_id)
      REFERENCES tournaments(id)
      ON DELETE CASCADE;
    `);
    results.push("✓ pool_standings.tournament_id updated");

    // 4. Update bracket_teams foreign key
    await db.execute(sql`
      ALTER TABLE bracket_teams
      DROP CONSTRAINT IF EXISTS bracket_teams_tournament_id_fkey;
    `);
    await db.execute(sql`
      ALTER TABLE bracket_teams
      ADD CONSTRAINT bracket_teams_tournament_id_fkey
      FOREIGN KEY (tournament_id)
      REFERENCES tournaments(id)
      ON DELETE CASCADE;
    `);
    results.push("✓ bracket_teams.tournament_id updated");

    // 5. Update bracket_matches foreign key
    await db.execute(sql`
      ALTER TABLE bracket_matches
      DROP CONSTRAINT IF EXISTS bracket_matches_tournament_id_fkey;
    `);
    await db.execute(sql`
      ALTER TABLE bracket_matches
      ADD CONSTRAINT bracket_matches_tournament_id_fkey
      FOREIGN KEY (tournament_id)
      REFERENCES tournaments(id)
      ON DELETE CASCADE;
    `);
    results.push("✓ bracket_matches.tournament_id updated");

    return NextResponse.json({
      success: true,
      message: "Migration Phase 5 completed successfully!",
      results,
      summary: {
        updated: 5,
        note: "Deleting a tournament will now automatically delete all related records (pods, matches, standings, etc.)",
      },
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

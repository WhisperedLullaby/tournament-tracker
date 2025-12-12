/**
 * Phase 2: Tournament Types Migration
 * Run with: npx tsx --env-file=.env.local src/lib/db/phase2-tournament-types-migration.ts
 *
 * This script:
 * - Creates tournament_type, tournament_bracket_style, and tournament_level enums
 * - Adds new configuration columns to tournaments table
 * - Updates pods table to support 3-player pods and set teams
 * - Populates existing tournament with dynamic content
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { sql } from "drizzle-orm";

async function runMigration() {
  console.log("🚀 Starting Phase 2: Tournament Types Migration\n");

  try {
    // ====================================================================
    // STEP 1: Create tournament_type enum
    // ====================================================================
    console.log("1️⃣  Creating tournament_type enum...");
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE tournament_type AS ENUM ('pod_2', 'pod_3', 'set_teams');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("✓ tournament_type enum ready\n");

    // ====================================================================
    // STEP 2: Create tournament_bracket_style enum
    // ====================================================================
    console.log("2️⃣  Creating tournament_bracket_style enum...");
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE tournament_bracket_style AS ENUM ('single_elimination', 'double_elimination');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("✓ tournament_bracket_style enum ready\n");

    // ====================================================================
    // STEP 3: Create tournament_level enum
    // ====================================================================
    console.log("3️⃣  Creating tournament_level enum...");
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE tournament_level AS ENUM ('c', 'b', 'a', 'open');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("✓ tournament_level enum ready\n");

    // ====================================================================
    // STEP 4: Add new columns to tournaments table
    // ====================================================================
    console.log("4️⃣  Adding new columns to tournaments table...");

    // Add tournament_type column
    const checkTournamentType = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tournaments'
      AND column_name = 'tournament_type'
    `);

    if (checkTournamentType.length === 0) {
      console.log("Adding tournament_type...");
      await db.execute(sql`
        ALTER TABLE tournaments
        ADD COLUMN tournament_type tournament_type DEFAULT 'pod_2' NOT NULL;
      `);
    }

    // Add bracket_style column
    const checkBracketStyle = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tournaments'
      AND column_name = 'bracket_style'
    `);

    if (checkBracketStyle.length === 0) {
      console.log("Adding bracket_style...");
      await db.execute(sql`
        ALTER TABLE tournaments
        ADD COLUMN bracket_style tournament_bracket_style DEFAULT 'single_elimination' NOT NULL;
      `);
    }

    // Add level column
    const checkLevel = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tournaments'
      AND column_name = 'level'
    `);

    if (checkLevel.length === 0) {
      console.log("Adding level...");
      await db.execute(sql`
        ALTER TABLE tournaments
        ADD COLUMN level tournament_level DEFAULT 'open';
      `);
    }

    // Add max_teams column
    const checkMaxTeams = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tournaments'
      AND column_name = 'max_teams'
    `);

    if (checkMaxTeams.length === 0) {
      console.log("Adding max_teams...");
      await db.execute(sql`
        ALTER TABLE tournaments
        ADD COLUMN max_teams INTEGER DEFAULT 9 NOT NULL;
      `);
    }

    // Add scoring_rules column
    const checkScoringRules = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tournaments'
      AND column_name = 'scoring_rules'
    `);

    if (checkScoringRules.length === 0) {
      console.log("Adding scoring_rules...");
      await db.execute(sql`
        ALTER TABLE tournaments
        ADD COLUMN scoring_rules JSONB;
      `);
    }

    // Add format_description column
    const checkFormatDescription = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tournaments'
      AND column_name = 'format_description'
    `);

    if (checkFormatDescription.length === 0) {
      console.log("Adding format_description...");
      await db.execute(sql`
        ALTER TABLE tournaments
        ADD COLUMN format_description TEXT;
      `);
    }

    // Add rules_description column
    const checkRulesDescription = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tournaments'
      AND column_name = 'rules_description'
    `);

    if (checkRulesDescription.length === 0) {
      console.log("Adding rules_description...");
      await db.execute(sql`
        ALTER TABLE tournaments
        ADD COLUMN rules_description TEXT;
      `);
    }

    // Add prize_info column
    const checkPrizeInfo = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tournaments'
      AND column_name = 'prize_info'
    `);

    if (checkPrizeInfo.length === 0) {
      console.log("Adding prize_info...");
      await db.execute(sql`
        ALTER TABLE tournaments
        ADD COLUMN prize_info TEXT;
      `);
    }

    console.log("✓ New columns added to tournaments table\n");

    // ====================================================================
    // STEP 5: Update pods table for 3-player pods
    // ====================================================================
    console.log("5️⃣  Updating pods table for 3-player pods...");

    // Make player2 nullable
    console.log("Making player2 nullable...");
    await db.execute(sql`
      ALTER TABLE pods ALTER COLUMN player2 DROP NOT NULL;
    `);

    // Add player3 column
    const checkPlayer3 = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'pods'
      AND column_name = 'player3'
    `);

    if (checkPlayer3.length === 0) {
      console.log("Adding player3 column...");
      await db.execute(sql`
        ALTER TABLE pods
        ADD COLUMN player3 TEXT;
      `);
    }

    console.log("✓ Pods table updated\n");

    // ====================================================================
    // STEP 6: Populate existing tournament with dynamic content
    // ====================================================================
    console.log("6️⃣  Populating existing tournament with dynamic content...");

    // Check if tournament 1 exists
    const tournament = await db.execute(sql`
      SELECT id FROM tournaments WHERE id = 1 LIMIT 1
    `);

    if (tournament.length > 0) {
      const formatDescription = `**Pool Play**

All 9 pods will compete in 4 rounds of pool play. Each round, teams are grouped into 3 teams of 6 players (2 pods per team). The remaining 3 pods sit out and rotate in for the next round.

**Bracket Play**

After pool play, pods are divided into three tiers based on their standings:
- Top 3 pods form Team A
- Middle 3 pods form Team B
- Bottom 3 pods form Team C

These three 6-player teams compete in a bracket format to determine the tournament champion!`;

      const rulesDescription = `**Reverse Coed Format**

This tournament follows reverse coed rules:

**Net Height**
- Men's net height (7'11 5/8")

**Male Restrictions**
- Males cannot block or attack in front of the 10-foot line
- Males may only attack from behind the 10-foot line
- Females have no restrictions

**Scoring**
- Games played to 21 points
- Must win by 2 points
- Rally scoring (point on every serve)`;

      const prizeInfo = `**Cash Prizes**

Tournament prizes will be awarded to the top teams:

**1st Place:** $500
**2nd Place:** $300
**3rd Place:** $200

Prizes will be distributed to winning teams after the championship match.`;

      const scoringRules = {
        startPoints: 0,
        endPoints: 21,
        winByTwo: true,
      };

      await db.execute(sql`
        UPDATE tournaments
        SET
          tournament_type = 'pod_2',
          bracket_style = 'single_elimination',
          level = 'open',
          max_teams = 9,
          scoring_rules = ${JSON.stringify(scoringRules)}::jsonb,
          format_description = ${formatDescription},
          rules_description = ${rulesDescription},
          prize_info = ${prizeInfo},
          updated_at = NOW()
        WHERE id = 1;
      `);
      console.log("✓ Tournament 1 populated with dynamic content\n");
    } else {
      console.log(
        "⚠️  No tournament with ID 1 found - skipping content population\n"
      );
    }

    // ====================================================================
    // VERIFICATION
    // ====================================================================
    console.log("✅ Phase 2 Migration Complete!\n");
    console.log("=====================================");
    console.log("Summary:");
    console.log("  ✓ Created tournament_type enum");
    console.log("  ✓ Created tournament_bracket_style enum");
    console.log("  ✓ Created tournament_level enum");
    console.log("  ✓ Added configuration columns to tournaments table");
    console.log("  ✓ Updated pods table for 3-player support");
    console.log("  ✓ Populated existing tournament with dynamic content");
    console.log("=====================================\n");

    console.log("🎉 Migration successful! You can now:");
    console.log("1. Update tournament pages to use dynamic data");
    console.log("2. Create tournaments with different types");
    console.log("3. Test the December tournament displaying dynamically\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    console.error(
      "\nYou may need to manually rollback changes if the migration failed partway through."
    );
    process.exit(1);
  }
}

runMigration();

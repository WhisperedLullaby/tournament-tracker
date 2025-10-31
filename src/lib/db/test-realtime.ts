/**
 * Test Supabase Realtime connection
 * Run with: npx tsx src/lib/db/test-realtime.ts
 * Keep this running and update a match in another terminal to see if it detects changes
 */

/* eslint-disable no-console */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error("Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("🔌 Testing Supabase Realtime connection...\n");
console.log("📡 Connecting to Supabase...");
console.log(`   URL: ${supabaseUrl}`);
console.log("\n⏳ Subscribing to pool_matches table...");
console.log("   Keep this running and update a match to test\n");

supabase
  .channel("test-realtime")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "pool_matches",
    },
    (payload) => {
      console.log("✅ REALTIME EVENT RECEIVED!");
      console.log(`   Event: ${payload.eventType}`);
      console.log(`   Table: ${payload.table}`);

      if (payload.new) {
        const match = payload.new as {
          game_number: number;
          status: string;
          team_a_score: number;
          team_b_score: number;
        };
        console.log(`   Game #${match.game_number}: ${match.status}`);
        console.log(`   Score: ${match.team_a_score} - ${match.team_b_score}`);
      }

      console.log("\n⏳ Listening for more changes...\n");
    }
  )
  .subscribe((status) => {
    if (status === "SUBSCRIBED") {
      console.log("✅ Successfully subscribed to realtime updates!");
      console.log("\n📝 Instructions:");
      console.log("   1. Keep this terminal open");
      console.log("   2. In another terminal, run:");
      console.log("      npx tsx --env-file=.env.local src/lib/db/start-game.ts 1");
      console.log("   3. You should see a realtime event appear here");
      console.log("\n⏳ Listening for changes...\n");
    } else if (status === "CLOSED") {
      console.log("❌ Realtime connection closed");
    } else if (status === "CHANNEL_ERROR") {
      console.log("❌ Realtime channel error");
      console.log("\n🔧 Troubleshooting:");
      console.log("   1. Check that Realtime is enabled in Supabase Dashboard");
      console.log("   2. Go to Database > Replication");
      console.log("   3. Enable 'pool_matches' table for realtime");
      console.log("   4. Check Row Level Security policies");
    } else {
      console.log(`📡 Status: ${status}`);
    }
  });

// Keep the script running
console.log("Press Ctrl+C to exit\n");

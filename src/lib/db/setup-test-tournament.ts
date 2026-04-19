/**
 * Set up a fresh test tournament with 12 fake pods and a full pool schedule.
 * Generates a unique slug each run so it can be run multiple times.
 *
 * Usage:
 *   npm run test:setup
 *   npm run test:setup -- --user-id=<your-supabase-user-id>
 *
 * To find your user ID: open the app, open DevTools console, run:
 *   const { data } = await (await import('/src/lib/auth/client.ts')).createClient().auth.getUser()
 *   console.log(data.user.id)
 * Or check the Supabase dashboard → Authentication → Users.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./index";
import { tournaments, pods, poolMatches, tournamentRoles } from "./schema";
import { eq } from "drizzle-orm";

// --- Parse args ---
const args = process.argv.slice(2);
const userIdArg = args.find((a) => a.startsWith("--user-id="));
const USER_ID = userIdArg ? userIdArg.split("=")[1] : null;

// --- Fake team data ---
const FAKE_PODS = [
  { player1: "Alice", player2: "Bob", teamName: "The Smashers" },
  { player1: "Charlie", player2: "Diana", teamName: null },
  { player1: "Eve", player2: "Frank", teamName: "Net Ninjas" },
  { player1: "Grace", player2: "Henry", teamName: null },
  { player1: "Ivy", player2: "Jack", teamName: "Ace Spikers" },
  { player1: "Kate", player2: "Leo", teamName: null },
  { player1: "Mia", player2: "Noah", teamName: "Block Party" },
  { player1: "Olivia", player2: "Paul", teamName: null },
  { player1: "Quinn", player2: "Ryan", teamName: "Set It Up" },
  { player1: "Sara", player2: "Tom", teamName: null },
  { player1: "Uma", player2: "Victor", teamName: "Dig Deep" },
  { player1: "Wendy", player2: "Xavier", teamName: null },
];

// 8-game pool schedule using pod index (0-11)
const POOL_SCHEDULE = [
  {
    gameNumber: 1,
    scheduledTime: "10:00 AM",
    teamAPods: [0, 1, 2],
    teamBPods: [3, 4, 5],
    sittingPods: [6, 7, 8, 9, 10, 11],
  },
  {
    gameNumber: 2,
    scheduledTime: "10:20 AM",
    teamAPods: [6, 7, 8],
    teamBPods: [9, 10, 11],
    sittingPods: [0, 1, 2, 3, 4, 5],
  },
  {
    gameNumber: 3,
    scheduledTime: "10:40 AM",
    teamAPods: [0, 3, 6],
    teamBPods: [1, 4, 7],
    sittingPods: [2, 5, 8, 9, 10, 11],
  },
  {
    gameNumber: 4,
    scheduledTime: "11:00 AM",
    teamAPods: [2, 5, 8],
    teamBPods: [0, 4, 9],
    sittingPods: [1, 3, 6, 7, 10, 11],
  },
  {
    gameNumber: 5,
    scheduledTime: "11:20 AM",
    teamAPods: [1, 6, 10],
    teamBPods: [3, 7, 11],
    sittingPods: [0, 2, 4, 5, 8, 9],
  },
  {
    gameNumber: 6,
    scheduledTime: "11:40 AM",
    teamAPods: [2, 4, 11],
    teamBPods: [0, 5, 10],
    sittingPods: [1, 3, 6, 7, 8, 9],
  },
  {
    gameNumber: 7,
    scheduledTime: "12:00 PM",
    teamAPods: [1, 3, 9],
    teamBPods: [2, 6, 8],
    sittingPods: [0, 4, 5, 7, 10, 11],
  },
  {
    gameNumber: 8,
    scheduledTime: "12:20 PM",
    teamAPods: [4, 7, 10],
    teamBPods: [5, 6, 9],
    sittingPods: [0, 1, 2, 3, 8, 11],
  },
];

async function setup() {
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "").slice(0, 12);
  const slug = `test-${timestamp}`;

  console.log("🧪 Setting up test tournament...\n");

  // 1. Create tournament
  console.log("📋 Creating tournament...");
  const [tournament] = await db
    .insert(tournaments)
    .values({
      name: `TEST - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      slug,
      date: new Date(),
      location: "Test Gym",
      description: "Auto-generated test tournament.",
      status: "active",
      tournamentType: "pod_2",
      bracketStyle: "double_elimination",
      level: "open",
      maxPods: 12,
      maxTeams: 12,
      scoringRules: {
        startPoints: 0,
        endPoints: 21,
        winByTwo: true,
        cap: 25,
      },
      poolPlayDescription: "12 Pods · 8 pool games",
      bracketPlayDescription: "4 Teams · Double elimination",
      isPublic: true,
      requireAuth: false,
      createdBy: USER_ID ?? "test-user",
    })
    .returning();

  console.log(`  ✓ Tournament: "${tournament.name}" (ID ${tournament.id}, slug: ${slug})\n`);

  // 2. Create pods
  console.log("👥 Creating 12 pods...");
  const podIds: number[] = [];

  for (let i = 0; i < FAKE_PODS.length; i++) {
    const p = FAKE_PODS[i];
    const [pod] = await db
      .insert(pods)
      .values({
        tournamentId: tournament.id,
        userId: null,
        email: `fakeplayer${i + 1}@test.dev`,
        name: p.teamName ?? `${p.player1} & ${p.player2}`,
        player1: p.player1,
        player2: p.player2,
        teamName: p.teamName,
      })
      .returning();

    podIds.push(pod.id);
    const display = p.teamName ?? `${p.player1} & ${p.player2}`;
    console.log(`  ✓ Pod ${i + 1}: ${display}`);
  }

  console.log(`\n  Pod IDs: ${podIds[0]}–${podIds[11]}\n`);

  // 3. Seed pool schedule
  console.log("📅 Seeding pool schedule...");
  await db.delete(poolMatches).where(eq(poolMatches.tournamentId, tournament.id));

  for (const game of POOL_SCHEDULE) {
    await db.insert(poolMatches).values({
      tournamentId: tournament.id,
      gameNumber: game.gameNumber,
      roundNumber: Math.ceil(game.gameNumber / 2),
      scheduledTime: game.scheduledTime,
      courtNumber: 1,
      teamAPods: game.teamAPods.map((i) => podIds[i]),
      teamBPods: game.teamBPods.map((i) => podIds[i]),
      sittingPods: game.sittingPods.map((i) => podIds[i]),
      teamAScore: 0,
      teamBScore: 0,
      status: "pending",
    });
    console.log(`  ✓ Game ${game.gameNumber}: ${game.scheduledTime}`);
  }

  // 4. Add organizer role
  if (USER_ID) {
    console.log(`\n🔑 Adding organizer role for user ${USER_ID}...`);
    await db.insert(tournamentRoles).values({
      tournamentId: tournament.id,
      userId: USER_ID,
      role: "organizer",
    });
    console.log("  ✓ Organizer role added");
  } else {
    console.log("\n⚠️  No --user-id provided — skipping organizer role.");
    console.log("   To add yourself as organizer, run this SQL in Supabase:");
    console.log(`   INSERT INTO tournament_roles (tournament_id, user_id, role)`);
    console.log(`   VALUES (${tournament.id}, '<your-user-id>', 'organizer');`);
  }

  console.log("\n✅ Done!\n");
  console.log(`  URL:      http://localhost:3000/tournaments/${slug}`);
  console.log(`  Teardown: npm run test:teardown -- --slug=${slug}`);
  console.log();

  process.exit(0);
}

setup().catch((err) => {
  console.error("❌ Setup failed:", err);
  process.exit(1);
});

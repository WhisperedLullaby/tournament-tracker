/**
 * Generate a pool play schedule for a tournament.
 *
 * Algorithm:
 *   For each game, select the pods with the fewest plays (breaking ties by who
 *   sat longest ago) to play, then partition them into two teams that minimise
 *   repeated teammate and opponent pairs.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/generate-pool-schedule.ts <slug> [options]
 *
 * Options:
 *   --dry-run              Print schedule without writing to DB
 *   --force                Overwrite existing schedule
 *   --target-games=N       Target games per pod (default: 4)
 *   --minutes-per-game=N   Minutes between game start times (default: 20)
 *   --pods-per-side=N      Override pods per side (default: derived from tournament type)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../src/lib/db";
import { tournaments, pods, poolMatches } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduledGame {
  gameNumber: number;
  roundNumber: number;
  courtNumber: number;
  teamAPods: number[];
  teamBPods: number[];
  sittingPods: number[];
  scheduledTime: string | null;
}

// ─── Combinatorics ────────────────────────────────────────────────────────────

/** Generates all size-k subsets of arr starting at index `start`. */
function* subsets(arr: number[], k: number, start = 0): Generator<number[]> {
  if (k === 0) { yield []; return; }
  for (let i = start; i <= arr.length - k; i++) {
    for (const rest of subsets(arr, k - 1, i + 1)) {
      yield [arr[i], ...rest];
    }
  }
}

/**
 * Generates all unique unordered partitions of `players` into two groups of
 * size `groupSize`. Uniqueness: the first element of players always goes into
 * group A, which halves the search space.
 */
function* partitions(
  players: number[],
  groupSize: number
): Generator<[number[], number[]]> {
  const pivot = players[0];
  const rest = players.slice(1);
  for (const additionalA of subsets(rest, groupSize - 1)) {
    const groupA = [pivot, ...additionalA];
    const setA = new Set(groupA);
    const groupB = players.filter((p) => !setA.has(p));
    yield [groupA, groupB];
  }
}

/**
 * Deterministic LCG shuffle. Same seed → same permutation every run.
 * Used to vary which tied partition "wins" across games.
 */
function lcgShuffle(arr: number[], seed: number): number[] {
  const result = [...arr];
  let s = (seed | 1) >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ─── Scheduling ───────────────────────────────────────────────────────────────

function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)},${Math.max(a, b)}`;
}

/**
 * Score a partition. Returns [primary, maxTeammate, maxOpponent] — compare
 * lexicographically, lower is better.
 *
 * Primary:     2 × sum of teammate repeat counts + 1 × sum of opponent repeat counts
 * maxTeammate: max teammate count of any single pair within a team
 *              (prevents one pair being teammates too many times)
 * maxOpponent: max opponent count of any single cross-team pair
 *              (prevents two pods always facing each other and never teaming up)
 */
function scorePartition(
  teamA: number[],
  teamB: number[],
  teammateCounts: Map<string, number>,
  opponentCounts: Map<string, number>
): [number, number, number] {
  let primary = 0;
  let maxTm = 0;
  let maxOp = 0;

  for (let i = 0; i < teamA.length; i++)
    for (let j = i + 1; j < teamA.length; j++) {
      const c = teammateCounts.get(pairKey(teamA[i], teamA[j])) ?? 0;
      primary += 2 * c;
      if (c > maxTm) maxTm = c;
    }
  for (let i = 0; i < teamB.length; i++)
    for (let j = i + 1; j < teamB.length; j++) {
      const c = teammateCounts.get(pairKey(teamB[i], teamB[j])) ?? 0;
      primary += 2 * c;
      if (c > maxTm) maxTm = c;
    }
  for (const a of teamA)
    for (const b of teamB) {
      const c = opponentCounts.get(pairKey(a, b)) ?? 0;
      primary += c;
      if (c > maxOp) maxOp = c;
    }

  return [primary, maxTm, maxOp];
}

function generateSchedule(podIds: number[], podsPerSide: number, numGames: number): ScheduledGame[] {
  const N = podIds.length;
  const playingPerGame = 2 * podsPerSide;

  const playsCount = new Map<number, number>(podIds.map((id) => [id, 0]));
  const lastPlayed = new Map<number, number>(podIds.map((id) => [id, -Infinity]));
  // Track consecutive games played so we can enforce the "no 3 in a row" rule
  const consecutiveCount = new Map<number, number>(podIds.map((id) => [id, 0]));
  const teammateCounts = new Map<string, number>();
  const opponentCounts = new Map<string, number>();

  const games: ScheduledGame[] = [];

  for (let g = 1; g <= numGames; g++) {
    // Hard constraint: any pod on 2 consecutive games MUST sit this round.
    const mustSit = new Set(podIds.filter((id) => (consecutiveCount.get(id) ?? 0) >= 2));

    // Eligible pods are those not required to sit.
    const eligible = podIds.filter((id) => !mustSit.has(id));

    if (eligible.length < playingPerGame) {
      throw new Error(`Game ${g}: only ${eligible.length} eligible pods but need ${playingPerGame}. Increase total pods or reduce pods-per-side.`);
    }

    // Find the minimum play count among eligible pods.
    const minPlays = Math.min(...eligible.map((id) => playsCount.get(id) ?? 0));

    // Build the candidate pool: start from minPlays, expand to minPlays+1, +2, ...
    // until we have at least playingPerGame pods to choose from.
    let candidates: number[] = [];
    let tier = minPlays;
    while (candidates.length < playingPerGame) {
      const next = eligible.filter((id) => (playsCount.get(id) ?? 0) === tier);
      candidates = [...candidates, ...next];
      tier++;
      if (tier > minPlays + N) break; // safety
    }

    // Shuffle for deterministic variety before greedy selection.
    candidates = lcgShuffle(candidates, g * 13337);

    const playing: number[] = [];
    const remaining = [...candidates];

    while (playing.length < playingPerGame && remaining.length > 0) {
      // If we have exactly the right number left, add them all.
      if (playing.length + remaining.length === playingPerGame) {
        playing.push(...remaining);
        break;
      }
      // Pick the pod with the lowest familiarity with already-selected pods.
      let bestIdx = 0;
      let bestFam = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const id = remaining[i];
        let fam = 0;
        for (const s of playing) {
          fam += (teammateCounts.get(pairKey(id, s)) ?? 0) + (opponentCounts.get(pairKey(id, s)) ?? 0);
        }
        if (fam < bestFam) { bestFam = fam; bestIdx = i; }
      }
      playing.push(remaining[bestIdx]);
      remaining.splice(bestIdx, 1);
    }

    const playingSet = new Set(playing);
    const sitting = [...mustSit, ...eligible.filter((id) => !playingSet.has(id))];

    // Shuffle playing pods before iterating partitions so that when multiple
    // partitions tie on score, the winner isn't always the same lexicographic
    // first — this dramatically improves teammate variety across games.
    const shuffledPlaying = lcgShuffle(playing, g * 7919);

    // Find the best partition into two balanced teams
    let best: [number, number, number] = [Infinity, Infinity, Infinity];
    let bestA: number[] = [];
    let bestB: number[] = [];

    for (const [teamA, teamB] of partitions(shuffledPlaying, podsPerSide)) {
      const score = scorePartition(teamA, teamB, teammateCounts, opponentCounts);
      if (
        score[0] < best[0] ||
        (score[0] === best[0] && score[1] < best[1]) ||
        (score[0] === best[0] && score[1] === best[1] && score[2] < best[2])
      ) {
        best = score;
        bestA = teamA;
        bestB = teamB;
      }
    }

    // Update relationship counts
    for (let i = 0; i < bestA.length; i++)
      for (let j = i + 1; j < bestA.length; j++)
        teammateCounts.set(pairKey(bestA[i], bestA[j]), (teammateCounts.get(pairKey(bestA[i], bestA[j])) ?? 0) + 1);
    for (let i = 0; i < bestB.length; i++)
      for (let j = i + 1; j < bestB.length; j++)
        teammateCounts.set(pairKey(bestB[i], bestB[j]), (teammateCounts.get(pairKey(bestB[i], bestB[j])) ?? 0) + 1);
    for (const a of bestA)
      for (const b of bestB)
        opponentCounts.set(pairKey(a, b), (opponentCounts.get(pairKey(a, b)) ?? 0) + 1);

    // Update play history and consecutive streak
    for (const id of podIds) {
      if (playingSet.has(id)) {
        playsCount.set(id, (playsCount.get(id) ?? 0) + 1);
        lastPlayed.set(id, g);
        consecutiveCount.set(id, (consecutiveCount.get(id) ?? 0) + 1);
      } else {
        consecutiveCount.set(id, 0); // reset streak on any sit
      }
    }

    games.push({
      gameNumber: g,
      roundNumber: g,
      courtNumber: 1,
      teamAPods: bestA,
      teamBPods: bestB,
      sittingPods: sitting,
      scheduledTime: null,
    });
  }

  return games;
}

// ─── Time formatting ──────────────────────────────────────────────────────────

/** Formats "HH:MM" (24h) + offset into "H:MM AM/PM". */
function formatTime(startTime: string, gameNumber: number, minutesPerGame: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const totalMinutes = h * 60 + m + (gameNumber - 1) * minutesPerGame;
  const hour = Math.floor(totalMinutes / 60) % 24;
  const min = totalMinutes % 60;
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayH = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayH}:${min.toString().padStart(2, "0")} ${ampm}`;
}

// ─── Diagnostics ──────────────────────────────────────────────────────────────

function printDiagnostics(games: ScheduledGame[], podIds: number[]) {
  const playsCount = new Map<number, number>(podIds.map((id) => [id, 0]));
  const teammates = new Map<string, number>();
  const opponents = new Map<string, number>();
  let threeInARowPenalty = 0;
  const lastPlayed = new Map<number, number>(podIds.map((id) => [id, -1]));
  const streak = new Map<number, number>(podIds.map((id) => [id, 0]));

  for (const game of games) {
    for (const id of [...game.teamAPods, ...game.teamBPods]) {
      playsCount.set(id, (playsCount.get(id) ?? 0) + 1);
      const newStreak = (lastPlayed.get(id) ?? -1) === game.gameNumber - 1 ? (streak.get(id) ?? 0) + 1 : 1;
      if (newStreak >= 3) threeInARowPenalty++;
      streak.set(id, newStreak);
      lastPlayed.set(id, game.gameNumber);
    }
    for (let i = 0; i < game.teamAPods.length; i++)
      for (let j = i + 1; j < game.teamAPods.length; j++) {
        const k = pairKey(game.teamAPods[i], game.teamAPods[j]);
        teammates.set(k, (teammates.get(k) ?? 0) + 1);
      }
    for (let i = 0; i < game.teamBPods.length; i++)
      for (let j = i + 1; j < game.teamBPods.length; j++) {
        const k = pairKey(game.teamBPods[i], game.teamBPods[j]);
        teammates.set(k, (teammates.get(k) ?? 0) + 1);
      }
    for (const a of game.teamAPods)
      for (const b of game.teamBPods) {
        const k = pairKey(a, b);
        opponents.set(k, (opponents.get(k) ?? 0) + 1);
      }
  }

  const maxTeammates = Math.max(...teammates.values(), 0);
  const maxOpponents = Math.max(...opponents.values(), 0);
  const playCounts = [...playsCount.values()];
  const minPlays = Math.min(...playCounts);
  const maxPlays = Math.max(...playCounts);

  console.log(`\n📊 Quality metrics:`);
  console.log(`   Games per pod: ${minPlays}–${maxPlays} (ideal: equal)`);
  console.log(`   Max teammate repeats: ${maxTeammates} (ideal: 1 or fewer)`);
  console.log(`   Max opponent repeats: ${maxOpponents} (ideal: 1 or fewer)`);
  console.log(`   Three-in-a-row violations: ${threeInARowPenalty} (must be 0)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0].startsWith("--")) {
    console.error(
      "Usage: npx tsx --env-file=.env.local scripts/generate-pool-schedule.ts <slug> [options]\n\n" +
      "Options:\n" +
      "  --dry-run              Print schedule without writing to DB\n" +
      "  --force                Overwrite existing schedule\n" +
      "  --target-games=N       Target games per pod (default: 4)\n" +
      "  --minutes-per-game=N   Minutes between game start times (default: 20)\n" +
      "  --pods-per-side=N      Override pods per side"
    );
    process.exit(1);
  }

  const slug = args[0];
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const minutesPerGame = parseInt(args.find((a) => a.startsWith("--minutes-per-game="))?.split("=")[1] ?? "20");
  const targetGames = parseInt(args.find((a) => a.startsWith("--target-games="))?.split("=")[1] ?? "4");
  const overridePPS = args.find((a) => a.startsWith("--pods-per-side="))?.split("=")[1];

  // ── Fetch tournament ──────────────────────────────────────────────────────

  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.slug, slug),
  });

  if (!tournament) {
    console.error(`❌ Tournament '${slug}' not found`);
    process.exit(1);
  }

  // ── Fetch pods ────────────────────────────────────────────────────────────

  const podList = await db.select().from(pods).where(eq(pods.tournamentId, tournament.id));

  if (podList.length === 0) {
    console.error("❌ No pods registered for this tournament");
    process.exit(1);
  }

  const N = podList.length;

  // ── Determine pods per side ───────────────────────────────────────────────

  let podsPerSide: number;
  if (overridePPS) {
    podsPerSide = parseInt(overridePPS);
  } else if (tournament.tournamentType === "pod_2") {
    podsPerSide = 3; // 3×2 = 6 players per side
  } else if (tournament.tournamentType === "pod_3") {
    podsPerSide = 2; // 2×3 = 6 players per side
  } else {
    podsPerSide = 1; // set_teams: each pod is a full team
  }

  // Safety: can't have more players per side than we have pods
  while (podsPerSide * 2 > N) podsPerSide--;

  if (podsPerSide < 1) {
    console.error(`❌ Not enough pods (${N}) to run games`);
    process.exit(1);
  }

  const playingPerGame = 2 * podsPerSide;
  const sittingPerGame = N - playingPerGame;

  // ── Compute number of games ───────────────────────────────────────────────

  // G × playingPerGame = N × targetGames → G = N * targetGames / playingPerGame
  const exactGames = (N * targetGames) / playingPerGame;
  const numGames = Number.isInteger(exactGames) ? exactGames : Math.ceil(exactGames);
  const actualPlaysPerPod = (numGames * playingPerGame) / N;

  // ── Check for existing schedule ───────────────────────────────────────────

  const existing = await db.select().from(poolMatches).where(eq(poolMatches.tournamentId, tournament.id));
  if (existing.length > 0 && !force) {
    console.error(`\n❌ Tournament already has ${existing.length} games. Use --force to overwrite.`);
    process.exit(1);
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log(`\n🏐 Tournament:    ${tournament.name}`);
  console.log(`👥 Pods:          ${N}`);
  console.log(`⚔️  Pods per side: ${podsPerSide} (${podsPerSide * (tournament.tournamentType === "pod_2" ? 2 : tournament.tournamentType === "pod_3" ? 3 : 1)} players per side)`);
  console.log(`🎮 Games:         ${numGames} total (${playingPerGame} play, ${sittingPerGame} sit per game)`);
  console.log(`📈 Plays per pod: ~${actualPlaysPerPod.toFixed(1)} (target: ${targetGames})`);
  if (tournament.startTime) console.log(`⏰ Start time:    ${tournament.startTime}`);

  // ── Generate schedule ─────────────────────────────────────────────────────

  const podIds = podList.map((p) => p.id);
  const games = generateSchedule(podIds, podsPerSide, numGames);

  // Attach scheduled times
  if (tournament.startTime) {
    for (const game of games) {
      game.scheduledTime = formatTime(tournament.startTime, game.gameNumber, minutesPerGame);
    }
  }

  // ── Print schedule ────────────────────────────────────────────────────────

  const podName = new Map(podList.map((p) => [p.id, p.name]));
  const display = (ids: number[]) => ids.map((id) => podName.get(id) ?? `Pod ${id}`).join(", ");

  console.log("\n📅 Generated Schedule:\n");
  for (const game of games) {
    const timeLabel = game.scheduledTime ? ` (${game.scheduledTime})` : "";
    console.log(`Game ${game.gameNumber}${timeLabel}:`);
    console.log(`  Team A: ${display(game.teamAPods)}`);
    console.log(`  Team B: ${display(game.teamBPods)}`);
    if (game.sittingPods.length > 0) console.log(`  Sitting: ${display(game.sittingPods)}`);
  }

  printDiagnostics(games, podIds);

  // ── Write to DB ───────────────────────────────────────────────────────────

  if (dryRun) {
    console.log("\n🔍 Dry run — no changes written to database.");
    process.exit(0);
  }

  if (existing.length > 0) {
    await db.delete(poolMatches).where(eq(poolMatches.tournamentId, tournament.id));
    console.log(`\n⚠️  Cleared ${existing.length} existing game(s)`);
  }

  for (const game of games) {
    await db.insert(poolMatches).values({
      tournamentId: tournament.id,
      gameNumber: game.gameNumber,
      roundNumber: game.roundNumber,
      courtNumber: game.courtNumber,
      teamAPods: game.teamAPods,
      teamBPods: game.teamBPods,
      sittingPods: game.sittingPods,
      scheduledTime: game.scheduledTime,
      teamAScore: 0,
      teamBScore: 0,
      status: "pending",
    });
  }

  console.log(`\n✅ Inserted ${games.length} games for "${tournament.name}"`);
  console.log(`💡 All games set to 'pending' status with 0–0 scores`);
}

main().catch(console.error).finally(() => process.exit(0));

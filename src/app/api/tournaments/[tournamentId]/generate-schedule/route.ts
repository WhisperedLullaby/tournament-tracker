import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tournaments, pods, poolMatches } from "@/lib/db/schema";
import { createClient } from "@/lib/auth/server";
import { getUserTournamentRole } from "@/lib/db/queries";
import { eq } from "drizzle-orm";

// ─── Combinatorics ────────────────────────────────────────────────────────────

function* subsets(arr: number[], k: number, start = 0): Generator<number[]> {
  if (k === 0) { yield []; return; }
  for (let i = start; i <= arr.length - k; i++) {
    for (const rest of subsets(arr, k - 1, i + 1)) {
      yield [arr[i], ...rest];
    }
  }
}

function* partitions(players: number[], groupSize: number): Generator<[number[], number[]]> {
  const pivot = players[0];
  const rest = players.slice(1);
  for (const additionalA of subsets(rest, groupSize - 1)) {
    const groupA = [pivot, ...additionalA];
    const setA = new Set(groupA);
    const groupB = players.filter((p) => !setA.has(p));
    yield [groupA, groupB];
  }
}

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

interface ScheduledGame {
  gameNumber: number;
  roundNumber: number;
  courtNumber: number;
  teamAPods: number[];
  teamBPods: number[];
  sittingPods: number[];
  scheduledTime: string | null;
}

function generateSchedule(podIds: number[], podsPerSide: number, numGames: number): ScheduledGame[] {
  const N = podIds.length;
  const playingPerGame = 2 * podsPerSide;

  const playsCount = new Map<number, number>(podIds.map((id) => [id, 0]));
  const consecutiveCount = new Map<number, number>(podIds.map((id) => [id, 0]));
  const teammateCounts = new Map<string, number>();
  const opponentCounts = new Map<string, number>();

  const games: ScheduledGame[] = [];

  for (let g = 1; g <= numGames; g++) {
    const mustSit = new Set(podIds.filter((id) => (consecutiveCount.get(id) ?? 0) >= 2));
    const eligible = podIds.filter((id) => !mustSit.has(id));

    if (eligible.length < playingPerGame) {
      throw new Error(`Game ${g}: only ${eligible.length} eligible pods but need ${playingPerGame}.`);
    }

    const minPlays = Math.min(...eligible.map((id) => playsCount.get(id) ?? 0));

    let candidates: number[] = [];
    let tier = minPlays;
    while (candidates.length < playingPerGame) {
      const next = eligible.filter((id) => (playsCount.get(id) ?? 0) === tier);
      candidates = [...candidates, ...next];
      tier++;
      if (tier > minPlays + N) break;
    }

    candidates = lcgShuffle(candidates, g * 13337);

    const playing: number[] = [];
    const remaining = [...candidates];

    while (playing.length < playingPerGame && remaining.length > 0) {
      if (playing.length + remaining.length === playingPerGame) {
        playing.push(...remaining);
        break;
      }
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

    const shuffledPlaying = lcgShuffle(playing, g * 7919);

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

    for (let i = 0; i < bestA.length; i++)
      for (let j = i + 1; j < bestA.length; j++)
        teammateCounts.set(pairKey(bestA[i], bestA[j]), (teammateCounts.get(pairKey(bestA[i], bestA[j])) ?? 0) + 1);
    for (let i = 0; i < bestB.length; i++)
      for (let j = i + 1; j < bestB.length; j++)
        teammateCounts.set(pairKey(bestB[i], bestB[j]), (teammateCounts.get(pairKey(bestB[i], bestB[j])) ?? 0) + 1);
    for (const a of bestA)
      for (const b of bestB)
        opponentCounts.set(pairKey(a, b), (opponentCounts.get(pairKey(a, b)) ?? 0) + 1);

    for (const id of podIds) {
      if (playingSet.has(id)) {
        playsCount.set(id, (playsCount.get(id) ?? 0) + 1);
        consecutiveCount.set(id, (consecutiveCount.get(id) ?? 0) + 1);
      } else {
        consecutiveCount.set(id, 0);
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

function formatTime(startTime: string, gameNumber: number, minutesPerGame: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const totalMinutes = h * 60 + m + (gameNumber - 1) * minutesPerGame;
  const hour = Math.floor(totalMinutes / 60) % 24;
  const min = totalMinutes % 60;
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayH = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayH}:${min.toString().padStart(2, "0")} ${ampm}`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const tournamentIdNum = parseInt(tournamentId);

    if (isNaN(tournamentIdNum)) {
      return NextResponse.json({ error: "Invalid tournament ID" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const role = await getUserTournamentRole(user.id, tournamentIdNum);
    if (role !== "organizer") {
      return NextResponse.json({ error: "Organizer access required" }, { status: 403 });
    }

    const body = await request.json();
    const targetGames: number = body.targetGames ?? 4;
    const minutesPerGame: number = body.minutesPerGame ?? 20;
    const force: boolean = body.force ?? false;

    const tournament = await db.query.tournaments.findFirst({
      where: eq(tournaments.id, tournamentIdNum),
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const podList = await db.select().from(pods).where(eq(pods.tournamentId, tournamentIdNum));

    if (podList.length === 0) {
      return NextResponse.json({ error: "No pods registered for this tournament" }, { status: 400 });
    }

    const N = podList.length;

    let podsPerSide: number;
    if (tournament.tournamentType === "pod_2") {
      podsPerSide = 3;
    } else if (tournament.tournamentType === "pod_3") {
      podsPerSide = 2;
    } else {
      podsPerSide = 1;
    }
    while (podsPerSide * 2 > N) podsPerSide--;

    if (podsPerSide < 1) {
      return NextResponse.json({ error: `Not enough pods (${N}) to run games` }, { status: 400 });
    }

    const playingPerGame = 2 * podsPerSide;
    const exactGames = (N * targetGames) / playingPerGame;
    const numGames = Number.isInteger(exactGames) ? exactGames : Math.ceil(exactGames);

    const existing = await db.select().from(poolMatches).where(eq(poolMatches.tournamentId, tournamentIdNum));
    if (existing.length > 0 && !force) {
      return NextResponse.json(
        { error: `Tournament already has ${existing.length} games. Enable "Force overwrite" to replace them.` },
        { status: 409 }
      );
    }

    const podIds = podList.map((p) => p.id);
    const games = generateSchedule(podIds, podsPerSide, numGames);

    if (tournament.startTime) {
      for (const game of games) {
        game.scheduledTime = formatTime(tournament.startTime, game.gameNumber, minutesPerGame);
      }
    }

    if (existing.length > 0) {
      await db.delete(poolMatches).where(eq(poolMatches.tournamentId, tournamentIdNum));
    }

    for (const game of games) {
      await db.insert(poolMatches).values({
        tournamentId: tournamentIdNum,
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

    return NextResponse.json({
      success: true,
      gamesCreated: games.length,
      podsCount: N,
      clearedExisting: existing.length > 0 ? existing.length : 0,
    });
  } catch (error) {
    console.error("Error generating schedule:", error);
    const message = error instanceof Error ? error.message : "Failed to generate schedule";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;
  const tournamentIdNum = parseInt(tournamentId);

  if (isNaN(tournamentIdNum)) {
    return NextResponse.json({ error: "Invalid tournament ID" }, { status: 400 });
  }

  const existing = await db.select().from(poolMatches).where(eq(poolMatches.tournamentId, tournamentIdNum));
  return NextResponse.json({ existingCount: existing.length });
}

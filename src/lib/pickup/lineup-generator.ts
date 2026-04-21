import type { PickupRegistration } from "@/lib/db/schema";

export interface GeneratedLineup {
  teamA: number[]; // registration IDs
  teamB: number[]; // registration IDs
  bench: number[]; // registration IDs
}

function seededRandom(seed: number) {
  // Simple xorshift32
  let s = seed >>> 0;
  return function () {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

function fisherYates<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateLineup(
  attendees: PickupRegistration[],
  sessionId: number,
  seriesNumber: number
): GeneratedLineup {
  const rand = seededRandom(sessionId * 1000 + seriesNumber);

  // Group by position
  const byPosition = new Map<string, PickupRegistration[]>();
  for (const reg of attendees) {
    const group = byPosition.get(reg.position) ?? [];
    group.push(reg);
    byPosition.set(reg.position, group);
  }

  const teamA: number[] = [];
  const teamB: number[] = [];
  const bench: number[] = [];

  for (const [, group] of byPosition) {
    const shuffled = fisherYates(group, rand);
    shuffled.forEach((reg, i) => {
      if (i % 2 === 0) {
        teamA.push(reg.id);
      } else {
        teamB.push(reg.id);
      }
    });
  }

  // Balance teams — move excess from larger to bench
  const diff = teamA.length - teamB.length;
  if (diff > 1) {
    const overflow = teamA.splice(teamA.length - Math.floor(diff / 2));
    bench.push(...overflow);
  } else if (diff < -1) {
    const overflow = teamB.splice(teamB.length - Math.floor(-diff / 2));
    bench.push(...overflow);
  }

  return { teamA, teamB, bench };
}

export const POSITION_LABELS: Record<string, string> = {
  setter: "Setter",
  outside_hitter: "Outside Hitter",
  middle_blocker: "Middle Blocker",
  opposite: "Opposite",
  libero: "Libero",
  defensive_specialist: "Defensive Specialist",
};

export const POSITION_ORDER = [
  "setter",
  "outside_hitter",
  "middle_blocker",
  "opposite",
  "libero",
  "defensive_specialist",
] as const;

export type VolleyballPosition = (typeof POSITION_ORDER)[number];

export const DEFAULT_POSITION_LIMITS: Record<VolleyballPosition, number> = {
  setter: 2,
  outside_hitter: 4,
  middle_blocker: 4,
  opposite: 2,
  libero: 2,
  defensive_specialist: 0,
};

export function formatPosition(pos: string): string {
  return POSITION_LABELS[pos] ?? pos.replace(/_/g, " ");
}

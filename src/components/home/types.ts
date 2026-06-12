export interface HomeTournamentStats {
  live: { name: string; slug: string } | null;
  upcomingCount: number;
  /** Total open team slots across all upcoming tournaments */
  openSlots: number;
  next: {
    name: string;
    slug: string;
    date: string; // ISO string (serialized for client components)
    openSlots: number;
    maxPods: number;
  } | null;
}

export interface HomePickupStats {
  live: { title: string; slug: string; status: "attendance" | "active" } | null;
  upcomingCount: number;
  /** Total open spots across all upcoming sessions */
  openSpots: number;
  next: {
    title: string;
    slug: string;
    date: string; // ISO string
    startTime: string | null;
    openSpots: number;
    totalCapacity: number;
  } | null;
}

export interface HomeStats {
  tournaments: HomeTournamentStats;
  pickup: HomePickupStats;
}

import type { Metadata } from "next";
import { createClient } from "@/lib/auth/server";
import { getAllTournaments, getPodCount, isAdminUser } from "@/lib/db/queries";
import {
  getAllPickupSessions,
  getPickupRegistrations,
} from "@/lib/db/pickup-queries";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { RevealSection } from "@/components/reveal-section";
import { HomeHero } from "@/components/home/home-hero";
import { HomePortalCards } from "@/components/home/home-portal-cards";
import type { HomeStats } from "@/components/home/types";
import { CalendarCheck, Shuffle, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Hewwo Pwincess — Volleyball Tournaments & Pickup Games",
  description:
    "Tournaments and pickup volleyball with live scores, standings, brackets, and auto-balanced lineups.",
};

async function getHomeStats(): Promise<HomeStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = user ? await isAdminUser(user.id) : false;

  const [upcomingTournaments, activeTournaments, allSessions] =
    await Promise.all([
      getAllTournaments({
        isPublic: true,
        includeTest: isAdmin,
        status: "upcoming",
      }),
      getAllTournaments({
        isPublic: true,
        includeTest: isAdmin,
        status: "active",
      }),
      getAllPickupSessions({ includeTest: isAdmin }),
    ]);

  // Tournaments: soonest first, with open team slots per tournament
  const sortedUpcoming = [...upcomingTournaments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const podCounts = await Promise.all(
    sortedUpcoming.map((t) => getPodCount(t.id))
  );
  const openSlotsPer = sortedUpcoming.map((t, i) =>
    Math.max(0, t.maxPods - podCounts[i])
  );
  const nextTournament = sortedUpcoming[0] ?? null;
  const liveTournament = activeTournaments[0] ?? null;

  // Pickup: an active session beats a check-in session for the "live" slot
  const liveSession =
    allSessions.find((s) => s.status === "active") ??
    allSessions.find((s) => s.status === "attendance") ??
    null;
  const upcomingSessions = allSessions
    .filter((s) => s.status === "upcoming")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const regLists = await Promise.all(
    upcomingSessions.map((s) => getPickupRegistrations(s.id))
  );
  const openSpotsPer = upcomingSessions.map((s, i) => {
    const filled = regLists[i].filter(
      (r) => r.status === "registered" || r.status === "attended"
    ).length;
    return Math.max(0, s.totalCapacity - filled);
  });
  const nextSession = upcomingSessions[0] ?? null;

  return {
    tournaments: {
      live: liveTournament
        ? { name: liveTournament.name, slug: liveTournament.slug }
        : null,
      upcomingCount: sortedUpcoming.length,
      openSlots: openSlotsPer.reduce((sum, n) => sum + n, 0),
      next: nextTournament
        ? {
            name: nextTournament.name,
            slug: nextTournament.slug,
            date: new Date(nextTournament.date).toISOString(),
            openSlots: openSlotsPer[0],
            maxPods: nextTournament.maxPods,
          }
        : null,
    },
    pickup: {
      live: liveSession
        ? {
            title: liveSession.title,
            slug: liveSession.slug,
            status: liveSession.status as "attendance" | "active",
          }
        : null,
      upcomingCount: upcomingSessions.length,
      openSpots: openSpotsPer.reduce((sum, n) => sum + n, 0),
      next: nextSession
        ? {
            title: nextSession.title,
            slug: nextSession.slug,
            date: new Date(nextSession.date).toISOString(),
            startTime: nextSession.startTime,
            openSpots: openSpotsPer[0],
            totalCapacity: nextSession.totalCapacity,
          }
        : null,
    },
  };
}

const FEATURES = [
  {
    icon: Zap,
    title: "Everything live",
    text: "Scores, standings, and brackets update in real time — follow along from the bench or the bleachers.",
  },
  {
    icon: CalendarCheck,
    title: "Sign up in seconds",
    text: "One tap with Google. Grab a team slot in a tournament or claim your position for pickup night.",
  },
  {
    icon: Shuffle,
    title: "Fair, fast games",
    text: "Pickup lineups are auto-balanced by position, and tournament brackets seed themselves from pool play.",
  },
];

export default async function Home() {
  const stats = await getHomeStats();

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      <main className="flex-1">
        <HomeHero stats={stats} />

        {/* Portal cards overlap the hero bottom */}
        <section className="container mx-auto px-4">
          <div className="relative z-10 -mt-24 md:-mt-28">
            <HomePortalCards stats={stats} />
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 md:py-24">
          <RevealSection>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold md:text-4xl">
                Game day, handled
              </h2>
              <p className="text-muted-foreground mt-3 text-lg">
                From sign-up to championship point, the boring parts run
                themselves.
              </p>
            </div>
          </RevealSection>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <RevealSection key={feature.title} delay={i * 0.12}>
                  <div className="text-center md:text-left">
                    <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg md:mx-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-2 font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.text}
                    </p>
                  </div>
                </RevealSection>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

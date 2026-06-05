import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTournamentBySlug, isAdminUser } from "@/lib/db/queries";
import { TournamentProvider } from "@/contexts/tournament-context";
import { createClient } from "@/lib/auth/server";

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tournament = await getTournamentBySlug(slug);

  if (!tournament || tournament.isTest) {
    return { title: "Tournament Not Found" };
  }

  const dateStr = new Date(tournament.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const detailParts = [dateStr];
  if (tournament.startTime) detailParts.push(formatTime(tournament.startTime));
  if (tournament.location) detailParts.push(tournament.location);

  const title = `${tournament.name} · Volleyball Tournament`;
  const description = `${detailParts.join(" · ")}. ${
    tournament.description?.trim() || "You're invited — register to play."
  }`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      url: `/tournaments/${tournament.slug}`,
      siteName: "Hewwo Pwincess",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function TournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await getTournamentBySlug(slug);

  if (!tournament) {
    notFound();
  }

  // Get current user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Test tournaments are only visible to admins
  if (tournament.isTest) {
    const admin = user ? await isAdminUser(user.id) : false;
    if (!admin) {
      notFound();
    }
  }

  return (
    <TournamentProvider tournament={tournament} userId={user?.id}>
      {children}
    </TournamentProvider>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPickupSessionBySlug } from "@/lib/db/pickup-queries";
import { PickupProvider } from "@/contexts/pickup-context";
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
  const session = await getPickupSessionBySlug(slug);

  if (!session) {
    return { title: "Pickup Session Not Found" };
  }

  const dateStr = new Date(session.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const detailParts = [dateStr];
  if (session.startTime) detailParts.push(formatTime(session.startTime));
  if (session.location) detailParts.push(session.location);

  const title = `${session.title} · Pickup Volleyball`;
  const description = `${detailParts.join(" · ")}. ${
    session.description?.trim() || "You're invited — sign up to play."
  }`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      url: `/pickup/${session.slug}`,
      siteName: "Hewwo Pwincess",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PickupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getPickupSessionBySlug(slug);

  if (!session) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PickupProvider session={session} userId={user?.id}>
      {children}
    </PickupProvider>
  );
}

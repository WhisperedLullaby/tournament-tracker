import Link from "next/link";
import { Button } from "@/components/ui/button";

interface TournamentCTASectionProps {
  tournamentSlug: string;
  tournamentStatus: "upcoming" | "active" | "completed";
  userRole?: "organizer" | "participant" | null;
}

export function TournamentCTASection({
  tournamentSlug,
  tournamentStatus,
  userRole,
}: TournamentCTASectionProps) {
  const getCtaContent = () => {
    if (tournamentStatus === "upcoming" && !userRole) {
      return {
        title: "Ready to Compete?",
        description:
          "Grab your partner and register your pod for an unforgettable day of volleyball!",
        buttonText: "Register Now",
        buttonHref: `/tournaments/${tournamentSlug}/register`,
      };
    }

    if (tournamentStatus === "active") {
      return {
        title: "Tournament In Progress!",
        description:
          "Follow the action live. Check standings, schedule, and bracket updates in real-time.",
        buttonText: "View Live Standings",
        buttonHref: `/tournaments/${tournamentSlug}/standings`,
      };
    }

    if (tournamentStatus === "completed") {
      return {
        title: "Tournament Complete!",
        description:
          "Relive the action and see the final standings and bracket results.",
        buttonText: "View Final Results",
        buttonHref: `/tournaments/${tournamentSlug}/standings`,
      };
    }

    // Already registered
    return {
      title: "You're Registered!",
      description:
        "Get ready to compete! Check the schedule and standings to prepare for tournament day.",
      buttonText: "View Schedule",
      buttonHref: `/tournaments/${tournamentSlug}/schedule`,
    };
  };

  const cta = getCtaContent();

  return (
    <section className="bg-accent text-accent-foreground py-16 md:py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="mb-4 text-3xl font-bold sm:text-4xl">{cta.title}</h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg">{cta.description}</p>
        <Button asChild size="lg" variant="secondary">
          <Link href={cta.buttonHref}>{cta.buttonText}</Link>
        </Button>
      </div>
    </section>
  );
}

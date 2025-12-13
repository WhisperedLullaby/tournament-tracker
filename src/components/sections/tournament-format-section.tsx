import { Card, CardContent } from "@/components/ui/card";
import volleyballImage from "@/app/assets/images/image.jpg";
import { getTemplateForType, type TournamentType } from "@/lib/tournament-templates";

interface TournamentFormatSectionProps {
  poolPlayDescription?: string | null;
  bracketPlayDescription?: string | null;
  tournamentType?: "pod_2" | "pod_3" | "set_teams";
}

export function TournamentFormatSection({
  poolPlayDescription,
  bracketPlayDescription,
  tournamentType = "pod_2",
}: TournamentFormatSectionProps) {
  // Get template for fallback content
  const template = getTemplateForType(tournamentType as TournamentType);

  // Helper to render content with line breaks preserved
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      return <p key={i} className="text-sm">{line}</p>;
    });
  };

  return (
    <section className="bg-muted/40 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto">
          <h2 className="from-primary via-accent to-primary mb-12 bg-gradient-to-r bg-clip-text text-5xl font-bold text-transparent md:text-8xl">
            Tournament Format
          </h2>

          {/* Pool Play Row */}
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-3">
            <div className="flex flex-col justify-center">
              <h2 className="text-4xl font-bold">Pool Play (4 Rounds)</h2>
              <h3 className="text-muted-foreground text-xl">
                Mixed pods compete for seeding
              </h3>
            </div>
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div className="prose prose-sm max-w-none">
                  {renderContent(poolPlayDescription || template.poolPlay)}
                </div>
              </CardContent>
            </Card>
            <Card className="relative min-h-[200px] overflow-hidden">
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor:
                    "color-mix(in oklab, var(--muted) 40%, transparent)",
                  backgroundImage: `url(${volleyballImage.src})`,
                  backgroundSize: "259%",
                  backgroundPosition: "calc(100% + 110px) -86px",
                  backgroundBlendMode: "overlay",
                }}
              />
            </Card>
          </div>

          {/* Bracket Play Row */}
          <div className="mx-auto mt-12 grid max-w-6xl gap-12 md:grid-cols-3">
            <Card className="relative hidden min-h-[200px] overflow-hidden md:block">
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor:
                    "color-mix(in oklab, var(--muted) 40%, transparent)",
                  backgroundImage: `url(${volleyballImage.src})`,
                  backgroundSize: "259%",
                  backgroundPosition: "0 -291px",
                  backgroundBlendMode: "overlay",
                }}
              />
            </Card>
            <div className="flex flex-col justify-center text-right">
              <h2 className="text-4xl font-bold">Bracket Play</h2>
              <h3 className="text-muted-foreground text-xl">
                Double elimination showdown
              </h3>
            </div>
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div className="prose prose-sm max-w-none">
                  {renderContent(bracketPlayDescription || template.bracketPlay)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

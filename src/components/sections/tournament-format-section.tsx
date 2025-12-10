import { Card, CardContent } from "@/components/ui/card";
import volleyballImage from "@/app/assets/images/image.jpg";

export function TournamentFormatSection() {
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
                <div>
                  <p className="font-medium">9 Pods of 2 Players</p>
                  <p className="text-muted-foreground text-sm">
                    18 total players divided into partnerships
                  </p>
                </div>
                <div>
                  <p className="font-medium">6v6 Matches</p>
                  <p className="text-muted-foreground text-sm">
                    3 pods per side, 3 pods rest each round
                  </p>
                </div>
                <div>
                  <p className="font-medium">Seeding by Point Differential</p>
                  <p className="text-muted-foreground text-sm">
                    Pods ranked 1-9 after pool play
                  </p>
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
                <div>
                  <p className="font-medium">3 Teams of 6 Players</p>
                  <p className="text-muted-foreground text-sm">
                    Seeds 1+5+9, 2+6+7, 3+4+8
                  </p>
                </div>
                <div>
                  <p className="font-medium">Balanced Team Formation</p>
                  <p className="text-muted-foreground text-sm">
                    Top, middle, and bottom seeds combined
                  </p>
                </div>
                <div>
                  <p className="font-medium">Double Elimination</p>
                  <p className="text-muted-foreground text-sm">
                    Everyone must lose twice to be eliminated
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

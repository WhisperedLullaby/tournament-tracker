"use client";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { HeroGeometric } from "@/components/hero-geometric";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy } from "lucide-react";

type PodData = {
  podId: number;
  teamName: string | null;
  playerNames: string;
  player1: string;
  player2: string;
};

interface TeamsPageClientProps {
  podData: PodData[];
}

export function TeamsPageClient({ podData }: TeamsPageClientProps) {
  return (
    <>
      <Navigation />
      <div className="min-h-screen">
        {/* Hero Section */}
        <HeroGeometric
          badge="REGISTERED PODS"
          title1="Tournament"
          title2="Teams"
          description="Meet the pods competing in the tournament. Each pod consists of two players working together."
          className="mb-12"
        />

        <div className="container mx-auto space-y-8 px-4 pb-16">
          {/* Stats Card */}
          <Card className="border-primary/20 border-2">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-full p-3">
                  <Users className="text-primary h-6 w-6" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    Total Registered
                  </p>
                  <p className="text-2xl font-bold">{podData.length} Pods</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-accent/10 rounded-full p-3">
                  <Trophy className="text-accent h-6 w-6" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Total Players</p>
                  <p className="text-2xl font-bold">{podData.length * 2}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pods Grid */}
          <div>
            <h2 className="mb-6 text-2xl font-bold">All Pods</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {podData.map((pod) => (
                <Card
                  key={pod.podId}
                  className="hover:border-primary/50 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">
                        {pod.teamName || pod.playerNames}
                      </span>
                      <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
                        Pod {pod.podId}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 h-2 w-2 rounded-full" />
                        <p className="text-sm">{pod.player1}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 h-2 w-2 rounded-full" />
                        <p className="text-sm">{pod.player2}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

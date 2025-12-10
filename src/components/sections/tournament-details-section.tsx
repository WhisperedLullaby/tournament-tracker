import { Calendar, MapPin, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TournamentDetailsSectionProps {
  date: Date;
  location?: string | null;
  maxPods: number;
  registrationDeadline?: Date | null;
}

export function TournamentDetailsSection({
  date,
  location,
}: TournamentDetailsSectionProps) {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="from-primary via-accent to-primary mb-12 bg-gradient-to-r bg-clip-text text-5xl font-bold text-transparent md:text-8xl">
          Tournament Details
        </h2>

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Date & Time Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="text-accent h-5 w-5" />
                Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">
                {new Date(date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-muted-foreground">10:00 AM - 2:00 PM</p>
              <p className="text-muted-foreground text-sm">6 sets minimum.</p>
            </CardContent>
          </Card>

          {/* Location Card */}
          {location && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="text-accent h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">All American FieldHouse</p>
                <p className="text-muted-foreground text-sm">Champions Court</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-block text-sm underline-offset-4 hover:underline"
                >
                  {location}
                </a>
                <p className="text-muted-foreground text-sm">
                  Click address for directions
                </p>
              </CardContent>
            </Card>
          )}

          {/* Prize Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="text-accent h-5 w-5" />
                Winner Takes All
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">$20 Registration Fee</p>
              <p className="text-muted-foreground">
                Winning team gets their registration fee back!
              </p>
              <p className="text-muted-foreground text-sm">
                Play for free and bragging rights
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

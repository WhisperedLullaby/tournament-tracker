import { Calendar, MapPin, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

interface TournamentDetailsSectionProps {
  date: Date;
  location?: string | null;
  maxPods: number;
  registrationOpenDate?: Date | null;
  registrationDeadline?: Date | null;
  prizeInfo?: string | null;
  startTime?: string | null;
  estimatedEndTime?: string | null;
}

export function TournamentDetailsSection({
  date,
  location,
  prizeInfo,
  registrationOpenDate,
  registrationDeadline,
  startTime,
  estimatedEndTime,
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
            <CardContent className="space-y-3">
              {/* Registration window */}
              {(registrationOpenDate || registrationDeadline) && (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Registration</p>
                  {registrationOpenDate && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Opens:</span>{" "}
                      {formatDate(registrationOpenDate)}
                    </p>
                  )}
                  {registrationDeadline && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Closes:</span>{" "}
                      {formatDate(registrationDeadline)}
                    </p>
                  )}
                </div>
              )}

              {/* Tournament day */}
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Tournament Day</p>
                <p className="font-medium">{formatDate(date)}</p>
                {(startTime || estimatedEndTime) && (
                  <p className="text-muted-foreground text-sm">
                    {startTime ? formatTime(startTime) : ""}
                    {startTime && estimatedEndTime ? " – " : ""}
                    {estimatedEndTime ? formatTime(estimatedEndTime) : ""}
                  </p>
                )}
              </div>
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
                Prizes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {prizeInfo ? (
                <div className="prose prose-sm max-w-none">
                  {prizeInfo.split('\n').map((line, i) => {
                    // Check if line starts with ** for bold formatting
                    if (line.startsWith('**') && line.includes('**', 2)) {
                      const match = line.match(/\*\*(.+?)\*\*/);
                      if (match) {
                        return <p key={i} className="font-semibold">{match[1]}</p>;
                      }
                    }
                    // Regular line
                    return line.trim() ? <p key={i}>{line}</p> : <br key={i} />;
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No prize information available.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

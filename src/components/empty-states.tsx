import Link from 'next/link';
import {
  Users,
  Calendar,
  Trophy,
  Gamepad2,
  UserPlus,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
}

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <Card className="text-center">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {(action || secondaryAction) && (
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {action && (
            <Button asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          )}
          {secondaryAction && (
            <Button asChild variant="outline">
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

// Specific empty state components

export function NoPodsRegistered({ tournamentSlug }: { tournamentSlug: string }) {
  return (
    <EmptyState
      icon={Users}
      title="No teams registered yet"
      description="Be the first to register for this tournament! Gather your teammate and sign up to secure your spot."
      action={{
        label: 'Register now',
        href: `/tournaments/${tournamentSlug}/register`,
      }}
      secondaryAction={{
        label: 'Tournament details',
        href: `/tournaments/${tournamentSlug}`,
      }}
    />
  );
}

export function NoPodsRegisteredAdmin({
  tournamentSlug,
}: {
  tournamentSlug: string;
}) {
  return (
    <EmptyState
      icon={UserPlus}
      title="No teams registered yet"
      description="Your tournament is ready! Share the registration link with players to start building your participant list."
      action={{
        label: 'Share tournament',
        href: `/tournaments/${tournamentSlug}`,
      }}
      secondaryAction={{
        label: 'Tournament settings',
        href: `/tournaments/${tournamentSlug}/settings`,
      }}
    />
  );
}

export function NoMatchesScheduled() {
  return (
    <Card className="text-center">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle>No matches scheduled</CardTitle>
        <CardDescription>
          Matches will appear here once the tournament begins and games are
          scheduled.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export function NoCurrentGame() {
  return (
    <Card className="text-center">
      <CardContent className="py-12">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Gamepad2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold">No game in progress</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Check back soon or view the schedule for upcoming matches
        </p>
      </CardContent>
    </Card>
  );
}

export function NoUpcomingGames() {
  return (
    <Card className="text-center">
      <CardContent className="py-12">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Calendar className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold">No upcoming games</h3>
        <p className="text-sm text-muted-foreground mt-1">
          All matches have been completed or none are scheduled yet
        </p>
      </CardContent>
    </Card>
  );
}

export function NoCompletedMatches() {
  return (
    <Card className="text-center">
      <CardContent className="py-12">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Trophy className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold">No completed matches yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Match results will appear here once games are finished
        </p>
      </CardContent>
    </Card>
  );
}

export function NoStandingsData() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No standings available"
      description="Standings will be calculated once matches are completed. Check back after the first games are played."
    />
  );
}

export function NoTournamentsFound() {
  return (
    <EmptyState
      icon={Trophy}
      title="No tournaments found"
      description="There are no tournaments matching your criteria. Try adjusting your filters or check back later for new tournaments."
      action={{
        label: 'Browse all tournaments',
        href: '/tournaments',
      }}
    />
  );
}

export function NoUserTournaments() {
  return (
    <EmptyState
      icon={Trophy}
      title="No tournaments yet"
      description="You haven't registered for any tournaments. Browse available tournaments and join the competition!"
      action={{
        label: 'Browse tournaments',
        href: '/tournaments',
      }}
    />
  );
}

export function BracketNotReady() {
  return (
    <Card className="text-center">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Trophy className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle>Bracket not available</CardTitle>
        <CardDescription>
          The bracket will be generated once pool play is complete. Check the
          standings to see current rankings.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-center">
        <Button asChild variant="outline">
          <Link href="./standings">View standings</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

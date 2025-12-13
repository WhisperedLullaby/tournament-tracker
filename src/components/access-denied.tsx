import Link from 'next/link';
import { ShieldAlert, Lock, UserX, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type AccessDeniedReason =
  | 'not_authenticated'
  | 'not_organizer'
  | 'not_whitelisted'
  | 'tournament_full'
  | 'already_registered'
  | 'registration_closed';

interface AccessDeniedProps {
  reason?: AccessDeniedReason;
  message?: string;
  tournamentSlug?: string;
  showActions?: boolean;
}

export function AccessDenied({
  reason = 'not_authenticated',
  message,
  tournamentSlug,
  showActions = true,
}: AccessDeniedProps) {
  const config = {
    not_authenticated: {
      icon: Lock,
      title: 'Authentication Required',
      description:
        'You need to sign in to access this page. Please sign in with your Google account to continue.',
      defaultMessage: 'Sign in to access this content',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    not_organizer: {
      icon: Crown,
      title: 'Organizer Access Only',
      description:
        'This page is restricted to tournament organizers. Only the tournament creator can access this area.',
      defaultMessage: 'You do not have permission to access this page',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    not_whitelisted: {
      icon: ShieldAlert,
      title: 'Organizer Approval Required',
      description:
        'Creating tournaments requires organizer approval. If you believe you should have access, please contact an administrator.',
      defaultMessage: 'You are not authorized to create tournaments',
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    tournament_full: {
      icon: UserX,
      title: 'Tournament Full',
      description:
        'This tournament has reached maximum capacity. Registration is now closed.',
      defaultMessage: 'Maximum number of teams reached',
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    already_registered: {
      icon: ShieldAlert,
      title: 'Already Registered',
      description:
        'You have already registered for this tournament. Check your dashboard to view your registration details.',
      defaultMessage: 'You are already registered for this tournament',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    registration_closed: {
      icon: Lock,
      title: 'Registration Closed',
      description:
        'Registration for this tournament is currently closed. Check back later or browse other tournaments.',
      defaultMessage: 'Registration is not currently open',
      iconColor: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  };

  const {
    icon: Icon,
    title,
    description,
    defaultMessage,
    iconColor,
    bgColor,
  } = config[reason];

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${bgColor}`}
          >
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{message || defaultMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
        {showActions && (
          <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {reason === 'not_authenticated' && (
              <>
                <Button asChild>
                  <Link href="/api/auth/signin">Sign in</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/tournaments">Browse tournaments</Link>
                </Button>
              </>
            )}

            {reason === 'not_organizer' && tournamentSlug && (
              <>
                <Button asChild>
                  <Link href={`/tournaments/${tournamentSlug}`}>
                    Tournament details
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/tournaments">All tournaments</Link>
                </Button>
              </>
            )}

            {reason === 'not_whitelisted' && (
              <>
                <Button asChild variant="outline">
                  <Link href="/tournaments">Browse tournaments</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard">My dashboard</Link>
                </Button>
              </>
            )}

            {reason === 'tournament_full' && tournamentSlug && (
              <>
                <Button asChild>
                  <Link href={`/tournaments/${tournamentSlug}`}>
                    View tournament
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/tournaments">Find other tournaments</Link>
                </Button>
              </>
            )}

            {reason === 'already_registered' && (
              <>
                <Button asChild>
                  <Link href="/dashboard">View my tournaments</Link>
                </Button>
                <Button asChild variant="outline">
                  {tournamentSlug ? (
                    <Link href={`/tournaments/${tournamentSlug}`}>
                      Tournament details
                    </Link>
                  ) : (
                    <Link href="/tournaments">Browse tournaments</Link>
                  )}
                </Button>
              </>
            )}

            {reason === 'registration_closed' && tournamentSlug && (
              <>
                <Button asChild>
                  <Link href={`/tournaments/${tournamentSlug}`}>
                    View tournament
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/tournaments">Browse tournaments</Link>
                </Button>
              </>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

// Convenience components for specific use cases
export function NotAuthenticatedError() {
  return <AccessDenied reason="not_authenticated" />;
}

export function NotOrganizerError({ tournamentSlug }: { tournamentSlug?: string }) {
  return (
    <AccessDenied reason="not_organizer" tournamentSlug={tournamentSlug} />
  );
}

export function NotWhitelistedError() {
  return <AccessDenied reason="not_whitelisted" />;
}

export function TournamentFullError({ tournamentSlug }: { tournamentSlug?: string }) {
  return (
    <AccessDenied reason="tournament_full" tournamentSlug={tournamentSlug} />
  );
}

export function AlreadyRegisteredError({
  tournamentSlug,
}: {
  tournamentSlug?: string;
}) {
  return (
    <AccessDenied reason="already_registered" tournamentSlug={tournamentSlug} />
  );
}

export function RegistrationClosedError({
  tournamentSlug,
}: {
  tournamentSlug?: string;
}) {
  return (
    <AccessDenied reason="registration_closed" tournamentSlug={tournamentSlug} />
  );
}

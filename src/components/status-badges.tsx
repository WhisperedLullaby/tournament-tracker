import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type TournamentStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';
type MatchStatus = 'pending' | 'in_progress' | 'completed';
type RegistrationStatus = 'open' | 'closed' | 'full' | 'deadline_approaching';

interface TournamentStatusBadgeProps {
  status: TournamentStatus;
  className?: string;
}

export function TournamentStatusBadge({
  status,
  className,
}: TournamentStatusBadgeProps) {
  const config = {
    upcoming: {
      label: 'Upcoming',
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      icon: '📅',
    },
    active: {
      label: 'In Progress',
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
      icon: '⚡',
    },
    completed: {
      label: 'Completed',
      className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      icon: '✅',
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
      icon: '❌',
    },
  };

  const { label, className: badgeClassName, icon } = config[status];

  return (
    <Badge variant="secondary" className={cn(badgeClassName, className)}>
      <span className="mr-1">{icon}</span>
      {label}
    </Badge>
  );
}

interface MatchStatusBadgeProps {
  status: MatchStatus;
  className?: string;
  showIcon?: boolean;
}

export function MatchStatusBadge({
  status,
  className,
  showIcon = true,
}: MatchStatusBadgeProps) {
  const config = {
    pending: {
      label: 'Upcoming',
      className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      icon: '⏳',
    },
    in_progress: {
      label: 'Live',
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 animate-pulse',
      icon: '🔴',
    },
    completed: {
      label: 'Final',
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
      icon: '✓',
    },
  };

  const { label, className: badgeClassName, icon } = config[status];

  return (
    <Badge variant="secondary" className={cn(badgeClassName, className)}>
      {showIcon && <span className="mr-1">{icon}</span>}
      {label}
    </Badge>
  );
}

interface RegistrationStatusBadgeProps {
  status: RegistrationStatus;
  currentCount?: number;
  maxCount?: number;
  className?: string;
}

export function RegistrationStatusBadge({
  status,
  currentCount,
  maxCount,
  className,
}: RegistrationStatusBadgeProps) {
  const config = {
    open: {
      label: 'Registration Open',
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
      icon: '🟢',
    },
    closed: {
      label: 'Registration Closed',
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
      icon: '🔴',
    },
    full: {
      label: 'Full',
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
      icon: '🚫',
    },
    deadline_approaching: {
      label: 'Deadline Approaching',
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      icon: '⚠️',
    },
  };

  const { label, className: badgeClassName, icon } = config[status];

  return (
    <Badge variant="secondary" className={cn(badgeClassName, className)}>
      <span className="mr-1">{icon}</span>
      {label}
      {currentCount !== undefined && maxCount !== undefined && (
        <span className="ml-1 font-mono">
          ({currentCount}/{maxCount})
        </span>
      )}
    </Badge>
  );
}

interface PhaseStatusBadgeProps {
  phase: 'pool' | 'bracket' | 'finals';
  className?: string;
}

export function PhaseStatusBadge({ phase, className }: PhaseStatusBadgeProps) {
  const config = {
    pool: {
      label: 'Pool Play',
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    },
    bracket: {
      label: 'Bracket Play',
      className: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    },
    finals: {
      label: 'Finals',
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    },
  };

  const { label, className: badgeClassName } = config[phase];

  return (
    <Badge variant="secondary" className={cn(badgeClassName, className)}>
      {label}
    </Badge>
  );
}

interface RoleBadgeProps {
  role: 'organizer' | 'participant';
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = {
    organizer: {
      label: 'Organizer',
      className: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
      icon: '👑',
    },
    participant: {
      label: 'Participant',
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      icon: '🎮',
    },
  };

  const { label, className: badgeClassName, icon } = config[role];

  return (
    <Badge variant="secondary" className={cn(badgeClassName, className)}>
      <span className="mr-1">{icon}</span>
      {label}
    </Badge>
  );
}

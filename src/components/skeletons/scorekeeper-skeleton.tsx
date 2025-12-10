import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ScorekeeperSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4">
      {/* Match info header */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mx-auto" />
        </CardHeader>
      </Card>

      {/* Score panels */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Team A */}
        <Card>
          <CardHeader className="text-center space-y-3">
            <Skeleton className="h-8 w-32 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <div className="flex gap-2 justify-center">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Team B */}
        <Card>
          <CardHeader className="text-center space-y-3">
            <Skeleton className="h-8 w-32 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <div className="flex gap-2 justify-center">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-4">
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-12 w-32" />
      </div>
    </div>
  );
}

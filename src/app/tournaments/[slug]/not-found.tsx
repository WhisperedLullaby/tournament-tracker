import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function TournamentNotFound() {
  return (
    <div className="flex min-h-[500px] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Trophy className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Tournament not found</CardTitle>
          <CardDescription>
            This tournament doesn&apos;t exist or may have been removed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The tournament you&apos;re looking for might have been deleted, or the URL might be incorrect.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-2">
          <Button asChild>
            <Link href="/tournaments">Browse all tournaments</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">My tournaments</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

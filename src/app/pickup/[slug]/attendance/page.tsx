"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePickup } from "@/contexts/pickup-context";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { AttendanceChecklist } from "@/components/pickup/attendance-checklist";
import type { PickupRegistration } from "@/lib/db/schema";
import { ClipboardCheck } from "lucide-react";

export default function AttendancePage() {
  const { session, isOrganizer, isLoading } = usePickup();
  const router = useRouter();
  const [registrations, setRegistrations] = useState<PickupRegistration[]>([]);
  const [regsLoading, setRegsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isOrganizer) {
      router.replace(`/pickup/${session.slug}`);
    }
  }, [isLoading, isOrganizer, session.slug, router]);

  useEffect(() => {
    fetch(`/api/pickup/${session.id}/registrations`)
      .then((r) => r.json())
      .then((d) => setRegistrations(d.registrations ?? []))
      .finally(() => setRegsLoading(false));
  }, [session.id]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      <div className="from-primary/10 via-background to-accent/10 border-b bg-gradient-to-br">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Attendance</h1>
              <p className="text-sm text-muted-foreground">{session.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        {isLoading || regsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <AttendanceChecklist
            sessionId={session.id}
            slug={session.slug}
            registrations={registrations}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}

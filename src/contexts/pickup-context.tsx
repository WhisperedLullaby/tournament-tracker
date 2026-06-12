"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { PickupSession, PickupRegistration } from "@/lib/db/schema";

interface PickupContextType {
  session: PickupSession;
  isOrganizer: boolean;
  userRegistration: PickupRegistration | null;
  isLoading: boolean;
  refreshRegistration: () => Promise<void>;
}

const PickupContext = createContext<PickupContextType | undefined>(undefined);

export function PickupProvider({
  session,
  userId,
  children,
}: {
  session: PickupSession;
  userId?: string | null;
  children: React.ReactNode;
}) {
  const [userRegistration, setUserRegistration] =
    useState<PickupRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isOrganizer = !!userId && session.createdBy === userId;

  const refreshRegistration = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/pickup/${session.id}/registrations`);
      if (res.ok) {
        const data = await res.json();
        const mine = (data.registrations as PickupRegistration[]).find(
          (r) => r.userId === userId
        );
        setUserRegistration(mine ?? null);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [session.id, userId]);

  useEffect(() => {
    refreshRegistration();
  }, [refreshRegistration]);

  return (
    <PickupContext.Provider
      value={{ session, isOrganizer, userRegistration, isLoading, refreshRegistration }}
    >
      {children}
    </PickupContext.Provider>
  );
}

export function usePickup() {
  const context = useContext(PickupContext);
  if (!context) throw new Error("usePickup must be used within a PickupProvider");
  return context;
}

// For components (e.g. Navigation) that render both inside and outside pickup pages
export function usePickupOptional() {
  return useContext(PickupContext) ?? null;
}

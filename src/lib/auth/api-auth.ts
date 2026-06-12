import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/auth/server";
import { getUserTournamentRole } from "@/lib/db/queries";

/**
 * Auth guards for API routes.
 *
 * Usage:
 *   const auth = await requireUser();
 *   if ("response" in auth) return auth.response;
 *   // auth.user is the authenticated user
 *
 * Returns either `{ user }` or `{ response }` (a ready-to-return error). The
 * `"response" in auth` check narrows the union for the caller.
 */
export type AuthResult = { user: User } | { response: NextResponse };

/**
 * Require a signed-in user. Scorekeeping routes use this — any authenticated
 * user (organizer, volunteer, or player) may keep score, by design.
 */
export async function requireUser(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }
  return { user };
}

/**
 * Require a signed-in user who is an organizer of the given tournament. Used for
 * destructive setup/teardown (bracket initialize/reset) that scorekeepers must
 * not perform.
 */
export async function requireOrganizer(tournamentId: number): Promise<AuthResult> {
  const auth = await requireUser();
  if ("response" in auth) return auth;

  const role = await getUserTournamentRole(auth.user.id, tournamentId);
  if (role !== "organizer") {
    return {
      response: NextResponse.json(
        { error: "Organizer access required" },
        { status: 403 }
      ),
    };
  }
  return { user: auth.user };
}

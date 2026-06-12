import { z } from "zod";
import { NextResponse } from "next/server";

/** Body for routes that act on a tournament by id (game start, bracket init/reset). */
export const tournamentIdBody = z.object({
  tournamentId: z.number().int().positive(),
});

/** Body for score updates. */
export const scoreBody = z.object({
  teamAScore: z.number().int().min(0),
  teamBScore: z.number().int().min(0),
});

/** Body for pickup self-registration. */
export const pickupRegisterBody = z.object({
  displayName: z.string().trim().min(1).max(80),
  position: z.enum([
    "setter",
    "outside_hitter",
    "middle_blocker",
    "opposite",
    "libero",
    "defensive_specialist",
  ]),
});

/**
 * Parse and validate a request JSON body against a zod schema.
 *
 * Usage (mirrors requireUser):
 *   const parsed = await parseBody(request, scoreBody);
 *   if ("response" in parsed) return parsed.response;
 *   // parsed.data is typed
 *
 * Reads the body once — do not also call request.json() in the route.
 */
export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T> } | { response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      response: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      response: NextResponse.json(
        {
          error: "Invalid request body",
          details: result.error.issues.map((i) => i.message),
        },
        { status: 400 }
      ),
    };
  }

  return { data: result.data };
}

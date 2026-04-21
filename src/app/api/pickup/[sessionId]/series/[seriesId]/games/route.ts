import { NextRequest, NextResponse } from "next/server";
import { getPickupSessionById, getPickupGamesForSeries } from "@/lib/db/pickup-queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; seriesId: string }> }
) {
  const { sessionId: sStr, seriesId: srStr } = await params;
  const sessionId = parseInt(sStr, 10);
  const seriesId = parseInt(srStr, 10);
  if (isNaN(sessionId) || isNaN(seriesId))
    return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });

  const session = await getPickupSessionById(sessionId);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const games = await getPickupGamesForSeries(seriesId);
  return NextResponse.json({ games });
}

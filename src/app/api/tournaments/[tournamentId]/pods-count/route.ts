import { NextRequest, NextResponse } from "next/server";
import { getPodCount } from "@/lib/db/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const count = await getPodCount(parseInt(tournamentId));

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error getting pod count:", error);
    return NextResponse.json(
      { error: "Failed to get pod count" },
      { status: 500 }
    );
  }
}

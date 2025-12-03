import { NextResponse } from "next/server";
import { isRegistrationOpen, getPodCount } from "@/lib/db/queries";

export async function GET() {
  try {
    const open = await isRegistrationOpen();
    const count = await getPodCount();

    return NextResponse.json({
      isOpen: open,
      podCount: count,
      maxPods: 12,
    });
  } catch (error) {
    console.error("Error checking registration status:", error);
    return NextResponse.json(
      { error: "Failed to check registration status" },
      { status: 500 }
    );
  }
}

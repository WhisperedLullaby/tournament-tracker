import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { getUserPickupStats } from "@/lib/db/pickup-queries";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getUserPickupStats(user.id);
  return NextResponse.json(stats);
}

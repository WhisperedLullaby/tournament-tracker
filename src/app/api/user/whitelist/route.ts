import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { isWhitelistedOrganizer, isAdminUser } from "@/lib/db/queries";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ isWhitelisted: false, isAdmin: false });
  }

  const [whitelisted, admin] = await Promise.all([
    isWhitelistedOrganizer(user.id),
    isAdminUser(user.id),
  ]);

  return NextResponse.json({ isWhitelisted: whitelisted, isAdmin: admin });
}

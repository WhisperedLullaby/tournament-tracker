import { notFound } from "next/navigation";
import { getPickupSessionBySlug } from "@/lib/db/pickup-queries";
import { PickupProvider } from "@/contexts/pickup-context";
import { createClient } from "@/lib/auth/server";

export default async function PickupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getPickupSessionBySlug(slug);

  if (!session) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PickupProvider session={session} userId={user?.id}>
      {children}
    </PickupProvider>
  );
}

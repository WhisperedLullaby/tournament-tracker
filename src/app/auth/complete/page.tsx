"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthComplete() {
  const router = useRouter();

  useEffect(() => {
    const redirect = sessionStorage.getItem("auth_redirect") || "/tournaments";
    sessionStorage.removeItem("auth_redirect");
    router.refresh();
    router.replace(redirect);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}

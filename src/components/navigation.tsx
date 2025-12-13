"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, User, LogOut } from "lucide-react";
import { createClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<"organizer" | "participant" | null>(null);
  const pathname = usePathname();
  const supabase = createClient();

  // Extract tournament slug from pathname if on a tournament page
  const tournamentSlug = pathname?.match(/^\/tournaments\/([^/]+)/)?.[1];
  const isOnTournamentPage = !!tournamentSlug && tournamentSlug !== "create";

  useEffect(() => {
    // Check current auth state
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // Fetch user role for the current tournament if on tournament page
      if (session?.user && tournamentSlug && tournamentSlug !== "create") {
        try {
          const response = await fetch(`/api/tournaments/${tournamentSlug}/role`);
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, tournamentSlug]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
  };

  // Base navigation items
  const baseNavItems = [
    { label: "Home", href: "/" },
    { label: "Tournaments", href: "/tournaments" },
    { label: "Dashboard", href: "/dashboard" },
  ];

  // Tournament-specific navigation items
  const tournamentNavItems = isOnTournamentPage
    ? [
        { label: "Overview", href: `/tournaments/${tournamentSlug}` },
        { label: "Standings", href: `/tournaments/${tournamentSlug}/standings` },
        { label: "Schedule", href: `/tournaments/${tournamentSlug}/schedule` },
        { label: "Teams", href: `/tournaments/${tournamentSlug}/standings` }, // Teams shows standings
        ...(userRole === "organizer"
          ? [{ label: "Scorekeeper", href: `/tournaments/${tournamentSlug}/scorekeeper` }]
          : []),
      ]
    : [];

  const navItems = isOnTournamentPage ? tournamentNavItems : baseNavItems;

  return (
    <nav className="bg-card supports-backdrop-filter:bg-card/90 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo/Brand */}
        <Link href="/" className="text-primary text-xl font-bold">
          Hewwo Pwincess
        </Link>
        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <div className="flex items-center gap-3 border-l pl-6">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span className="text-muted-foreground max-w-[150px] truncate">
                  {user.email}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="h-8"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="text-foreground h-6 w-6" />
          ) : (
            <Menu className="text-foreground h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="border-t md:hidden">
          <div className="container mx-auto flex flex-col gap-4 px-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-foreground hover:text-primary text-sm font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <>
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span className="text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full justify-start"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

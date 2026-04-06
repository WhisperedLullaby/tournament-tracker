"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, User, LogOut, Plus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<"organizer" | "participant" | null>(null);
  const pathname = usePathname();
  const { user, isLoading, signIn, signOut } = useAuth();

  // Extract tournament slug from pathname if on a tournament page
  const tournamentSlug = pathname?.match(/^\/tournaments\/([^/]+)/)?.[1];
  const isOnTournamentPage = !!tournamentSlug && tournamentSlug !== "create";

  useEffect(() => {
    if (!user || !tournamentSlug || tournamentSlug === "create") return;

    const fetchRole = async () => {
      try {
        const response = await fetch(`/api/tournaments/${tournamentSlug}/role`);
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchRole();
  }, [user, tournamentSlug]);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const handleSignIn = () => {
    signIn(pathname ?? "/");
    setIsMenuOpen(false);
  };

  // Base navigation items
  const baseNavItems = [
    { label: "Home", href: "/" },
    { label: "Tournaments", href: "/tournaments" },
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
          {!isLoading && (
            <div className="flex items-center gap-3 border-l pl-6">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-muted-foreground max-w-[150px] truncate hover:text-primary">
                      {user.email}
                    </span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="h-8"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button variant="default" size="sm" onClick={handleSignIn}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              )}
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
            {!isLoading && (
              <div className="border-t pt-4 flex flex-col gap-3">
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      <span className="text-muted-foreground truncate">
                        {user.email}
                      </span>
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      My Profile
                    </Link>
                    {!isOnTournamentPage && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full justify-start"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Link href="/tournaments/create">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Tournament
                        </Link>
                      </Button>
                    )}
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
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSignIn}
                    className="w-full"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, User, LogOut, Plus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const drawerVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" as const, staggerChildren: 0.05, delayChildren: 0.05 },
  },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: "easeIn" as const } },
};

const navItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.18 } },
};

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const [userRole, setUserRole] = useState<"organizer" | "participant" | null>(null);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const pathname = usePathname();
  const { user, isLoading, signIn, signOut } = useAuth();

  // Extract tournament slug from pathname if on a tournament page
  const tournamentSlug = pathname?.match(/^\/tournaments\/([^/]+)/)?.[1];
  const isOnTournamentPage = !!tournamentSlug && tournamentSlug !== "create";

  // Extract pickup slug from pathname if on a pickup session page
  const pickupSlug = pathname?.match(/^\/pickup\/([^/]+)/)?.[1];
  const isOnPickupPage = !!pickupSlug && pickupSlug !== "create";

  useEffect(() => {
    if (!user) {
      setIsWhitelisted(false);
      return;
    }

    const fetchWhitelist = async () => {
      try {
        const response = await fetch("/api/user/whitelist");
        if (response.ok) {
          const data = await response.json();
          setIsWhitelisted(data.isWhitelisted);
        }
      } catch (error) {
        console.error("Error fetching whitelist status:", error);
      }
    };

    fetchWhitelist();
  }, [user]);

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
    { label: "Pickup", href: "/pickup" },
  ];

  // Tournament-specific navigation items
  const tournamentNavItems = isOnTournamentPage
    ? [
        { label: "Overview", href: `/tournaments/${tournamentSlug}` },
        { label: "Scoreboard", href: `/tournaments/${tournamentSlug}/scoreboard` },
        { label: "Standings", href: `/tournaments/${tournamentSlug}/standings` },
        { label: "Schedule", href: `/tournaments/${tournamentSlug}/schedule` },
        ...(userRole === "organizer"
          ? [{ label: "Scorekeeper", href: `/tournaments/${tournamentSlug}/scorekeeper` }]
          : []),
      ]
    : [];

  // Pickup-specific navigation items
  const pickupNavItems = isOnPickupPage
    ? [
        { label: "Session", href: `/pickup/${pickupSlug}` },
        { label: "Scoreboard", href: `/pickup/${pickupSlug}/scoreboard` },
        { label: "Lineups", href: `/pickup/${pickupSlug}/lineups` },
      ]
    : [];

  const navItems = isOnTournamentPage
    ? tournamentNavItems
    : isOnPickupPage
      ? pickupNavItems
      : baseNavItems;

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
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="border-t md:hidden"
            variants={shouldReduceMotion ? undefined : drawerVariants}
            initial={shouldReduceMotion ? { opacity: 1 } : "hidden"}
            animate={shouldReduceMotion ? { opacity: 1 } : "visible"}
            exit={shouldReduceMotion ? { opacity: 0 } : "exit"}
          >
            <div className="container mx-auto flex flex-col gap-4 px-4 py-4">
              {navItems.map((item) => (
                <motion.div key={item.href} variants={shouldReduceMotion ? undefined : navItemVariants}>
                  <Link
                    href={item.href}
                    className="text-foreground hover:text-primary text-sm font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              {!isLoading && (
                <motion.div
                  className="border-t pt-4 flex flex-col gap-3"
                  variants={shouldReduceMotion ? undefined : navItemVariants}
                >
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
                      {isWhitelisted && !isOnTournamentPage && !isOnPickupPage && (
                        <>
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
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="w-full justify-start"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Link href="/pickup/create">
                              <Plus className="mr-2 h-4 w-4" />
                              Create Pickup Session
                            </Link>
                          </Button>
                        </>
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
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

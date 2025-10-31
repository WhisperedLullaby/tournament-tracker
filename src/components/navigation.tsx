"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Standings", href: "/standings" },
    { label: "Schedule", href: "/schedule" },
    { label: "Scorekeeper", href: "/scorekeeper" },
    { label: "Teams", href: "/teams" },
  ];

  return (
    <nav className="bg-card supports-backdrop-filter:bg-card/90 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo/Brand */}
        <Link href="/" className="text-primary text-xl font-bold">
          Hewwo Pwincess
        </Link>{" "}
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
          </div>
        </div>
      )}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTournament } from "@/contexts/tournament-context";

export function TournamentNav() {
  const pathname = usePathname();
  const { tournament, isOrganizer, isLoading } = useTournament();

  if (isLoading) {
    return null;
  }

  const baseUrl = `/tournaments/${tournament.slug}`;

  const navItems = [
    { label: "Overview", href: baseUrl },
    { label: "Standings", href: `${baseUrl}/standings` },
    { label: "Schedule", href: `${baseUrl}/schedule` },
    ...(tournament.status !== "upcoming"
      ? [{ label: "Bracket", href: `${baseUrl}/bracket` }]
      : []),
    ...(tournament.status === "upcoming"
      ? [{ label: "Register", href: `${baseUrl}/register` }]
      : []),
  ];

  // Add organizer-only items
  if (isOrganizer) {
    navItems.push(
      { label: "Scorekeeper", href: `${baseUrl}/scorekeeper` },
      { label: "Settings", href: `${baseUrl}/settings` }
    );
  }

  const isActive = (href: string) => {
    if (href === baseUrl) {
      return pathname === baseUrl;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="border-t">
      <div className="container mx-auto px-4">
        <ul className="flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive(item.href)
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

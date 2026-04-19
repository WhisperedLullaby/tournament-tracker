"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  TournamentStatusBadge,
  RegistrationStatusBadge,
} from "@/components/status-badges";

interface TournamentCardData {
  tournament: {
    id: number;
    slug: string;
    name: string;
    status: string;
    date: string | Date;
    location: string | null;
    description: string | null;
    maxPods: number;
  };
  podCount: number;
}

interface TournamentCardGridProps {
  data: TournamentCardData[];
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function TournamentCardGrid({ data }: TournamentCardGridProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      variants={container}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
    >
      {data.map(({ tournament, podCount }) => (
        <motion.div
          key={tournament.id}
          variants={item}
          whileHover={
            shouldReduceMotion
              ? {}
              : {
                  y: -4,
                  boxShadow:
                    "0 10px 25px -5px rgba(0,0,0,0.12), 0 4px 6px -2px rgba(0,0,0,0.06)",
                }
          }
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Link
            href={`/tournaments/${tournament.slug}`}
            className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm h-full"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold">{tournament.name}</h2>
              <TournamentStatusBadge
                status={
                  tournament.status as "upcoming" | "active" | "completed"
                }
              />
            </div>

            <p className="text-sm text-gray-600 mb-2">
              {new Date(tournament.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: "UTC",
              })}
            </p>

            {tournament.location && (
              <p className="text-sm text-gray-500 mb-3">
                📍 {tournament.location}
              </p>
            )}

            {tournament.description && (
              <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                {tournament.description}
              </p>
            )}

            <div className="pt-3 border-t mt-3">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600">Teams Registered:</span>
                <span
                  className={`font-semibold ${
                    podCount >= tournament.maxPods
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {podCount}/{tournament.maxPods}
                </span>
              </div>
              {podCount >= tournament.maxPods && (
                <RegistrationStatusBadge status="full" />
              )}
              {podCount < tournament.maxPods &&
                tournament.status === "upcoming" && (
                  <RegistrationStatusBadge status="open" />
                )}
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}

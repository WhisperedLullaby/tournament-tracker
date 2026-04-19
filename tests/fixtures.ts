import { test as base } from "@playwright/test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

type TournamentState = {
  id: number;
  slug: string;
  name: string;
  date: string;
  registrationOpenDate: string;
  registrationDeadline: string;
  startTime: string;
  estimatedEndTime: string;
  location: string;
  prizeInfo: string;
};

type TestFixtures = {
  tournamentSlug: string;
  tournament: TournamentState | null;
};

function readState(): TournamentState | null {
  const stateFile = join(__dirname, ".test-state.json");
  if (existsSync(stateFile)) {
    return JSON.parse(readFileSync(stateFile, "utf-8"));
  }
  return null;
}

export const test = base.extend<TestFixtures>({
  tournament: async ({}, use) => {
    await use(readState());
  },

  tournamentSlug: async ({}, use) => {
    const state = readState();
    const slug = state?.slug ?? process.env.TEST_TOURNAMENT_SLUG ?? "";
    await use(slug);
  },
});

export { expect } from "@playwright/test";

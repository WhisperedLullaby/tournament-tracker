/**
 * List all pods in the database
 * Run with: npx tsx --env-file=.env.local src/lib/db/list-pods.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { pods } from "./schema";

async function listPods() {
  console.log("📋 Listing all registered pods...\n");

  try {
    const allPods = await db.select().from(pods).orderBy(pods.id);

    if (allPods.length === 0) {
      console.log("No pods found in database.");
    } else {
      allPods.forEach((pod) => {
        console.log(`Pod ${pod.id}:`);
        console.log(`  Team Name: ${pod.teamName || "(none)"}`);
        console.log(`  Players: ${pod.name}`);
        console.log(`  Player 1: ${pod.player1}`);
        console.log(`  Player 2: ${pod.player2}`);
        console.log(`  Email: ${pod.email}`);
        console.log("");
      });

      console.log(`Total pods: ${allPods.length}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error listing pods:", error);
    process.exit(1);
  }
}

listPods();

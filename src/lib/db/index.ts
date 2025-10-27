import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Create postgres connection
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Please add it to your .env.local file."
  );
}

// Disable prefetch as it's not supported by Supabase connection pooler
const client = postgres(connectionString, { prepare: false });

// Create Drizzle instance
export const db = drizzle(client, { schema });

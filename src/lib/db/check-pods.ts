import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./index";
import { sql } from "drizzle-orm";

type ColumnInfo = {
  column_name: string;
  data_type: string;
};

async function checkPods() {
  const cols = (await db.execute(sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'pods'
    ORDER BY ordinal_position
  `)) as ColumnInfo[];

  console.log("Pods table columns:");
  cols.forEach((c) =>
    console.log(`  - ${c.column_name} (${c.data_type})`)
  );

  process.exit(0);
}

checkPods();

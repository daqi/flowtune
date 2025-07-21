import "dotenv/config";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";

import * as schema from "./schema";

const sqlite = new Database(process.env.DATABASE_URL!);
export const db = drizzle({ client: sqlite, schema });

// Run migrations
export async function runMigrations() {
  await migrate(db, { migrationsFolder: "./drizzle" });
}

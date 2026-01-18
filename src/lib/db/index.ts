import path from "path";

// Determine which database to use based on environment
const hasPostgres = !!process.env.DATABASE_URL;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

if (hasPostgres) {
  // Production: Use PostgreSQL
  const { drizzle } = require("drizzle-orm/node-postgres");
  const { Pool } = require("pg");
  const schemaPg = require("./schema-pg");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

  db = drizzle(pool, { schema: schemaPg });
} else {
  // Development: Use SQLite
  const { drizzle } = require("drizzle-orm/better-sqlite3");
  const Database = require("better-sqlite3");
  const schemaSqlite = require("./schema");

  const dbPath = path.join(process.cwd(), "pennedworks.db");
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");

  db = drizzle(sqlite, { schema: schemaSqlite });
}

// Export the database instance
export { db };

// Re-export schema (types are compatible between SQLite and PostgreSQL)
export * from "./schema";

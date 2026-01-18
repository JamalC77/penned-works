import path from "path";

// Determine which database to use based on environment
// USE_POSTGRES=true forces PostgreSQL mode for production builds where DATABASE_URL is only available at runtime
const hasPostgres = !!process.env.DATABASE_URL || process.env.USE_POSTGRES === "true";

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

// Re-export the correct schema based on environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let schemaModule: any;
if (hasPostgres) {
  schemaModule = require("./schema-pg");
} else {
  schemaModule = require("./schema");
}

export const users = schemaModule.users;
export const projects = schemaModule.projects;
export const chapters = schemaModule.chapters;
export const versions = schemaModule.versions;
export const characters = schemaModule.characters;
export const characterRelationships = schemaModule.characterRelationships;
export const locations = schemaModule.locations;
export const timelineEvents = schemaModule.timelineEvents;
export const storyItems = schemaModule.storyItems;
export const plotThreads = schemaModule.plotThreads;
export const worldRules = schemaModule.worldRules;
export const consistencyFlags = schemaModule.consistencyFlags;

// Re-export types from SQLite schema (types are compatible)
export type {
  User,
  NewUser,
  Project,
  NewProject,
  Chapter,
  NewChapter,
  Version,
  NewVersion,
  Character,
  NewCharacter,
  CharacterRelationship,
  NewCharacterRelationship,
  Location,
  NewLocation,
  TimelineEvent,
  NewTimelineEvent,
  StoryItem,
  NewStoryItem,
  PlotThread,
  NewPlotThread,
  WorldRule,
  NewWorldRule,
  ConsistencyFlag,
  NewConsistencyFlag,
} from "./schema";

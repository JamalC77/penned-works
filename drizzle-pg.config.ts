import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for PostgreSQL migrations");
}

export default defineConfig({
  schema: "./src/lib/db/schema-pg.ts",
  out: "./drizzle-pg",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

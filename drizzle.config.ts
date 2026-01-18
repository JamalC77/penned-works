import { defineConfig } from "drizzle-kit";

const isPostgres = !!process.env.DATABASE_URL;

export default defineConfig(
  isPostgres
    ? {
        schema: "./src/lib/db/schema-pg.ts",
        out: "./drizzle-pg",
        dialect: "postgresql",
        dbCredentials: {
          url: process.env.DATABASE_URL!,
        },
      }
    : {
        schema: "./src/lib/db/schema.ts",
        out: "./drizzle",
        dialect: "sqlite",
        dbCredentials: {
          url: "./pennedworks.db",
        },
      }
);

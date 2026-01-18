import fs from "fs";
import path from "path";

// Load env file manually for local development
// This is a workaround for Next.js 16 not loading .env.local properly in some cases
// In production (Railway), env vars are loaded automatically
export function ensureEnvLoaded() {
  // Skip if we're in production or DATABASE_URL is set (Railway)
  if (process.env.NODE_ENV === "production" || process.env.DATABASE_URL) {
    return;
  }

  // Skip if ANTHROPIC_API_KEY is already set
  if (process.env.ANTHROPIC_API_KEY) {
    return;
  }

  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          process.env[key] = valueParts.join("=");
        }
      }
    }
  }
}

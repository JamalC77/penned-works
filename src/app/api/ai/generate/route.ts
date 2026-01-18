import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Load env file manually
function loadEnv() {
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

loadEnv();

import { generateFromDescription } from "@/lib/ai/claude";

export async function POST(request: NextRequest) {
  try {
    // Check for API key first
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured. Add it to .env.local" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { description, context, styleReference } = body;

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const content = await generateFromDescription(
      description,
      context || "",
      styleReference
    );

    return NextResponse.json({ content });
  } catch (error) {
    console.error("AI generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate: ${message}` },
      { status: 500 }
    );
  }
}

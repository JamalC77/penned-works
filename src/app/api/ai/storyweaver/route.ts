import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Load env file manually (Next.js 16 workaround)
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

import { continueStory } from "@/lib/ai/claude";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyContext, lastAction, authorChoice } = body;

    if (!storyContext && !authorChoice) {
      return NextResponse.json(
        { error: "Story context or author choice is required" },
        { status: 400 }
      );
    }

    const result = await continueStory(
      storyContext || "",
      lastAction || "",
      authorChoice
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Story weaver error:", error);
    return NextResponse.json(
      { error: "Failed to continue story" },
      { status: 500 }
    );
  }
}

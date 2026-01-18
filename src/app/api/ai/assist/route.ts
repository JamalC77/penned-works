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

import { quickAssist } from "@/lib/ai/claude";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, assistType } = body;

    if (!text || !assistType) {
      return NextResponse.json(
        { error: "Text and assist type are required" },
        { status: 400 }
      );
    }

    if (!["grammar", "clarity", "stronger", "shorter"].includes(assistType)) {
      return NextResponse.json(
        { error: "Invalid assist type" },
        { status: 400 }
      );
    }

    const result = await quickAssist(text, assistType);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Quick assist error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

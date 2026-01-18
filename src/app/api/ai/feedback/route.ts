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

import { getWritingFeedback } from "@/lib/ai/claude";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { selectedText, fullContext, question } = body;

    if (!selectedText || !question) {
      return NextResponse.json(
        { error: "Selected text and question are required" },
        { status: 400 }
      );
    }

    const feedback = await getWritingFeedback(
      selectedText,
      fullContext || "",
      question
    );

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("AI feedback error:", error);
    return NextResponse.json(
      { error: "Failed to generate feedback" },
      { status: 500 }
    );
  }
}

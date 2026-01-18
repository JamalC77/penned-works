import { NextRequest, NextResponse } from "next/server";
import { ensureEnvLoaded } from "@/lib/env";

ensureEnvLoaded();

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

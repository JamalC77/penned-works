import { NextRequest, NextResponse } from "next/server";
import { ensureEnvLoaded } from "@/lib/env";

ensureEnvLoaded();

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

import { NextRequest, NextResponse } from "next/server";
import { ensureEnvLoaded } from "@/lib/env";

ensureEnvLoaded();

import { generateFromDescription } from "@/lib/ai/claude";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
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

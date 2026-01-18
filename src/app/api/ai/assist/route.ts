import { NextRequest, NextResponse } from "next/server";
import { ensureEnvLoaded } from "@/lib/env";

ensureEnvLoaded();

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

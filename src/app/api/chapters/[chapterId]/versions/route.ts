import { NextRequest, NextResponse } from "next/server";
import { db, versions } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

type Params = Promise<{ chapterId: string }>;

// GET all versions for a chapter
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { chapterId } = await params;

    const chapterVersions = await db
      .select()
      .from(versions)
      .where(eq(versions.chapterId, chapterId))
      .orderBy(desc(versions.createdAt));

    return NextResponse.json(chapterVersions);
  } catch (error) {
    console.error("Failed to fetch versions:", error);
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
  }
}

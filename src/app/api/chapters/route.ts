import { NextRequest, NextResponse } from "next/server";
import { db, chapters, projects } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

// POST create new chapter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, title } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Get current max order
    const existingChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.projectId, projectId))
      .orderBy(chapters.order);

    const maxOrder = existingChapters.length > 0
      ? Math.max(...existingChapters.map((c: { order: number }) => c.order))
      : -1;

    const now = new Date();
    const chapterId = uuid();

    await db.insert(chapters).values({
      id: chapterId,
      projectId,
      title: title || `Chapter ${existingChapters.length + 1}`,
      content: "",
      order: maxOrder + 1,
      wordCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Update project's updatedAt
    await db.update(projects).set({ updatedAt: now }).where(eq(projects.id, projectId));

    const chapter = await db.select().from(chapters).where(eq(chapters.id, chapterId)).get();

    return NextResponse.json(chapter, { status: 201 });
  } catch (error) {
    console.error("Failed to create chapter:", error);
    return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 });
  }
}

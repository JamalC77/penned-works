import { NextRequest, NextResponse } from "next/server";
import { db, chapters, projects, versions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

type Params = Promise<{ chapterId: string }>;

// GET single chapter
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { chapterId } = await params;

    const chapter = await db.select().from(chapters).where(eq(chapters.id, chapterId)).get();

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.error("Failed to fetch chapter:", error);
    return NextResponse.json({ error: "Failed to fetch chapter" }, { status: 500 });
  }
}

// Helper to count words
function countWords(text: string): number {
  if (!text) return 0;
  // Strip HTML tags and count words
  const plainText = text.replace(/<[^>]*>/g, " ").trim();
  if (!plainText) return 0;
  return plainText.split(/\s+/).filter(word => word.length > 0).length;
}

// PATCH update chapter (used for auto-save)
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const { chapterId } = await params;
    const body = await request.json();
    const { title, content, createVersion } = body;

    const now = new Date();
    const wordCount = content !== undefined ? countWords(content) : undefined;

    // If createVersion is true, save current state as a version first
    if (createVersion) {
      const currentChapter = await db.select().from(chapters).where(eq(chapters.id, chapterId)).get();
      if (currentChapter && currentChapter.content) {
        await db.insert(versions).values({
          id: uuid(),
          chapterId,
          content: currentChapter.content,
          wordCount: currentChapter.wordCount || 0,
          createdAt: now,
          label: body.versionLabel || null,
        });
      }
    }

    await db
      .update(chapters)
      .set({
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(wordCount !== undefined && { wordCount }),
        updatedAt: now,
      })
      .where(eq(chapters.id, chapterId));

    // Update project's updatedAt
    const chapter = await db.select().from(chapters).where(eq(chapters.id, chapterId)).get();
    if (chapter) {
      await db.update(projects).set({ updatedAt: now }).where(eq(projects.id, chapter.projectId));
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.error("Failed to update chapter:", error);
    return NextResponse.json({ error: "Failed to update chapter" }, { status: 500 });
  }
}

// DELETE chapter
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { chapterId } = await params;

    const chapter = await db.select().from(chapters).where(eq(chapters.id, chapterId)).get();

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    await db.delete(chapters).where(eq(chapters.id, chapterId));

    // Reorder remaining chapters
    const remainingChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.projectId, chapter.projectId))
      .orderBy(chapters.order);

    for (let i = 0; i < remainingChapters.length; i++) {
      await db.update(chapters).set({ order: i }).where(eq(chapters.id, remainingChapters[i].id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete chapter:", error);
    return NextResponse.json({ error: "Failed to delete chapter" }, { status: 500 });
  }
}

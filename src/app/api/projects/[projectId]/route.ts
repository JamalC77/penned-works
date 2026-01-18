import { NextRequest, NextResponse } from "next/server";
import { db, projects, chapters } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

type Params = Promise<{ projectId: string }>;

// GET single project with chapters
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, session.userId)))
      .get();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.projectId, projectId))
      .orderBy(chapters.order);

    return NextResponse.json({ ...project, chapters: projectChapters });
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

// PATCH update project
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();
    const { title, description } = body;

    // Verify ownership
    const existing = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, session.userId)))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await db
      .update(projects)
      .set({
        ...(title && { title }),
        ...(description !== undefined && { description }),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    const project = await db.select().from(projects).where(eq(projects.id, projectId)).get();

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// DELETE project
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Verify ownership before deleting
    const existing = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, session.userId)))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await db.delete(projects).where(eq(projects.id, projectId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}

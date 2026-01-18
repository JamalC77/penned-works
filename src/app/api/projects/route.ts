import { NextRequest, NextResponse } from "next/server";
import { db, projects, chapters } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

// GET all projects
export async function GET() {
  try {
    const allProjects = await db.select().from(projects).orderBy(projects.updatedAt);
    return NextResponse.json(allProjects.reverse());
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// POST create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const now = new Date();
    const projectId = uuid();

    // Create the project
    await db.insert(projects).values({
      id: projectId,
      title,
      description: description || null,
      createdAt: now,
      updatedAt: now,
    });

    // Create first chapter automatically
    const chapterId = uuid();
    await db.insert(chapters).values({
      id: chapterId,
      projectId,
      title: "Chapter 1",
      content: "",
      order: 0,
      wordCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    const project = await db.select().from(projects).where(eq(projects.id, projectId)).get();

    return NextResponse.json({ ...project, firstChapterId: chapterId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

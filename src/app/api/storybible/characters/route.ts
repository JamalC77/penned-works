import { NextRequest, NextResponse } from "next/server";
import { db, characters } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

// POST create new character
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, ...rest } = body;

    if (!projectId || !name) {
      return NextResponse.json({ error: "Project ID and name are required" }, { status: 400 });
    }

    const now = new Date();
    const id = uuid();

    await db.insert(characters).values({
      id,
      projectId,
      name,
      aliases: rest.aliases ? JSON.stringify(rest.aliases) : null,
      physicalDescription: rest.physicalDescription || null,
      age: rest.age || null,
      personality: rest.personality || null,
      backstory: rest.backstory || null,
      notes: rest.notes || null,
      firstAppearance: rest.firstAppearance || null,
      isMainCharacter: rest.isMainCharacter || false,
      createdAt: now,
      updatedAt: now,
    });

    const [created] = await db.select().from(characters).where(eq(characters.id, id)).limit(1);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create character:", error);
    return NextResponse.json({ error: "Failed to create character" }, { status: 500 });
  }
}

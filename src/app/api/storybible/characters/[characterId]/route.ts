import { NextRequest, NextResponse } from "next/server";
import { db, characters } from "@/lib/db";
import { eq } from "drizzle-orm";

type Params = Promise<{ characterId: string }>;

// GET single character
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { characterId } = await params;
    const character = await db.select().from(characters).where(eq(characters.id, characterId)).limit(1).then((r: unknown[]) => r[0]);

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    return NextResponse.json(character);
  } catch (error) {
    console.error("Failed to fetch character:", error);
    return NextResponse.json({ error: "Failed to fetch character" }, { status: 500 });
  }
}

// PATCH update character
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const { characterId } = await params;
    const body = await request.json();

    await db
      .update(characters)
      .set({
        ...body,
        aliases: body.aliases ? JSON.stringify(body.aliases) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(characters.id, characterId));

    const updated = await db.select().from(characters).where(eq(characters.id, characterId)).limit(1).then((r: unknown[]) => r[0]);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update character:", error);
    return NextResponse.json({ error: "Failed to update character" }, { status: 500 });
  }
}

// DELETE character
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { characterId } = await params;
    await db.delete(characters).where(eq(characters.id, characterId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete character:", error);
    return NextResponse.json({ error: "Failed to delete character" }, { status: 500 });
  }
}

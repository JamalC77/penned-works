import { NextRequest, NextResponse } from "next/server";
import {
  db,
  characters,
  locations,
  storyItems,
  timelineEvents,
  plotThreads,
  worldRules,
  characterRelationships,
  consistencyFlags,
} from "@/lib/db";
import { eq } from "drizzle-orm";

type Params = Promise<{ projectId: string }>;

// GET full story bible for a project
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { projectId } = await params;

    const [
      projectCharacters,
      projectLocations,
      projectItems,
      projectEvents,
      projectPlotThreads,
      projectWorldRules,
      projectRelationships,
      projectFlags,
    ] = await Promise.all([
      db.select().from(characters).where(eq(characters.projectId, projectId)),
      db.select().from(locations).where(eq(locations.projectId, projectId)),
      db.select().from(storyItems).where(eq(storyItems.projectId, projectId)),
      db.select().from(timelineEvents).where(eq(timelineEvents.projectId, projectId)),
      db.select().from(plotThreads).where(eq(plotThreads.projectId, projectId)),
      db.select().from(worldRules).where(eq(worldRules.projectId, projectId)),
      db.select().from(characterRelationships).where(eq(characterRelationships.projectId, projectId)),
      db.select().from(consistencyFlags).where(eq(consistencyFlags.projectId, projectId)),
    ]);

    return NextResponse.json({
      characters: projectCharacters,
      locations: projectLocations,
      items: projectItems,
      events: projectEvents,
      plotThreads: projectPlotThreads,
      worldRules: projectWorldRules,
      relationships: projectRelationships,
      consistencyFlags: projectFlags,
    });
  } catch (error) {
    console.error("Failed to fetch story bible:", error);
    return NextResponse.json({ error: "Failed to fetch story bible" }, { status: 500 });
  }
}

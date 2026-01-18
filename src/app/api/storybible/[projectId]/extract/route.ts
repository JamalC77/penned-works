import { NextRequest, NextResponse } from "next/server";
import { ensureEnvLoaded } from "@/lib/env";

ensureEnvLoaded();

import {
  db,
  chapters,
  characters,
  locations,
  storyItems,
  timelineEvents,
  plotThreads,
  worldRules,
  characterRelationships,
  consistencyFlags,
  Character,
  Location,
  StoryItem,
  PlotThread,
  WorldRule,
  CharacterRelationship,
} from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { extractStoryBibleElements } from "@/lib/ai/claude";

type Params = Promise<{ projectId: string }>;

// POST - extract story bible from all chapters
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const { projectId } = await params;

    // Get all chapters for the project
    const projectChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.projectId, projectId))
      .orderBy(chapters.order);

    if (projectChapters.length === 0) {
      return NextResponse.json({ error: "No chapters found" }, { status: 404 });
    }

    // Get existing story bible for context
    const existingCharacters = await db.select().from(characters).where(eq(characters.projectId, projectId));
    const existingLocations = await db.select().from(locations).where(eq(locations.projectId, projectId));
    const existingItems = await db.select().from(storyItems).where(eq(storyItems.projectId, projectId));

    const existingBible = {
      characters: existingCharacters.map((c: { name: string }) => ({ name: c.name })),
      locations: existingLocations.map((l: { name: string }) => ({ name: l.name })),
      items: existingItems.map((i: { name: string }) => ({ name: i.name })),
    };

    const now = new Date();
    const results = {
      characters: 0,
      locations: 0,
      items: 0,
      events: 0,
      plotThreads: 0,
      worldRules: 0,
      relationships: 0,
      consistencyFlags: 0,
    };

    // Process each chapter
    for (const chapter of projectChapters) {
      if (!chapter.content) continue;

      // Strip HTML tags for cleaner extraction
      const plainContent = chapter.content.replace(/<[^>]*>/g, " ").trim();
      if (!plainContent) continue;

      const extraction = await extractStoryBibleElements(plainContent, chapter.title, existingBible);

      // Save characters (check for duplicates by name)
      for (const char of extraction.characters) {
        const existing = await db
          .select()
          .from(characters)
          .where(eq(characters.projectId, projectId))
          .then((rows: Character[]) => rows.find((r) => r.name.toLowerCase() === char.name.toLowerCase()));

        if (!existing) {
          await db.insert(characters).values({
            id: uuid(),
            projectId,
            name: char.name,
            aliases: char.aliases ? JSON.stringify(char.aliases) : null,
            physicalDescription: char.physicalDescription || null,
            age: char.age || null,
            personality: char.personality || null,
            firstAppearance: chapter.title,
            isMainCharacter: char.isMainCharacter || false,
            createdAt: now,
            updatedAt: now,
          });
          results.characters++;
        }
      }

      // Save locations
      for (const loc of extraction.locations) {
        const existing = await db
          .select()
          .from(locations)
          .where(eq(locations.projectId, projectId))
          .then((rows: Location[]) => rows.find((r) => r.name.toLowerCase() === loc.name.toLowerCase()));

        if (!existing) {
          await db.insert(locations).values({
            id: uuid(),
            projectId,
            name: loc.name,
            description: loc.description || null,
            sensoryDetails: loc.sensoryDetails || null,
            significance: loc.significance || null,
            firstAppearance: chapter.title,
            createdAt: now,
            updatedAt: now,
          });
          results.locations++;
        }
      }

      // Save items
      for (const item of extraction.items) {
        const existing = await db
          .select()
          .from(storyItems)
          .where(eq(storyItems.projectId, projectId))
          .then((rows: StoryItem[]) => rows.find((r) => r.name.toLowerCase() === item.name.toLowerCase()));

        if (!existing) {
          await db.insert(storyItems).values({
            id: uuid(),
            projectId,
            name: item.name,
            description: item.description || null,
            significance: item.significance || null,
            currentPossessor: item.currentPossessor || null,
            firstAppearance: chapter.title,
            createdAt: now,
            updatedAt: now,
          });
          results.items++;
        }
      }

      // Save timeline events
      const existingEvents = await db.select().from(timelineEvents).where(eq(timelineEvents.projectId, projectId));
      for (const event of extraction.events) {
        await db.insert(timelineEvents).values({
          id: uuid(),
          projectId,
          title: event.title,
          description: event.description || null,
          storyDate: event.storyDate || null,
          duration: event.duration || null,
          chapterId: chapter.id,
          order: existingEvents.length + results.events,
          createdAt: now,
          updatedAt: now,
        });
        results.events++;
      }

      // Save plot threads
      for (const thread of extraction.plotThreads) {
        const existing = await db
          .select()
          .from(plotThreads)
          .where(eq(plotThreads.projectId, projectId))
          .then((rows: PlotThread[]) => rows.find((r) => r.title.toLowerCase() === thread.title.toLowerCase()));

        if (!existing) {
          await db.insert(plotThreads).values({
            id: uuid(),
            projectId,
            title: thread.title,
            description: thread.description || null,
            status: thread.status,
            introducedIn: chapter.title,
            createdAt: now,
            updatedAt: now,
          });
          results.plotThreads++;
        }
      }

      // Save world rules
      for (const rule of extraction.worldRules) {
        const existing = await db
          .select()
          .from(worldRules)
          .where(eq(worldRules.projectId, projectId))
          .then((rows: WorldRule[]) => rows.find((r) => r.name.toLowerCase() === rule.name.toLowerCase()));

        if (!existing) {
          await db.insert(worldRules).values({
            id: uuid(),
            projectId,
            category: rule.category,
            name: rule.name,
            description: rule.description || null,
            limitations: rule.limitations || null,
            createdAt: now,
            updatedAt: now,
          });
          results.worldRules++;
        }
      }

      // Save consistency issues
      for (const issue of extraction.consistencyIssues) {
        await db.insert(consistencyFlags).values({
          id: uuid(),
          projectId,
          type: issue.type,
          description: issue.description,
          location1: issue.location1 || null,
          location2: issue.location2 || null,
          status: "open",
          createdAt: now,
          updatedAt: now,
        });
        results.consistencyFlags++;
      }

      // Update existing bible for next chapter context
      existingBible.characters = [
        ...existingBible.characters,
        ...extraction.characters.map((c) => ({ name: c.name })),
      ];
      existingBible.locations = [
        ...existingBible.locations,
        ...extraction.locations.map((l) => ({ name: l.name })),
      ];
      existingBible.items = [...existingBible.items, ...extraction.items.map((i) => ({ name: i.name }))];
    }

    // Handle relationships after all characters are extracted
    const allCharacters = await db.select().from(characters).where(eq(characters.projectId, projectId));

    // Re-extract to get relationships now that we have character IDs
    for (const chapter of projectChapters) {
      if (!chapter.content) continue;
      const plainContent = chapter.content.replace(/<[^>]*>/g, " ").trim();
      if (!plainContent) continue;

      const extraction = await extractStoryBibleElements(plainContent, chapter.title);

      for (const rel of extraction.relationships) {
        const char1 = allCharacters.find(
          (c: Character) => c.name.toLowerCase() === rel.character1.toLowerCase()
        );
        const char2 = allCharacters.find(
          (c: Character) => c.name.toLowerCase() === rel.character2.toLowerCase()
        );

        if (char1 && char2) {
          // Check if relationship already exists
          const existing = await db
            .select()
            .from(characterRelationships)
            .where(eq(characterRelationships.projectId, projectId))
            .then((rows: CharacterRelationship[]) =>
              rows.find(
                (r) =>
                  (r.character1Id === char1.id && r.character2Id === char2.id) ||
                  (r.character1Id === char2.id && r.character2Id === char1.id)
              )
            );

          if (!existing) {
            await db.insert(characterRelationships).values({
              id: uuid(),
              projectId,
              character1Id: char1.id,
              character2Id: char2.id,
              relationship: rel.relationship,
              createdAt: now,
            });
            results.relationships++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      extracted: results,
    });
  } catch (error) {
    console.error("Failed to extract story bible:", error);
    return NextResponse.json(
      { error: `Failed to extract story bible: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}

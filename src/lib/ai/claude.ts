import Anthropic from "@anthropic-ai/sdk";

export type WritingMode = "pure" | "expedience" | "storyweaver";

// Lazy-load the client so env vars can be set first
let _anthropic: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return _anthropic;
}

// Base system prompt for all modes
const BASE_CONTEXT = `You are a skilled writing assistant helping authors craft their stories.
You respect the author's voice and vision above all else.
You never impose your own style - you enhance and support theirs.`;

// Pure Mode: AI as consultant only
export async function getWritingFeedback(
  selectedText: string,
  fullContext: string,
  question: string
): Promise<string> {
  const response = await getClient().messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 1024,
    system: `${BASE_CONTEXT}

You are in CONSULTANT mode. The author has selected a portion of their text and wants your feedback.
- Give honest, constructive feedback
- Be specific about what works and what could be stronger
- Suggest alternatives only when asked
- Never rewrite their work unless explicitly requested
- Keep responses concise and actionable`,
    messages: [
      {
        role: "user",
        content: `Here's the full context of what I'm working on:

---
${fullContext}
---

I've selected this specific passage:

"${selectedText}"

My question: ${question}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "Unable to generate feedback.";
}

// Expedience Mode: Author describes, AI drafts
export async function generateFromDescription(
  description: string,
  context: string,
  styleReference?: string
): Promise<string> {
  const response = await getClient().messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 2048,
    system: `${BASE_CONTEXT}

You are in EXPEDIENCE mode. The author knows exactly what they want - they've described it in detail.
Your job is to execute their vision faithfully.

Guidelines:
- Follow their description precisely
- Match the tone/style they've established in their existing work
- Write prose that sounds like THEM, not like you
- Don't add elements they didn't describe
- Don't editorialize or add your own flourishes
- Output ONLY the prose - no explanations, no meta-commentary`,
    messages: [
      {
        role: "user",
        content: `${context ? `Here's my existing work for style/tone reference:\n\n---\n${context}\n---\n\n` : ""}${styleReference ? `Style notes: ${styleReference}\n\n` : ""}Here's what I want you to write:

${description}

Write this now. Output only the prose.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "Unable to generate content.";
}

// Story Weaver Mode: Interactive narrative
export async function continueStory(
  storyContext: string,
  lastAction: string,
  authorChoice?: string
): Promise<{
  narrative: string;
  choices: string[];
}> {
  const response = await getClient().messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 1024,
    system: `${BASE_CONTEXT}

You are in STORY WEAVER mode. This is collaborative, adventure-game style writing.
The author makes choices, you continue the narrative based on those choices.

Guidelines:
- Continue the story based on the author's choice
- Write 2-4 paragraphs of narrative continuation
- End at a decision point
- Offer 3 distinct choices for what happens next
- Choices should be meaningfully different, not just variations
- Keep the author's established tone and style
- This is THEIR story - you're helping them discover it

Output format (use exactly this structure):
NARRATIVE:
[Your narrative continuation here]

CHOICES:
1. [First choice]
2. [Second choice]
3. [Third choice]`,
    messages: [
      {
        role: "user",
        content: `Story so far:

${storyContext}

${authorChoice ? `I choose: ${authorChoice}` : "Begin the story. Set the scene and give me my first choices."}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const text = textBlock?.text || "";

  // Parse the response
  const narrativeMatch = text.match(/NARRATIVE:\s*([\s\S]*?)(?=CHOICES:|$)/);
  const choicesMatch = text.match(/CHOICES:\s*([\s\S]*?)$/);

  const narrative = narrativeMatch ? narrativeMatch[1].trim() : text;
  const choices: string[] = [];

  if (choicesMatch) {
    const choicesText = choicesMatch[1];
    const choiceLines = choicesText.split(/\n/).filter((line) => line.trim());
    for (const line of choiceLines) {
      const cleaned = line.replace(/^\d+\.\s*/, "").trim();
      if (cleaned) choices.push(cleaned);
    }
  }

  return { narrative, choices };
}

// Quick assistance - for inline help without mode switching
export async function quickAssist(
  text: string,
  assistType: "grammar" | "clarity" | "stronger" | "shorter"
): Promise<string> {
  const prompts = {
    grammar: "Fix any grammar or punctuation issues. Keep everything else identical.",
    clarity: "Improve clarity while keeping the same meaning and voice. Minimal changes only.",
    stronger: "Make this more impactful. Stronger verbs, tighter prose. Keep the author's voice.",
    shorter: "Condense this while keeping the essential meaning. Cut ruthlessly but preserve voice.",
  };

  const response = await getClient().messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 1024,
    system: `${BASE_CONTEXT}

You are providing quick writing assistance.
Output ONLY the revised text - no explanations, no quotes, no meta-commentary.
If no changes are needed, return the original text exactly.`,
    messages: [
      {
        role: "user",
        content: `${prompts[assistType]}

Text to revise:
${text}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : text;
}

// ============================================
// STORY BIBLE EXTRACTION
// ============================================

export interface ExtractedCharacter {
  name: string;
  aliases?: string[];
  physicalDescription?: string;
  age?: string;
  personality?: string;
  firstAppearance?: string;
  isMainCharacter?: boolean;
}

export interface ExtractedLocation {
  name: string;
  description?: string;
  sensoryDetails?: string;
  significance?: string;
  firstAppearance?: string;
}

export interface ExtractedItem {
  name: string;
  description?: string;
  significance?: string;
  currentPossessor?: string;
  firstAppearance?: string;
}

export interface ExtractedEvent {
  title: string;
  description?: string;
  storyDate?: string;
  duration?: string;
}

export interface ExtractedPlotThread {
  title: string;
  description?: string;
  status: "active" | "resolved" | "foreshadowed";
}

export interface ExtractedWorldRule {
  category: string;
  name: string;
  description?: string;
  limitations?: string;
}

export interface ExtractedRelationship {
  character1: string;
  character2: string;
  relationship: string;
}

export interface ConsistencyIssue {
  type: "contradiction" | "unresolved" | "question";
  description: string;
  location1?: string;
  location2?: string;
}

export interface StoryBibleExtraction {
  characters: ExtractedCharacter[];
  locations: ExtractedLocation[];
  items: ExtractedItem[];
  events: ExtractedEvent[];
  plotThreads: ExtractedPlotThread[];
  worldRules: ExtractedWorldRule[];
  relationships: ExtractedRelationship[];
  consistencyIssues: ConsistencyIssue[];
}

// Extract Story Bible elements from chapter content
export async function extractStoryBibleElements(
  chapterContent: string,
  chapterTitle: string,
  existingBible?: Partial<StoryBibleExtraction>
): Promise<StoryBibleExtraction> {
  const existingContext = existingBible
    ? `
EXISTING STORY BIBLE (for reference - update or add to these, don't duplicate):
Characters: ${existingBible.characters?.map((c) => c.name).join(", ") || "none yet"}
Locations: ${existingBible.locations?.map((l) => l.name).join(", ") || "none yet"}
Items: ${existingBible.items?.map((i) => i.name).join(", ") || "none yet"}
`
    : "";

  const response = await getClient().messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 4096,
    system: `You are extracting story bible information from a chapter of fiction.
Your job is to identify and catalog:
- Characters (names, descriptions, traits mentioned)
- Locations (places, settings, descriptions)
- Important items/objects (significant props, symbolic objects)
- Timeline events (what happens, when)
- Plot threads (ongoing storylines, mysteries, unresolved questions)
- World rules (magic systems, technology, social structures, established facts)
- Character relationships (how characters relate to each other)
- Consistency issues (any contradictions or questions you notice)

Be thorough but only extract what's actually in the text - don't invent details.
If something isn't mentioned, don't include it.
For first appearances, note this is from the current chapter being analyzed.`,
    messages: [
      {
        role: "user",
        content: `${existingContext}

CHAPTER: "${chapterTitle}"

CONTENT:
${chapterContent}

Extract all story bible elements from this chapter. Return as JSON matching this exact structure:
{
  "characters": [{ "name": "", "aliases": [], "physicalDescription": "", "age": "", "personality": "", "firstAppearance": "", "isMainCharacter": false }],
  "locations": [{ "name": "", "description": "", "sensoryDetails": "", "significance": "", "firstAppearance": "" }],
  "items": [{ "name": "", "description": "", "significance": "", "currentPossessor": "", "firstAppearance": "" }],
  "events": [{ "title": "", "description": "", "storyDate": "", "duration": "" }],
  "plotThreads": [{ "title": "", "description": "", "status": "active" }],
  "worldRules": [{ "category": "", "name": "", "description": "", "limitations": "" }],
  "relationships": [{ "character1": "", "character2": "", "relationship": "" }],
  "consistencyIssues": [{ "type": "contradiction", "description": "", "location1": "", "location2": "" }]
}

Only include arrays with actual extracted content. Empty arrays are fine if nothing found.
Return ONLY valid JSON, no other text.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const text = textBlock?.text || "{}";

  try {
    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        characters: [],
        locations: [],
        items: [],
        events: [],
        plotThreads: [],
        worldRules: [],
        relationships: [],
        consistencyIssues: [],
      };
    }
    return JSON.parse(jsonMatch[0]) as StoryBibleExtraction;
  } catch {
    console.error("Failed to parse story bible extraction:", text);
    return {
      characters: [],
      locations: [],
      items: [],
      events: [],
      plotThreads: [],
      worldRules: [],
      relationships: [],
      consistencyIssues: [],
    };
  }
}

// Check for consistency issues across entire project
export async function checkConsistency(
  allChaptersContent: string,
  existingBible: StoryBibleExtraction
): Promise<ConsistencyIssue[]> {
  const response = await getClient().messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 2048,
    system: `You are a continuity editor checking a manuscript for consistency issues.
Look for:
- Contradictions in character descriptions (eye color changed, age inconsistency)
- Timeline impossibilities (events that can't happen in stated order)
- Location inconsistencies (room described differently)
- Character knowledge inconsistencies (knowing something before they learned it)
- Plot holes or forgotten threads
- Unresolved questions that seem forgotten

Be specific about what contradicts what and where.`,
    messages: [
      {
        role: "user",
        content: `EXISTING STORY BIBLE:
${JSON.stringify(existingBible, null, 2)}

FULL MANUSCRIPT:
${allChaptersContent}

Find any consistency issues. Return as JSON array:
[{ "type": "contradiction|unresolved|question", "description": "", "location1": "", "location2": "" }]

Return ONLY valid JSON array, no other text. Empty array [] if no issues found.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const text = textBlock?.text || "[]";

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]) as ConsistencyIssue[];
  } catch {
    console.error("Failed to parse consistency check:", text);
    return [];
  }
}

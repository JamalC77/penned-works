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

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface MaterialInput {
  title: string;
  content_text: string;
}

export async function POST(req: NextRequest) {
  const { materials, className, count = 10, notesSummary = "" } = await req.json() as {
    materials: MaterialInput[];
    className: string;
    count?: number;
    notesSummary?: string;
  };

  if (!materials?.length) {
    return NextResponse.json({ error: "No materials provided" }, { status: 400 });
  }

  const client = new Anthropic();

  const materialBlocks = materials
    .map((m) => `## ${m.title}\n${m.content_text}`)
    .join("\n\n---\n\n");

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are creating flashcards to help a student study for ${className}.

Here are their notes and materials:

${materialBlocks}
${notesSummary ? `\nNOTES INTELLIGENCE (use to avoid redundancy and target gaps):\n${notesSummary}` : ""}

Generate exactly ${count} flashcard question-and-answer pairs. Rules:
- Questions should test genuine understanding, not just word-for-word recall
- Mix question types: definitions, "explain why", "what is the difference between", "give an example of", fill-in-the-blank concepts
- Answers should be clear and concise (1–3 sentences max)
- Pull directly from the material provided — don't invent topics
- Vary difficulty: some easy recall, some requiring deeper thinking
- If notes intelligence is provided, prioritise gaps and thinly covered areas

Return ONLY valid JSON, no explanation:
{
  "cards": [
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." }
  ]
}`,
      },
    ],
  });

  const text = (msg.content[0] as { type: string; text: string }).text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Failed to parse flashcards from Claude" }, { status: 500 });
  }

  try {
    const result = JSON.parse(jsonMatch[0]) as { cards: { question: string; answer: string }[] };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Invalid JSON from Claude" }, { status: 500 });
  }
}

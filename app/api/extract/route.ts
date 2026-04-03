import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

interface ExtractResult {
  title: string;
  text: string;
  tags: string[];
}

function parseJson(raw: string): ExtractResult {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const systemPrompt = `You are an AI assistant helping a student organize their school materials.
Respond ONLY with a valid JSON object — no markdown, no explanation.
Schema: { "title": string, "text": string, "tags": string[] }
- title: concise (max 8 words), descriptive of the content
- text: all readable text from the material, formatted clearly with line breaks
- tags: 3–5 specific topic tags relevant to the content (e.g. "Photosynthesis", "Chapter 7", "Mid-term prep")`;

    let message: Anthropic.Message;

    if (body.mode === "image") {
      // Vision: image file (JPG, PNG, WEBP, GIF)
      const mediaType = body.mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
      message = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: body.base64 },
              },
              {
                type: "text",
                text: "Extract and organize all text from this class material. Return JSON only.",
              },
            ],
          },
        ],
      });
    } else if (body.mode === "pdf") {
      // PDF document — higher token limit since PDFs can be long
      message = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: body.base64 },
              } as Anthropic.DocumentBlockParam,
              {
                type: "text",
                text: "Summarize and organize the key concepts and important information from this document into the text field. Do NOT transcribe every word — extract the most useful study content. Return JSON only.",
              },
            ],
          },
        ],
      });
    } else {
      // Plain text paste
      message = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Analyze and organize this class material. Return JSON only.\n\n${body.text}`,
          },
        ],
      });
    }

    const raw = message.content[0];
    if (raw.type !== "text") {
      throw new Error("Unexpected Claude response type");
    }

    const result = parseJson(raw.text);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Extract API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Extraction failed" },
      { status: 500 }
    );
  }
}

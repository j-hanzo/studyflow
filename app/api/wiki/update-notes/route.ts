import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { class_id } = await req.json();
  if (!class_id) return NextResponse.json({ error: "class_id required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all materials with extracted text for this class
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: materials } = await (supabase as any)
    .from("materials")
    .select("title, content_text, type")
    .eq("student_id", user.id)
    .eq("class_id", class_id)
    .not("content_text", "is", null);

  if (!materials?.length) {
    return NextResponse.json({ ok: true, message: "No materials to summarize" });
  }

  // Fetch existing wiki to build on previous summary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: wiki } = await (supabase as any)
    .from("student_wiki")
    .select("notes_summary")
    .eq("student_id", user.id)
    .eq("class_id", class_id)
    .single();

  const materialsText = materials
    .map((m: { title: string; content_text: string; type: string }) =>
      `### ${m.title} (${m.type})\n${m.content_text?.slice(0, 1500) ?? ""}`
    )
    .join("\n\n---\n\n");

  const client = new Anthropic();
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `You maintain a notes intelligence summary for an AI tutor. This summary helps avoid redundancy and enables smart practice question generation.

Previous summary:
${wiki?.notes_summary || "None yet."}

Current materials for this class:
${materialsText}

Write an updated notes summary (max 400 words) covering:
1. Topics addressed so far and how thoroughly each is covered
2. Key concepts, definitions, and themes across all notes
3. Gaps or thinly covered areas
4. How topics interconnect

Be specific — reference actual content. Do not pad with filler.`,
      },
    ],
  });

  const notes_summary = (msg.content[0] as { type: string; text: string }).text;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("student_wiki")
    .upsert(
      { student_id: user.id, class_id, notes_summary, updated_at: new Date().toISOString() },
      { onConflict: "student_id,class_id" }
    );

  return NextResponse.json({ ok: true });
}

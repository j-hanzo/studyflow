import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { class_id, messages } = await req.json();
  if (!class_id || !messages?.length) {
    return NextResponse.json({ error: "class_id and messages required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch existing wiki
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: wiki } = await (supabase as any)
    .from("student_wiki")
    .select("tutor_summary")
    .eq("student_id", user.id)
    .eq("class_id", class_id)
    .single();

  // Summarise last 10 messages to keep the prompt lean
  const recentMessages = messages.slice(-10) as { role: string; content: string }[];
  const convoText = recentMessages
    .map((m) => `${m.role.toUpperCase()}: ${m.content.slice(0, 600)}`)
    .join("\n\n");

  const client = new Anthropic();
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `You maintain a tutoring history summary so that future sessions can continue where the last one left off.

Previous summary:
${wiki?.tutor_summary || "No previous sessions."}

Recent tutoring session:
${convoText}

Write an updated tutoring summary (max 300 words) covering:
1. Topics the student has worked through in this and past sessions
2. Concepts they understand well
3. Concepts they struggled with or asked to revisit
4. Specific next step — what topic or question to pick up next time

Be concrete. This is read silently at the start of every future session.`,
      },
    ],
  });

  const tutor_summary = (msg.content[0] as { type: string; text: string }).text;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("student_wiki")
    .upsert(
      { student_id: user.id, class_id, tutor_summary, updated_at: new Date().toISOString() },
      { onConflict: "student_id,class_id" }
    );

  return NextResponse.json({ ok: true });
}

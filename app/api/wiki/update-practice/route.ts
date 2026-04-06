import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

interface Card { question: string; answer: string; }

export async function POST(req: NextRequest) {
  const { class_id, cards, gotCount, total } = await req.json() as {
    class_id: string;
    cards: Card[];
    gotCount: number;
    total: number;
  };
  if (!class_id || !cards?.length) {
    return NextResponse.json({ error: "class_id and cards required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch existing practice summary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: wiki } = await (supabase as any)
    .from("student_wiki")
    .select("practice_summary")
    .eq("student_id", user.id)
    .eq("class_id", class_id)
    .single();

  const score = total > 0 ? Math.round((gotCount / total) * 100) : 0;
  const questionList = cards.map((c, i) => `${i + 1}. Q: ${c.question}`).join("\n");

  const client = new Anthropic();
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `You maintain a practice history summary so future flashcard and quiz sessions can target genuine gaps.

Previous practice summary:
${wiki?.practice_summary || "No previous practice sessions."}

Latest practice session:
- Score: ${gotCount}/${total} (${score}%)
- Questions covered:
${questionList}

Write an updated practice summary (max 300 words) covering:
1. Topics and concepts that have been practiced
2. Areas where the student is consistently strong (high scores, repeated correct answers)
3. Gaps and weak areas to target in the next session (low scores, concepts not yet tested)
4. Specific recommendation for what to focus on next time

Be concrete and specific. This is read before every flashcard and quiz generation to avoid repetition and target real gaps.`,
      },
    ],
  });

  const practice_summary = (msg.content[0] as { type: string; text: string }).text;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("student_wiki")
    .upsert(
      { student_id: user.id, class_id, practice_summary, updated_at: new Date().toISOString() },
      { onConflict: "student_id,class_id" }
    );

  return NextResponse.json({ ok: true });
}

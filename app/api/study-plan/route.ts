import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface AssignmentInput {
  id: string;
  title: string;
  type: string;
  due_date: string;
  class_name: string;
}

export async function POST(req: NextRequest) {
  const { assignments, studentName, today } = await req.json() as {
    assignments: AssignmentInput[];
    studentName: string;
    today: string; // YYYY-MM-DD
  };

  if (!assignments?.length) {
    return NextResponse.json({ sessions: [] });
  }

  const client = new Anthropic();

  const assignmentList = assignments
    .map((a) => `- ID: ${a.id} | "${a.title}" | ${a.type} | ${a.class_name} | due ${a.due_date}`)
    .join("\n");

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a smart study planner for a student named ${studentName}.
Today is ${today}.

Their upcoming deadlines:
${assignmentList}

Generate a practical study schedule from today through the last deadline. Follow these rules:
- Exams/quizzes: start 5-7 days before, 2-4 sessions spread across those days, 45-60 min each
- Assignments: 1-2 focused work sessions the 1-2 days before the deadline, 30-45 min each
- Max 2 study sessions per day total
- Skip days that already have 2 sessions
- Give each session a specific, actionable title (e.g. "Review Chapter 4 — Derivatives", "Draft essay outline — Romeo & Juliet")
- Only schedule sessions on or after today (${today})
- Only schedule sessions up to and including the due date
- Assign a realistic start_time for each session in HH:MM (24-hour) format
  - First session of the day: pick a time between 15:00 and 17:00 (after school)
  - Second session of the day (if any): at least 2 hours after the first, no later than 21:00
  - Vary times naturally (e.g. 15:30, 16:00, 17:00, 19:00) — don't use the same time for every session

Return ONLY valid JSON — no explanation, no markdown fences:
{
  "sessions": [
    {
      "assignment_id": "<assignment id from above, or null>",
      "title": "<specific actionable title>",
      "scheduled_date": "<YYYY-MM-DD>",
      "start_time": "<HH:MM>",
      "duration_minutes": <30|45|60>
    }
  ]
}`,
      },
    ],
  });

  const text = (msg.content[0] as { type: string; text: string }).text;

  // Pull JSON out even if Claude wraps it in markdown
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Failed to parse study plan from Claude" }, { status: 500 });
  }

  try {
    const plan = JSON.parse(jsonMatch[0]) as { sessions: unknown[] };
    return NextResponse.json(plan);
  } catch {
    return NextResponse.json({ error: "Invalid JSON from Claude" }, { status: 500 });
  }
}

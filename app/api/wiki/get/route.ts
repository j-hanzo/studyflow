import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { class_id } = await req.json();
  if (!class_id) return NextResponse.json(null);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("student_wiki")
    .select("tutor_summary, notes_summary, practice_summary")
    .eq("student_id", user.id)
    .eq("class_id", class_id)
    .single();

  return NextResponse.json(data ?? null);
}

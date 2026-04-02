import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CalendarClient from "./CalendarClient";
import type { Profile, Class, Assignment, StudySession } from "@/lib/supabase/types";

export default async function CalendarPage() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await db.from("profiles").select("*").eq("id", user.id).single();
  if (!profileData) redirect("/login");
  const profile = profileData as Profile;

  const [allClassesResult, assignmentsResult, sessionsResult] = await Promise.all([
    db.from("classes").select("*").eq("student_id", user.id).order("created_at"),
    db.from("assignments").select("*").eq("student_id", user.id).order("due_date", { ascending: true }),
    db.from("study_sessions").select("*").eq("student_id", user.id).order("scheduled_date", { ascending: true }),
  ]);

  return (
    <CalendarClient
      profile={profile}
      allClasses={(allClassesResult.data ?? []) as Class[]}
      assignments={(assignmentsResult.data ?? []) as Assignment[]}
      initialStudySessions={(sessionsResult.data ?? []) as StudySession[]}
    />
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CalendarClient from "./CalendarClient";
import type { Profile, Class, Assignment } from "@/lib/supabase/types";

export default async function CalendarPage() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Phase 1: profile (needed to verify auth)
  const { data: profileData } = await db.from("profiles").select("*").eq("id", user.id).single();
  if (!profileData) redirect("/login");
  const profile = profileData as Profile;

  // Phase 2: all remaining queries in parallel
  const [allClassesResult, assignmentsResult] = await Promise.all([
    db.from("classes").select("*").eq("student_id", user.id).order("created_at"),
    db.from("assignments").select("*").eq("student_id", user.id).order("due_date", { ascending: true }),
  ]);

  return (
    <CalendarClient
      profile={profile}
      allClasses={(allClassesResult.data ?? []) as Class[]}
      assignments={(assignmentsResult.data ?? []) as Assignment[]}
    />
  );
}

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

  const { data: profileData } = await db.from("profiles").select("*").eq("id", user.id).single();
  if (!profileData) redirect("/login");
  const profile = profileData as Profile;

  const { data: allClassesData } = await db
    .from("classes")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at");
  const allClasses = (allClassesData ?? []) as Class[];

  const { data: assignmentsData } = await db
    .from("assignments")
    .select("*")
    .eq("student_id", user.id)
    .order("due_date", { ascending: true });
  const assignments = (assignmentsData ?? []) as Assignment[];

  return (
    <CalendarClient
      profile={profile}
      allClasses={allClasses}
      assignments={assignments}
    />
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TutorClient from "./TutorClient";
import type { Profile, Class, Material, Assignment } from "@/lib/supabase/types";

export default async function TutorPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; prompt?: string }>;
}) {
  const { classId, prompt } = await searchParams;
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

  // All materials with their extracted text — this is the AI's context
  const { data: materialsData } = await db
    .from("materials")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });
  const allMaterials = (materialsData ?? []) as Material[];

  // Upcoming assignments/exams for context
  const today = new Date().toISOString().split("T")[0];
  const { data: assignmentsData } = await db
    .from("assignments")
    .select("*")
    .eq("student_id", user.id)
    .eq("completed", false)
    .gte("due_date", today)
    .order("due_date", { ascending: true })
    .limit(10);
  const upcomingAssignments = (assignmentsData ?? []) as Assignment[];

  return (
    <TutorClient
      profile={profile}
      allClasses={allClasses}
      allMaterials={allMaterials}
      upcomingAssignments={upcomingAssignments}
      defaultClassId={classId}
      defaultPrompt={prompt ? decodeURIComponent(prompt) : undefined}
    />
  );
}

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

  // Phase 1: profile
  const { data: profileData } = await db.from("profiles").select("*").eq("id", user.id).single();
  if (!profileData) redirect("/login");
  const profile = profileData as Profile;

  const today = new Date().toISOString().split("T")[0];

  // Phase 2: all three data fetches in parallel
  const [allClassesResult, materialsResult, assignmentsResult] = await Promise.all([
    db.from("classes").select("*").eq("student_id", user.id).order("created_at"),
    db.from("materials").select("*").eq("student_id", user.id).order("created_at", { ascending: false }),
    db.from("assignments").select("*").eq("student_id", user.id)
      .eq("completed", false).gte("due_date", today)
      .order("due_date", { ascending: true }).limit(10),
  ]);

  return (
    <TutorClient
      profile={profile}
      allClasses={(allClassesResult.data ?? []) as Class[]}
      allMaterials={(materialsResult.data ?? []) as Material[]}
      upcomingAssignments={(assignmentsResult.data ?? []) as Assignment[]}
      defaultClassId={classId}
      defaultPrompt={prompt ? decodeURIComponent(prompt) : undefined}
    />
  );
}

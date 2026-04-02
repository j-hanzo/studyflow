import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PracticeClient from "./PracticeClient";
import type { Profile, Class, Material } from "@/lib/supabase/types";

export default async function PracticePage() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await db.from("profiles").select("*").eq("id", user.id).single();
  if (!profileData) redirect("/login");
  const profile = profileData as Profile;

  const [classesResult, materialsResult] = await Promise.all([
    db.from("classes").select("*").eq("student_id", user.id).order("created_at"),
    db.from("materials").select("id, class_id, title, content_text, type")
      .eq("student_id", user.id)
      .not("content_text", "is", null),
  ]);

  return (
    <PracticeClient
      profile={profile}
      allClasses={(classesResult.data ?? []) as Class[]}
      allMaterials={(materialsResult.data ?? []) as Material[]}
    />
  );
}

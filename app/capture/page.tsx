import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CaptureClient from "./CaptureClient";
import type { Profile, Class, Material } from "@/lib/supabase/types";

export default async function CapturePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const { classId } = await searchParams;
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

  // Most recent 5 materials this student has added
  const { data: recentData } = await db
    .from("materials")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);
  const recentMaterials = (recentData ?? []) as Material[];

  return (
    <CaptureClient
      profile={profile}
      allClasses={allClasses}
      recentMaterials={recentMaterials}
      defaultClassId={classId}
    />
  );
}

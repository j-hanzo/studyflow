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

  // Phase 1: profile
  const { data: profileData } = await db.from("profiles").select("*").eq("id", user.id).single();
  if (!profileData) redirect("/login");
  const profile = profileData as Profile;

  // Phase 2: parallel
  const [allClassesResult, recentResult] = await Promise.all([
    db.from("classes").select("*").eq("student_id", user.id).order("created_at"),
    db.from("materials").select("*").eq("student_id", user.id)
      .order("created_at", { ascending: false }).limit(5),
  ]);

  return (
    <CaptureClient
      profile={profile}
      allClasses={(allClassesResult.data ?? []) as Class[]}
      recentMaterials={(recentResult.data ?? []) as Material[]}
      defaultClassId={classId}
    />
  );
}

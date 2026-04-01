import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import ClassDetailClient from "./ClassDetailClient";
import type { Class, Material, Assignment, Profile } from "@/lib/supabase/types";

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Phase 1: profile
  const { data: profileData } = await db.from("profiles").select("*").eq("id", user.id).single();
  if (!profileData) redirect("/login");
  const profile = profileData as Profile;

  // Phase 2: class verify + all classes + materials + assignments — all parallel
  // (class ownership is confirmed by eq("student_id", user.id))
  const [classResult, allClassesResult, materialsResult, assignmentsResult] = await Promise.all([
    db.from("classes").select("*").eq("id", id).eq("student_id", user.id).single(),
    db.from("classes").select("*").eq("student_id", user.id).order("created_at"),
    db.from("materials").select("*").eq("class_id", id).order("created_at", { ascending: false }),
    db.from("assignments").select("*").eq("class_id", id).order("due_date", { ascending: true }),
  ]);

  if (!classResult.data) notFound();

  const cls         = classResult.data    as Class;
  const allClasses  = (allClassesResult.data  ?? []) as Class[];
  const materials   = (materialsResult.data   ?? []) as Material[];
  const assignments = (assignmentsResult.data ?? []) as Assignment[];

  // Phase 3: signed URLs for photo materials (already internally parallel)
  const signedUrls: Record<string, string> = {};
  await Promise.all(
    materials
      .filter((m) => m.photo_url)
      .map(async (m) => {
        const { data } = await supabase.storage.from("materials").createSignedUrl(m.photo_url!, 3600);
        if (data?.signedUrl) signedUrls[m.id] = data.signedUrl;
      })
  );

  return (
    <ClassDetailClient
      profile={profile}
      cls={cls}
      allClasses={allClasses}
      materials={materials}
      signedUrls={signedUrls}
      assignments={assignments}
    />
  );
}

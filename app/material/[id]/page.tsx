import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import MaterialDetailClient from "./MaterialDetailClient";
import type { Profile, Class, Material, Assignment } from "@/lib/supabase/types";

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Phase 1: profile + material ownership check in parallel
  const [profileResult, materialResult] = await Promise.all([
    db.from("profiles").select("*").eq("id", user.id).single(),
    db.from("materials").select("*").eq("id", id).eq("student_id", user.id).single(),
  ]);
  if (!profileResult.data) redirect("/login");
  if (!materialResult.data) notFound();

  const profile  = profileResult.data  as Profile;
  const material = materialResult.data as Material;

  // Phase 2: class info + all classes + signed URL + linked assignment in parallel
  const [classResult, allClassesResult, signedUrlResult, linkedAssignmentResult] = await Promise.all([
    db.from("classes").select("*").eq("id", material.class_id).single(),
    db.from("classes").select("*").eq("student_id", user.id).order("created_at"),
    material.photo_url
      ? supabase.storage.from("materials").createSignedUrl(material.photo_url, 3600)
      : Promise.resolve({ data: null }),
    db.from("assignments").select("*")
      .eq("student_id", user.id)
      .eq("description", `material_ref:${id}`)
      .limit(1),
  ]);
  if (!classResult.data) notFound();

  const linkedAssignment = (linkedAssignmentResult.data?.[0] ?? null) as Assignment | null;

  return (
    <MaterialDetailClient
      profile={profile}
      allClasses={(allClassesResult.data ?? []) as Class[]}
      material={material}
      classInfo={classResult.data as Class}
      signedUrl={signedUrlResult.data?.signedUrl ?? null}
      linkedAssignment={linkedAssignment}
    />
  );
}

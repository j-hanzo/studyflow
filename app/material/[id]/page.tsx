import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import MaterialDetailClient from "./MaterialDetailClient";
import type { Profile, Class, Material } from "@/lib/supabase/types";

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

  // Phase 2: class info + all classes + signed URL in parallel
  const [classResult, allClassesResult, signedUrlResult] = await Promise.all([
    db.from("classes").select("*").eq("id", material.class_id).single(),
    db.from("classes").select("*").eq("student_id", user.id).order("created_at"),
    material.photo_url
      ? supabase.storage.from("materials").createSignedUrl(material.photo_url, 3600)
      : Promise.resolve({ data: null }),
  ]);
  if (!classResult.data) notFound();

  return (
    <MaterialDetailClient
      profile={profile}
      allClasses={(allClassesResult.data ?? []) as Class[]}
      material={material}
      classInfo={classResult.data as Class}
      signedUrl={signedUrlResult.data?.signedUrl ?? null}
    />
  );
}

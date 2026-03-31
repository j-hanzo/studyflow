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

  const { data: profileData } = await db.from("profiles").select("*").eq("id", user.id).single();
  if (!profileData) redirect("/login");
  const profile = profileData as Profile;

  // Fetch the material (verify student owns it)
  const { data: materialData } = await db
    .from("materials")
    .select("*")
    .eq("id", id)
    .eq("student_id", user.id)
    .single();
  if (!materialData) notFound();
  const material = materialData as Material;

  // Fetch the class this material belongs to
  const { data: classData } = await db
    .from("classes")
    .select("*")
    .eq("id", material.class_id)
    .single();
  if (!classData) notFound();
  const classInfo = classData as Class;

  // All student classes (for sidebar)
  const { data: allClassesData } = await db
    .from("classes")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at");
  const allClasses = (allClassesData ?? []) as Class[];

  // Signed URL for the photo if one exists
  let signedUrl: string | null = null;
  if (material.photo_url) {
    const { data } = await supabase.storage
      .from("materials")
      .createSignedUrl(material.photo_url, 3600);
    signedUrl = data?.signedUrl ?? null;
  }

  return (
    <MaterialDetailClient
      profile={profile}
      allClasses={allClasses}
      material={material}
      classInfo={classInfo}
      signedUrl={signedUrl}
    />
  );
}

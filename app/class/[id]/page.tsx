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

  const { data: profileData } = await db.from("profiles").select("*").eq("id", user.id).single();
  if (!profileData) redirect("/login");
  const profile = profileData as Profile;

  // Fetch this class (verify ownership)
  const { data: classData } = await db.from("classes").select("*").eq("id", id).eq("student_id", user.id).single();
  if (!classData) notFound();
  const cls = classData as Class;

  // Fetch all student's classes (for the assignment modal class selector)
  const { data: allClassesData } = await db.from("classes").select("*").eq("student_id", user.id).order("created_at");
  const allClasses = (allClassesData ?? []) as Class[];

  // Fetch materials for this class
  const { data: materialsData } = await db
    .from("materials")
    .select("*")
    .eq("class_id", id)
    .order("created_at", { ascending: false });
  const materials = (materialsData ?? []) as Material[];

  // Fetch assignments for this class
  const { data: assignmentsData } = await db
    .from("assignments")
    .select("*")
    .eq("class_id", id)
    .order("due_date", { ascending: true });
  const assignments = (assignmentsData ?? []) as Assignment[];

  return (
    <ClassDetailClient
      profile={profile}
      cls={cls}
      allClasses={allClasses}
      materials={materials}
      assignments={assignments}
    />
  );
}

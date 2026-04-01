import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentDashboard from "./components/StudentDashboard";
import ParentDashboard from "./components/ParentDashboard";
import type { Profile, Class, Assignment, Message, StudySession, Material } from "@/lib/supabase/types";

export default async function Home() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: profileData } = await db.from("profiles").select("*").eq("id", user.id).single();
  if (!profileData) redirect("/login");
  const profile = profileData as Profile;

  const today = new Date().toISOString().split("T")[0];

  if (profile.role === "parent") {
    const { data: links } = await db.from("family_links").select("student_id").eq("parent_id", user.id);
    const studentIds: string[] = (links ?? []).map((l: { student_id: string }) => l.student_id);

    const { data: studentsData } = studentIds.length > 0
      ? await db.from("profiles").select("*").in("id", studentIds)
      : { data: [] };

    const { data: assignmentsData } = studentIds.length > 0
      ? await db.from("assignments").select("*, classes(name, color)").in("student_id", studentIds)
          .eq("completed", false).gte("due_date", today).order("due_date", { ascending: true }).limit(10)
      : { data: [] };

    const { data: messagesData } = await db.from("messages")
      .select("*, sender:profiles!sender_id(full_name)").eq("recipient_id", user.id)
      .order("created_at", { ascending: false }).limit(5);

    return (
      <ParentDashboard
        profile={profile}
        students={(studentsData ?? []) as Profile[]}
        assignments={(assignmentsData ?? []) as (Assignment & { classes: { name: string; color: string } | null })[]}
        messages={(messagesData ?? []) as (Message & { sender: { full_name: string | null } | null })[]}
      />
    );
  }

  // Student view
  const { data: classesData } = await db.from("classes").select("*").eq("student_id", user.id).order("created_at", { ascending: true });
  const { data: assignmentsData } = await db.from("assignments").select("*, classes(name, color)")
    .eq("student_id", user.id).eq("completed", false).gte("due_date", today)
    .order("due_date", { ascending: true }).limit(8);
  const { data: studySessionsData } = await db.from("study_sessions").select("*")
    .eq("student_id", user.id).eq("scheduled_date", today).order("created_at", { ascending: true });
  const { data: messagesData } = await db.from("messages")
    .select("*, sender:profiles!sender_id(full_name)").eq("recipient_id", user.id)
    .eq("read", false).order("created_at", { ascending: false }).limit(3);

  // Materials added in the last 48 hours — shown on dashboard for class confirmation
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: recentMaterialsData } = await db.from("materials").select("*")
    .eq("student_id", user.id).gte("created_at", cutoff)
    .order("created_at", { ascending: false }).limit(10);

  return (
    <StudentDashboard
      profile={profile}
      classes={(classesData ?? []) as Class[]}
      assignments={(assignmentsData ?? []) as (Assignment & { classes: { name: string; color: string } | null })[]}
      studySessions={(studySessionsData ?? []) as StudySession[]}
      messages={(messagesData ?? []) as (Message & { sender: { full_name: string | null } | null })[]}
      recentMaterials={(recentMaterialsData ?? []) as Material[]}
    />
  );
}

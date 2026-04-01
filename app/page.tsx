import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentDashboard from "./components/StudentDashboard";
import ParentDashboard from "./components/ParentDashboard";
import type { Profile, Class, Assignment, Message, StudySession, Material } from "@/lib/supabase/types";

export default async function Home() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Phase 1: profile (determines which dashboard to render)
  const { data: profileData } = await db.from("profiles").select("*").eq("id", user.id).single();
  if (!profileData) redirect("/login");
  const profile = profileData as Profile;

  const today  = new Date().toISOString().split("T")[0];
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  if (profile.role === "parent") {
    const { data: links } = await db.from("family_links").select("student_id").eq("parent_id", user.id);
    const studentIds: string[] = (links ?? []).map((l: { student_id: string }) => l.student_id);

    // Phase 2 (parent): students + assignments + messages in parallel
    const [studentsResult, assignmentsResult, messagesResult] = await Promise.all([
      studentIds.length > 0
        ? db.from("profiles").select("*").in("id", studentIds)
        : Promise.resolve({ data: [] }),
      studentIds.length > 0
        ? db.from("assignments").select("*, classes(name, color)").in("student_id", studentIds)
            .eq("completed", false).gte("due_date", today).order("due_date", { ascending: true }).limit(10)
        : Promise.resolve({ data: [] }),
      db.from("messages").select("*, sender:profiles!sender_id(full_name)")
        .eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(5),
    ]);

    return (
      <ParentDashboard
        profile={profile}
        students={(studentsResult.data ?? []) as Profile[]}
        assignments={(assignmentsResult.data ?? []) as (Assignment & { classes: { name: string; color: string } | null })[]}
        messages={(messagesResult.data ?? []) as (Message & { sender: { full_name: string | null } | null })[]}
      />
    );
  }

  // Phase 2 (student): all five queries in parallel
  const [classesResult, assignmentsResult, sessionsResult, messagesResult, recentMaterialsResult] = await Promise.all([
    db.from("classes").select("*").eq("student_id", user.id).order("created_at", { ascending: true }),
    db.from("assignments").select("*, classes(name, color)")
      .eq("student_id", user.id).eq("completed", false).gte("due_date", today)
      .order("due_date", { ascending: true }).limit(8),
    db.from("study_sessions").select("*")
      .eq("student_id", user.id).eq("scheduled_date", today).order("created_at", { ascending: true }),
    db.from("messages").select("*, sender:profiles!sender_id(full_name)")
      .eq("recipient_id", user.id).eq("read", false).order("created_at", { ascending: false }).limit(3),
    db.from("materials").select("*")
      .eq("student_id", user.id).gte("created_at", cutoff)
      .order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <StudentDashboard
      profile={profile}
      classes={(classesResult.data ?? []) as Class[]}
      assignments={(assignmentsResult.data ?? []) as (Assignment & { classes: { name: string; color: string } | null })[]}
      studySessions={(sessionsResult.data ?? []) as StudySession[]}
      messages={(messagesResult.data ?? []) as (Message & { sender: { full_name: string | null } | null })[]}
      recentMaterials={(recentMaterialsResult.data ?? []) as Material[]}
    />
  );
}

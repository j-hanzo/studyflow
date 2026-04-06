"use client";

import Link from "next/link";
import {
  Camera, Bell, CheckCircle2, Clock, Sparkles,
  ChevronRight, ChevronLeft, Plus, StickyNote, FileText, ClipboardList,
  CalendarDays, X,
} from "lucide-react";
import Sidebar from "./Sidebar";
import AddClassModal from "./AddClassModal";
import AddAssignmentModal from "./AddAssignmentModal";
import type { Profile, Class, Assignment, StudySession, Message, Material } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  profile: Profile;
  classes: Class[];
  assignments: (Assignment & { classes: { name: string; color: string } | null })[];
  studySessions: StudySession[];
  messages: (Message & { sender: { full_name: string | null } | null })[];
  recentMaterials: Material[];
}

const colorMap: Record<string, string> = {
  "bg-emerald-500": "bg-emerald-500",
  "bg-indigo-500": "bg-indigo-500",
  "bg-amber-500": "bg-amber-500",
  "bg-rose-500": "bg-rose-500",
  "bg-violet-500": "bg-violet-500",
  "bg-blue-500": "bg-blue-500",
};

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

export default function StudentDashboard({ profile, classes, assignments, studySessions, messages, recentMaterials }: Props) {
  const [sessions, setSessions] = useState(studySessions);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // On mobile, default both panels to hidden
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) {
      setSidebarOpen(false);
      setCalendarOpen(false);
    }
  }, []);

  // Mini calendar state
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const supabase = createClient();
  const router = useRouter();
  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  // Mini calendar computed values
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calendarCells = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const assignmentsByDate = assignments.reduce<Record<string, number>>((acc, a) => {
    const d = a.due_date.slice(0, 10);
    acc[d] = (acc[d] ?? 0) + 1;
    return acc;
  }, {});
  const selectedDateAssignments = assignments.filter((a) => a.due_date.slice(0, 10) === selectedDate);
  const selectedDateSessions = sessions.filter((s) => s.scheduled_date === selectedDate);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const [inbox, setInbox] = useState(recentMaterials);

  // Stat bar calculations
  const materialsToFile = inbox.length;

  function daysFromToday(dateStr: string) {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
  }

  const tasksThisWeek = sessions.filter((s) => {
    const d = daysFromToday(s.scheduled_date);
    return !s.completed && d >= 0 && d <= 6;
  }).length;
  const tasksNextWeek = sessions.filter((s) => {
    const d = daysFromToday(s.scheduled_date);
    return !s.completed && d >= 7 && d <= 13;
  }).length;

  const thisWeekAssignments = assignments.filter((a) => {
    const d = daysUntil(a.due_date);
    return !a.completed && d >= 0 && d <= 6;
  });
  const nextWeekAssignments = assignments.filter((a) => {
    const d = daysUntil(a.due_date);
    return !a.completed && d >= 7 && d <= 13;
  });
  const overdueAssignments = assignments.filter((a) => {
    return !a.completed && daysUntil(a.due_date) < 0;
  });

  const assignmentsThisWeek = thisWeekAssignments.length;
  const assignmentsNextWeek = nextWeekAssignments.length;

  const examsThisWeek = thisWeekAssignments.filter((a) => a.type === "exam").length;
  const examsNextWeek = nextWeekAssignments.filter((a) => a.type === "exam").length;

  async function moveToClass(materialId: string, classId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("materials").update({ class_id: classId }).eq("id", materialId);
    setInbox((prev) => prev.filter((m) => m.id !== materialId));
  }

  async function toggleSession(id: string, completed: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("study_sessions") as any).update({ completed: !completed }).eq("id", id);
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, completed: !completed } : s));
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ── Floating sidebar caret toggle ── */}
      <button
        onClick={() => setSidebarOpen((o) => !o)}
        style={{ left: sidebarOpen ? "244px" : "12px" }}
        className="fixed top-5 z-50 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center transition-[left] duration-300 ease-in-out hover:bg-slate-50"
        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        <ChevronLeft className={`w-3 h-3 text-slate-500 transition-transform duration-300 ${sidebarOpen ? "" : "rotate-180"}`} />
      </button>

      {/* ── Floating calendar toggle ── */}
      <button
        onClick={() => setCalendarOpen((o) => !o)}
        style={{ right: calendarOpen ? "324px" : "12px" }}
        className="fixed top-5 z-50 w-6 h-6 rounded-md bg-white border border-slate-200 shadow-md flex items-center justify-center transition-[right] duration-300 ease-in-out hover:bg-slate-50"
        title={calendarOpen ? "Hide calendar" : "Show calendar"}
      >
        <CalendarDays className={`w-3 h-3 ${calendarOpen ? "text-indigo-600" : "text-slate-500"}`} />
      </button>
      {showAddClass && (
        <AddClassModal
          studentId={profile.id}
          onClose={() => setShowAddClass(false)}
          onSaved={() => { setShowAddClass(false); router.refresh(); }}
        />
      )}
      {showAddAssignment && (
        <AddAssignmentModal
          studentId={profile.id}
          classes={classes}
          onClose={() => setShowAddAssignment(false)}
          onSaved={() => { setShowAddAssignment(false); router.refresh(); }}
        />
      )}

      {/* ── Left sidebar with slide animation ── */}
      <div className={`flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${sidebarOpen ? "w-64" : "w-0"}`} style={{ transitionProperty: "width" }}>
        <Sidebar mode="student" classes={classes} profile={profile} onAddClass={() => setShowAddClass(true)} />
      </div>

      <main className="flex-1 overflow-auto min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{greeting}, {firstName} 👋</h1>
            <p className="text-sm text-slate-500">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              {profile.grade ? ` · ${profile.grade}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/capture"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Camera className="w-4 h-4" />
              Upload Material
            </Link>
            <button className="relative w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <Bell className="w-4 h-4 text-slate-600" />
              {messages.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
              )}
            </button>
          </div>
        </header>

        <div className="px-8 py-6 space-y-8">

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {/* Materials to File */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Materials to File</p>
              <p className="text-5xl font-bold text-slate-900">{materialsToFile}</p>
              <p className="mt-3 text-xs text-slate-400">
                {materialsToFile === 0 ? "All organized!" : materialsToFile === 1 ? "item needs filing" : "items need filing"}
              </p>
            </div>

            {/* Tasks to Complete */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Tasks to Complete</p>
              <div className="space-y-2.5">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-bold text-slate-900">{tasksThisWeek}</span>
                  <span className="text-sm text-slate-400 font-medium">| this week</span>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-bold text-slate-300">{tasksNextWeek}</span>
                  <span className="text-sm text-slate-300 font-medium">| next week</span>
                </div>
              </div>
            </div>

            {/* Assignments Due */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Assignments Due</p>
              <div className="space-y-2.5">
                <div className="flex items-baseline gap-2.5">
                  <span className={`text-3xl font-bold ${assignmentsThisWeek > 0 ? "text-amber-500" : "text-slate-900"}`}>
                    {assignmentsThisWeek}
                  </span>
                  <span className="text-sm text-slate-400 font-medium">| this week</span>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-bold text-slate-300">{assignmentsNextWeek}</span>
                  <span className="text-sm text-slate-300 font-medium">| next week</span>
                </div>
              </div>
            </div>

            {/* Upcoming Exams */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Upcoming Exams</p>
              <div className="space-y-2.5">
                <div className="flex items-baseline gap-2.5">
                  <span className={`text-3xl font-bold ${examsThisWeek > 0 ? "text-rose-500" : "text-slate-900"}`}>
                    {examsThisWeek}
                  </span>
                  <span className="text-sm text-slate-400 font-medium">| this week</span>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-bold text-slate-300">{examsNextWeek}</span>
                  <span className="text-sm text-slate-300 font-medium">| next week</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Recently Uploaded Materials ── */}
          {inbox.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Recently Uploaded Materials</h2>
                  <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                    {inbox.length} to file
                  </span>
                </div>
                <Link href="/capture" className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
                  <Camera className="w-3 h-3" /> Add more
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {inbox.map((m) => {
                  const cls = classes.find((c) => c.id === m.class_id);
                  const isPdf = m.photo_url?.toLowerCase().endsWith(".pdf");
                  const typeIcon = m.type === "notes"
                    ? <StickyNote className="w-4 h-4 text-slate-400" />
                    : m.type === "handout"
                    ? <FileText className="w-4 h-4 text-blue-400" />
                    : <ClipboardList className="w-4 h-4 text-amber-400" />;
                  return (
                    <div key={m.id} className="bg-white rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all p-4 flex flex-col gap-3">
                      {/* Thumbnail area */}
                      <div className="w-full h-24 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                        {isPdf
                          ? <div className="flex flex-col items-center gap-1"><FileText className="w-8 h-8 text-rose-400" /><span className="text-[10px] font-bold text-rose-400 uppercase">PDF</span></div>
                          : <div className="flex flex-col items-center gap-1">{typeIcon}<span className="text-[10px] text-slate-400 capitalize">{m.type}</span></div>
                        }
                      </div>
                      {/* Class chip */}
                      {cls && (
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colorMap[cls.color] ?? "bg-slate-400"}`} />
                          <span className="text-xs font-medium text-slate-600 truncate">{cls.name}</span>
                        </div>
                      )}
                      {/* Title */}
                      <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 flex-1">{m.title}</p>
                      {/* CTA */}
                      <Link
                        href={`/material/${m.id}`}
                        className="text-xs text-amber-600 font-semibold hover:text-amber-700 flex items-center gap-1"
                      >
                        Need to file <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Main content + right column ── */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-8">

              {/* Due This Week */}
              {thisWeekAssignments.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">Due This Week</h2>
                      <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">{thisWeekAssignments.length}</span>
                    </div>
                    <Link href="/calendar" className="text-xs text-slate-400 hover:text-indigo-600 font-medium flex items-center gap-1">
                      View calendar <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {thisWeekAssignments.map((a) => {
                      const days = daysUntil(a.due_date);
                      return (
                        <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2 hover:border-indigo-200 hover:shadow-sm transition-all">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colorMap[a.classes?.color ?? ""] ?? "bg-slate-300"}`} />
                            <span className="text-xs text-slate-500 truncate font-medium">{a.classes?.name ?? "—"}</span>
                            <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${a.type === "exam" ? "bg-rose-50 text-rose-600" : a.type === "quiz" ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"}`}>
                              {a.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{formatDate(a.due_date)}</p>
                          <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 flex-1">{a.title}</p>
                          <div className="flex items-center justify-between mt-auto pt-1 border-t border-slate-100">
                            <span className={`text-xs font-bold ${days <= 2 ? "text-rose-500" : "text-amber-500"}`}>
                              {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d left`}
                            </span>
                            <Link href="/calendar" className="text-[11px] text-indigo-500 font-medium hover:underline">
                              View →
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Due Next Week */}
              {nextWeekAssignments.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">Due Next Week</h2>
                      <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">{nextWeekAssignments.length}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {nextWeekAssignments.map((a) => (
                      <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2 hover:border-indigo-200 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colorMap[a.classes?.color ?? ""] ?? "bg-slate-300"}`} />
                          <span className="text-xs text-slate-500 truncate font-medium">{a.classes?.name ?? "—"}</span>
                          <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${a.type === "exam" ? "bg-rose-50 text-rose-600" : a.type === "quiz" ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"}`}>
                            {a.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{formatDate(a.due_date)}</p>
                        <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 flex-1">{a.title}</p>
                        <div className="flex items-center justify-between mt-auto pt-1 border-t border-slate-100">
                          <span className="text-xs font-medium text-slate-400">{daysUntil(a.due_date)}d away</span>
                          <Link href="/calendar" className="text-[11px] text-indigo-500 font-medium hover:underline">View →</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overdue */}
              {overdueAssignments.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-rose-600">Overdue</h2>
                      <span className="text-xs bg-rose-100 text-rose-600 font-semibold px-2 py-0.5 rounded-full">{overdueAssignments.length}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {overdueAssignments.map((a) => (
                      <div key={a.id} className="bg-white rounded-xl border border-rose-200 p-4 flex flex-col gap-2 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colorMap[a.classes?.color ?? ""] ?? "bg-slate-300"}`} />
                          <span className="text-xs text-slate-500 truncate font-medium">{a.classes?.name ?? "—"}</span>
                          <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${a.type === "exam" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}>
                            {a.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{formatDate(a.due_date)}</p>
                        <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 flex-1">{a.title}</p>
                        <div className="flex items-center justify-between mt-auto pt-1 border-t border-rose-100">
                          <span className="text-xs font-bold text-rose-500">{Math.abs(daysUntil(a.due_date))}d overdue</span>
                          <Link href="/calendar" className="text-[11px] text-indigo-500 font-medium hover:underline">View →</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {thisWeekAssignments.length === 0 && nextWeekAssignments.length === 0 && overdueAssignments.length === 0 && (
                <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-700 mb-1">You&apos;re all caught up!</p>
                  <p className="text-xs text-slate-400 mb-4">No assignments due in the next two weeks.</p>
                  <button
                    onClick={() => setShowAddAssignment(true)}
                    className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg"
                  >
                    <Plus className="w-4 h-4" /> Add assignment
                  </button>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* AI Tutor CTA */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wide">AI Tutor</span>
                </div>
                <p className="text-sm font-medium mb-1">Ready to help you study</p>
                <p className="text-xs text-indigo-200 leading-relaxed">
                  Ask anything about your classes, get practice questions, or build a study plan.
                </p>
                <Link
                  href="/tutor"
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg w-fit"
                >
                  Open AI Tutor <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Today's study sessions */}
              {sessions.filter(s => daysFromToday(s.scheduled_date) === 0).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Today&apos;s Sessions</h3>
                  <div className="space-y-2">
                    {sessions.filter(s => daysFromToday(s.scheduled_date) === 0).map((s) => (
                      <div key={s.id} className={`bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 ${s.completed ? "opacity-50" : ""}`}>
                        <button
                          onClick={() => toggleSession(s.id, s.completed)}
                          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${s.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-emerald-400"}`}
                        >
                          {s.completed && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${s.completed ? "line-through text-slate-400" : "text-slate-800"}`}>{s.title}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5 text-slate-400" />
                            <span className="text-[10px] text-slate-400">{s.duration_minutes} min</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages from parent */}
              {messages.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Messages</h3>
                  {messages.slice(0, 2).map((m) => (
                    <div key={m.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-800">
                          {m.sender?.full_name?.[0] ?? "P"}
                        </div>
                        <span className="text-xs font-semibold text-amber-800">{m.sender?.full_name ?? "Parent"}</span>
                        <span className="text-xs text-amber-500 ml-auto">{new Date(m.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-amber-800">&quot;{m.body}&quot;</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick capture */}
              <Link
                href="/capture"
                className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-4 text-center hover:border-indigo-300 flex flex-col items-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-sm font-medium text-slate-700">Quick Capture</p>
                <p className="text-xs text-slate-400">Photo, scan, or paste text</p>
              </Link>

              {/* Add assignment */}
              <button
                onClick={() => setShowAddAssignment(true)}
                className="w-full bg-white rounded-xl border-2 border-dashed border-slate-200 p-4 text-center hover:border-indigo-300 flex flex-col items-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <p className="text-sm font-medium text-slate-700">Add Assignment</p>
                <p className="text-xs text-slate-400">Exam, quiz, or homework</p>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Right calendar panel with slide animation ── */}
      <div className={`flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${calendarOpen ? "w-80" : "w-0"}`}>
        <div className="w-80 min-h-screen bg-white border-l border-slate-200 flex flex-col">
          {/* Panel header */}
          <div className="px-4 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Calendar</p>
              <p className="text-sm font-bold text-slate-900">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
            </div>
            <button
              onClick={() => setCalendarOpen(false)}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Mini month calendar */}
          <div className="px-4 py-4 border-b border-slate-100 flex-shrink-0">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <p className="text-sm font-semibold text-slate-900">{MONTH_NAMES[viewMonth]} {viewYear}</p>
              <button onClick={nextMonth} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {["S","M","T","W","T","F","S"].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-semibold text-slate-400">{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {calendarCells.map((day, i) => {
                if (!day) return <div key={i} />;
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const count = assignmentsByDate[dateStr] ?? 0;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative flex flex-col items-center justify-center h-8 rounded-lg text-xs font-medium transition-all
                      ${isToday ? "bg-indigo-600 text-white" : ""}
                      ${isSelected && !isToday ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-300" : ""}
                      ${!isToday && !isSelected ? "text-slate-700 hover:bg-slate-100" : ""}
                    `}
                  >
                    {day}
                    {count > 0 && (
                      <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isToday ? "bg-white/70" : "bg-rose-400"}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected date events */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {selectedDate === todayStr ? "Today" : new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </p>
            {selectedDateAssignments.length === 0 && selectedDateSessions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Nothing scheduled</p>
            ) : (
              <div className="space-y-2">
                {selectedDateAssignments.map((a) => (
                  <div key={a.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colorMap[a.classes?.color ?? ""] ?? "bg-slate-300"}`} />
                      <span className="text-[10px] font-medium text-slate-500 truncate">{a.classes?.name}</span>
                      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${a.type === "exam" ? "bg-rose-100 text-rose-600" : a.type === "quiz" ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"}`}>
                        {a.type}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 leading-snug">{a.title}</p>
                  </div>
                ))}
                {selectedDateSessions.map((s) => (
                  <div key={s.id} className={`rounded-xl p-3 border ${s.completed ? "bg-emerald-50 border-emerald-100 opacity-60" : "bg-teal-50 border-teal-100"}`}>
                    <p className="text-xs font-semibold text-teal-800 leading-snug">{s.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-teal-500" />
                      <span className="text-[10px] text-teal-600">{s.duration_minutes} min</span>
                      {s.completed && <span className="ml-auto text-[10px] text-emerald-600 font-medium">Done</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0">
            <Link href="/calendar" className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
              Open full calendar <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  Camera, Bell, CheckCircle2, Clock, Sparkles,
  ChevronRight, ChevronLeft, Plus, StickyNote, FileText, ClipboardList,
  CalendarDays, X, Trash2,
} from "lucide-react";
import Sidebar from "./Sidebar";
import AddClassModal from "./AddClassModal";
import AddAssignmentModal from "./AddAssignmentModal";
import type { Profile, Class, Assignment, StudySession, Message, Material } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useRef } from "react";
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

const SESSION_TYPES = [
  { value: "study",      label: "Study",      dot: "bg-teal-400" },
  { value: "exam",       label: "Exam",       dot: "bg-rose-500" },
  { value: "quiz",       label: "Quiz",       dot: "bg-amber-400" },
  { value: "assignment", label: "Assignment", dot: "bg-indigo-400" },
] as const;
type SessionType = typeof SESSION_TYPES[number]["value"];

function sessionBlockClasses(type: string, completed: boolean) {
  if (completed) return "bg-emerald-50 border-emerald-200 opacity-60";
  switch (type) {
    case "exam":       return "bg-rose-100 border-rose-300 hover:bg-rose-200";
    case "quiz":       return "bg-amber-100 border-amber-300 hover:bg-amber-200";
    case "assignment": return "bg-indigo-100 border-indigo-300 hover:bg-indigo-200";
    default:           return "bg-teal-100 border-teal-300 hover:bg-teal-200";
  }
}
function sessionTextClass(type: string) {
  switch (type) {
    case "exam":       return "text-rose-800";
    case "quiz":       return "text-amber-800";
    case "assignment": return "text-indigo-800";
    default:           return "text-teal-800";
  }
}
function sessionSubTextClass(type: string) {
  switch (type) {
    case "exam":       return "text-rose-500";
    case "quiz":       return "text-amber-500";
    case "assignment": return "text-indigo-500";
    default:           return "text-teal-500";
  }
}

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
  const [calendarOpen, setCalendarOpen] = useState(true);

  // On mobile, default both panels to hidden
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) {
      setSidebarOpen(false);
      setCalendarOpen(false);
    }
  }, []);

  // Keep sessions ref in sync for use inside drag closure
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);

  // Window-level drag handlers (set up once)
  useEffect(() => {
    const SLOT_PX = 48; // px per 30-min slot — mirrors SLOT_H
    const T_START = 7;  // timeline start hour

    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const delta = e.pageY - d.startY;
      if (Math.abs(delta) > 4) d.moved = true;
      const maxTop = 15 * 2 * SLOT_PX - SLOT_PX; // (22-7)*2 slots - 1
      d.currentTop = Math.max(0, Math.min(d.origTop + delta, maxTop));
      if (d.moved) setDragTop({ sessionId: d.sessionId, top: d.currentTop });
    };

    const onUp = () => {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;

      if (d.moved) {
        // Snap to nearest 15-min mark
        const totalMins = T_START * 60 + (d.currentTop / SLOT_PX) * 30;
        const snapped   = Math.round(totalMins / 15) * 15;
        const h = Math.floor(snapped / 60);
        const m = snapped % 60;
        const newTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (createClient() as any).from("study_sessions").update({ start_time: newTime }).eq("id", d.sessionId);
        setSessions((prev) => prev.map((s) =>
          s.id === d.sessionId ? { ...s, start_time: newTime + ":00" } : s
        ));
        setDragTop(null);
      } else {
        setDragTop(null);
        // Treat as a click — open edit modal
        const session = sessionsRef.current.find((s) => s.id === d.sessionId);
        if (session) {
          setPopover({
            open: true,
            sessionId: session.id,
            title: session.title,
            date: session.scheduled_date,
            startTime: session.start_time?.slice(0, 5) ?? "09:00",
            durationMinutes: session.duration_minutes,
            completed: session.completed,
            type: (session.type as SessionType) ?? "study",
          });
        }
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Mini calendar state
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const supabase = createClient();
  const router = useRouter();
  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  // ── Drag-to-reschedule ───────────────────────────────────────────
  const dragRef = useRef<{
    sessionId: string; startY: number; origTop: number;
    currentTop: number; moved: boolean;
  } | null>(null);
  const sessionsRef = useRef(sessions);
  const [dragTop, setDragTop] = useState<{ sessionId: string; top: number } | null>(null);

  // Mini calendar computed values
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calendarCells = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Per-date maps for calendar dot indicators
  const assignmentTypesByDate = assignments.reduce<Record<string, Set<string>>>((acc, a) => {
    const d = a.due_date.slice(0, 10);
    if (!acc[d]) acc[d] = new Set();
    acc[d].add(a.type);
    return acc;
  }, {});
  const sessionTypesByDate = sessions.reduce<Record<string, Set<string>>>((acc, s) => {
    if (!acc[s.scheduled_date]) acc[s.scheduled_date] = new Set();
    acc[s.scheduled_date].add((s.type as string) ?? "study");
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

  // ── Session popover ──────────────────────────────────────────────
  interface SessionPopover {
    open: boolean;
    sessionId: string | null;
    title: string;
    type: SessionType;
    date: string;
    startTime: string;
    durationMinutes: number;
    completed: boolean;
  }
  const [popover, setPopover] = useState<SessionPopover>({
    open: false, sessionId: null, title: "", type: "study", date: todayStr, startTime: "09:00", durationMinutes: 60, completed: false,
  });

  function openPopoverNew(slotTime: string) {
    setPopover({ open: true, sessionId: null, title: "", type: "study", date: selectedDate, startTime: slotTime, durationMinutes: 60, completed: false });
  }
  function openPopoverEdit(session: typeof sessions[number]) {
    setPopover({
      open: true,
      sessionId: session.id,
      title: session.title,
      type: (session.type as SessionType) ?? "study",
      date: session.scheduled_date,
      startTime: session.start_time?.slice(0, 5) ?? "09:00",
      durationMinutes: session.duration_minutes,
      completed: session.completed,
    });
  }
  async function saveSession() {
    if (!popover.title.trim()) return;
    if (popover.sessionId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("study_sessions").update({
        title: popover.title,
        type: popover.type,
        scheduled_date: popover.date,
        start_time: popover.startTime,
        duration_minutes: popover.durationMinutes,
        completed: popover.completed,
      }).eq("id", popover.sessionId);
      setSessions((prev) => prev.map((s) =>
        s.id === popover.sessionId
          ? { ...s, title: popover.title, type: popover.type, scheduled_date: popover.date, start_time: popover.startTime + ":00", duration_minutes: popover.durationMinutes, completed: popover.completed }
          : s
      ));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from("study_sessions").insert({
        student_id: profile.id,
        title: popover.title,
        type: popover.type,
        scheduled_date: popover.date,
        start_time: popover.startTime,
        duration_minutes: popover.durationMinutes,
        completed: false,
      }).select().single();
      if (data) setSessions((prev) => [...prev, data]);
    }
    setPopover((p) => ({ ...p, open: false }));
  }
  async function deleteSession() {
    if (!popover.sessionId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("study_sessions").delete().eq("id", popover.sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== popover.sessionId));
    setPopover((p) => ({ ...p, open: false }));
  }

  // ── Timeline helpers ─────────────────────────────────────────────
  const TIMELINE_START = 7;  // 7 AM
  const TIMELINE_END   = 22; // 10 PM
  const SLOT_H         = 48; // px per 30-min slot
  const timeSlots = Array.from({ length: (TIMELINE_END - TIMELINE_START) * 2 }, (_, i) => {
    const totalMins = TIMELINE_START * 60 + i * 30;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const label = m === 0
      ? `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`
      : "";
    return { h, m, label, timeStr: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` };
  });
  function slotTop(startTime: string): number {
    const [h, m] = startTime.split(":").map(Number);
    return ((h - TIMELINE_START) * 60 + (m || 0)) / 30 * SLOT_H;
  }
  function slotHeight(mins: number): number {
    return Math.max(mins / 30 * SLOT_H, SLOT_H * 0.6);
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

  const examsThisWeek = thisWeekAssignments.filter((a) => a.type === "exam" || a.type === "quiz").length;
  const examsNextWeek = nextWeekAssignments.filter((a) => a.type === "exam" || a.type === "quiz").length;

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Exams &amp; Quizzes</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-8">

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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                const aTypes = assignmentTypesByDate[dateStr];
                const sTypes = sessionTypesByDate[dateStr];
                const hasDots = (aTypes && aTypes.size > 0) || (sTypes && sTypes.size > 0);
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
                    <span className="leading-none">{day}</span>
                    {hasDots && (
                      <span className="flex items-center gap-[2px] mt-[2px]">
                        {aTypes?.has("exam")       && <span className={`w-1 h-1 rounded-full ${isToday ? "bg-white/80" : "bg-rose-500"}`} />}
                        {aTypes?.has("quiz")       && <span className={`w-1 h-1 rounded-full ${isToday ? "bg-white/80" : "bg-amber-400"}`} />}
                        {aTypes?.has("assignment") && <span className={`w-1 h-1 rounded-full ${isToday ? "bg-white/80" : "bg-indigo-400"}`} />}
                        {sTypes?.has("study")      && <span className={`w-1 h-1 rounded-full ${isToday ? "bg-white/80" : "bg-teal-400"}`} />}
                        {sTypes?.has("exam")       && <span className={`w-1 h-1 rounded-full ${isToday ? "bg-white/80" : "bg-rose-500"}`} />}
                        {sTypes?.has("quiz")       && <span className={`w-1 h-1 rounded-full ${isToday ? "bg-white/80" : "bg-amber-400"}`} />}
                        {sTypes?.has("assignment") && <span className={`w-1 h-1 rounded-full ${isToday ? "bg-white/80" : "bg-indigo-400"}`} />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily timeline */}
          <div className="flex-1 overflow-y-auto">
            {/* Day header */}
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 flex-shrink-0 sticky top-0 bg-white z-10">
              <p className="text-xs font-semibold text-slate-700">
                {selectedDate === todayStr
                  ? "Today"
                  : new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
              <button
                onClick={() => openPopoverNew("09:00")}
                className="text-[10px] text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            {/* Assignments due banner */}
            {selectedDateAssignments.length > 0 && (
              <div className="px-4 py-2 border-b border-amber-100 bg-amber-50 space-y-1 flex-shrink-0">
                {selectedDateAssignments.map((a) => (
                  <div key={a.id} className="flex items-center gap-1.5 text-[10px]">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.type === "exam" ? "bg-rose-400" : "bg-amber-400"}`} />
                    <span className="font-medium text-slate-700 truncate">{a.title}</span>
                    <span className={`ml-auto flex-shrink-0 font-semibold ${a.type === "exam" ? "text-rose-500" : "text-amber-600"}`}>
                      {a.type} due
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Time grid */}
            <div className="relative" style={{ height: `${timeSlots.length * SLOT_H}px` }}>
              {timeSlots.map((slot, i) => (
                <div
                  key={i}
                  onClick={() => { if (!dragRef.current?.moved) openPopoverNew(slot.timeStr); }}
                  className="absolute left-0 right-0 border-b border-slate-100 hover:bg-indigo-50/30 cursor-pointer transition-colors flex items-start"
                  style={{ top: i * SLOT_H, height: SLOT_H }}
                >
                  <span className="text-[9px] text-slate-400 w-12 pl-3 pt-1 flex-shrink-0 select-none">
                    {slot.label}
                  </span>
                </div>
              ))}

              {/* Session blocks */}
              {selectedDateSessions.map((s) => {
                const origTop = slotTop(s.start_time ?? "09:00");
                const top     = dragTop?.sessionId === s.id ? dragTop.top : origTop;
                const height  = slotHeight(s.duration_minutes);
                const isDragging = dragTop?.sessionId === s.id;
                const sType   = (s.type as SessionType) ?? "study";
                return (
                  <div
                    key={s.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      dragRef.current = { sessionId: s.id, startY: e.pageY, origTop, currentTop: origTop, moved: false };
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute left-12 right-2 rounded-lg px-2 py-1 border select-none transition-shadow
                      ${isDragging ? "shadow-lg cursor-grabbing z-20 opacity-90" : "cursor-grab hover:shadow-sm"}
                      ${sessionBlockClasses(sType, s.completed)}`}
                    style={{ top: top + 1, height: height - 2 }}
                  >
                    <p className={`text-[10px] font-semibold truncate leading-tight ${sessionTextClass(sType)}`}>{s.title}</p>
                    {height >= 36 && (
                      <p className={`text-[9px] mt-0.5 ${sessionSubTextClass(sType)}`}>
                        {s.start_time?.slice(0, 5) ?? "09:00"} · {s.duration_minutes}m
                      </p>
                    )}
                    {s.completed && height >= 36 && (
                      <p className="text-[9px] text-emerald-600 font-semibold">Done ✓</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0">
            <Link href="/calendar" className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
              Open full calendar <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Session edit / create modal ── */}
      {popover.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setPopover((p) => ({ ...p, open: false }))}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {popover.sessionId ? "Edit session" : "New session"}
              </h3>
              <button
                onClick={() => setPopover((p) => ({ ...p, open: false }))}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Type selector */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Type</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {SESSION_TYPES.map((t) => {
                    const active = popover.type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setPopover((p) => ({ ...p, type: t.value }))}
                        className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[11px] font-semibold transition-all
                          ${active ? "border-slate-300 bg-slate-900 text-white shadow-sm" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${t.dot}`} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Title</label>
                <input
                  type="text"
                  value={popover.title}
                  onChange={(e) => setPopover((p) => ({ ...p, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && saveSession()}
                  placeholder="e.g. Study for Physics exam"
                  autoFocus
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Date</label>
                <input
                  type="date"
                  value={popover.date}
                  onChange={(e) => setPopover((p) => ({ ...p, date: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Start time + Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Start time</label>
                  <input
                    type="time"
                    value={popover.startTime}
                    onChange={(e) => setPopover((p) => ({ ...p, startTime: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Duration</label>
                  <select
                    value={popover.durationMinutes}
                    onChange={(e) => setPopover((p) => ({ ...p, durationMinutes: Number(e.target.value) }))}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    {[30, 45, 60, 90, 120].map((m) => (
                      <option key={m} value={m}>
                        {m < 60 ? `${m} min` : `${m / 60}h${m % 60 ? ` ${m % 60}m` : ""}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Completed toggle — only for existing sessions */}
            {popover.sessionId && (
              <button
                onClick={() => setPopover((p) => ({ ...p, completed: !p.completed }))}
                className={`w-full mt-4 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  popover.completed
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-600"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  popover.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                }`}>
                  {popover.completed && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                </div>
                {popover.completed ? "Marked as complete" : "Mark as complete"}
              </button>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={saveSession}
                disabled={!popover.title.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                {popover.sessionId ? "Save changes" : "Add session"}
              </button>
              {popover.sessionId && (
                <button
                  onClick={deleteSession}
                  className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

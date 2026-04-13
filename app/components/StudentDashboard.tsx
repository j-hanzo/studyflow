"use client";

import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  ChevronRight, ChevronLeft, Plus, StickyNote, FileText, ClipboardList,
  X, Trash2,
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

// Hex colors for SVG gauge strokes
const gaugeColorMap: Record<string, string> = {
  "bg-emerald-500": "#10b981",
  "bg-indigo-500": "#6366f1",
  "bg-amber-500": "#f59e0b",
  "bg-rose-500": "#f43f5e",
  "bg-violet-500": "#8b5cf6",
  "bg-blue-500": "#3b82f6",
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

function daysFromToday(dateStr: string) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
}

const PAGE_SIZE = 8;

export default function StudentDashboard({ profile, classes, assignments, studySessions, messages: _messages, recentMaterials: _recentMaterials }: Props) {
  const [sessions, setSessions] = useState(studySessions);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [calendarExpanded, setCalendarExpanded] = useState(true);

  // Table state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"due_date" | "status">("due_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

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
    const SLOT_PX = 48;
    const T_START = 7;

    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const delta = e.pageY - d.startY;
      if (Math.abs(delta) > 4) d.moved = true;
      const maxTop = 15 * 2 * SLOT_PX - SLOT_PX;
      d.currentTop = Math.max(0, Math.min(d.origTop + delta, maxTop));
      if (d.moved) setDragTop({ sessionId: d.sessionId, top: d.currentTop });
    };

    const onUp = () => {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;

      if (d.moved) {
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

  // Drag-to-reschedule
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
  const calendarRows: (number | null)[][] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    const row = calendarCells.slice(i, i + 7);
    while (row.length < 7) row.push(null);
    calendarRows.push(row);
  }
  const selectedDay = new Date(selectedDate + "T00:00:00");
  const isCurrentMonth = selectedDay.getFullYear() === viewYear && selectedDay.getMonth() === viewMonth;
  const selectedDayNum = isCurrentMonth ? selectedDay.getDate() : null;
  const activeRowIdx = selectedDayNum
    ? calendarRows.findIndex((row) => row.includes(selectedDayNum))
    : 0;
  const visibleRows = calendarExpanded ? calendarRows : [calendarRows[Math.max(activeRowIdx, 0)]];

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

  function prevDay() {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    const newDate = d.toISOString().slice(0, 10);
    setSelectedDate(newDate);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }
  function nextDay() {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    const newDate = d.toISOString().slice(0, 10);
    setSelectedDate(newDate);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  // Session popover
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

  // Timeline helpers
  const TIMELINE_START = 7;
  const TIMELINE_END   = 22;
  const SLOT_H         = 48;
  const timeSlots = Array.from({ length: (TIMELINE_END - TIMELINE_START) * 2 }, (_, i) => {
    const totalMins = TIMELINE_START * 60 + i * 30;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const label = m === 0 ? `${String(h).padStart(2, "0")}:00` : "";
    return { h, m, label, timeStr: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` };
  });
  function slotTop(startTime: string): number {
    const [h, m] = startTime.split(":").map(Number);
    return ((h - TIMELINE_START) * 60 + (m || 0)) / 30 * SLOT_H;
  }
  function slotHeight(mins: number): number {
    return Math.max(mins / 30 * SLOT_H, SLOT_H * 0.6);
  }

  // ── New stat computations ────────────────────────────────────────
  const assignmentsToComplete = assignments.filter((a) => !a.completed).length;
  const studyMinsToDo = sessions
    .filter((s) => !s.completed && ((s.type as string) === "study" || !(s.type as string)))
    .reduce((sum, s) => sum + s.duration_minutes, 0);
  const studyHoursToDo = Math.round(studyMinsToDo / 60 * 10) / 10;
  const upcomingExams = assignments.filter(
    (a) => !a.completed && (a.type === "exam" || a.type === "quiz") && daysUntil(a.due_date) >= 0
  ).length;

  // ── Table filter / sort / paginate ───────────────────────────────
  const filteredAssignments = assignments.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      (a.classes?.name ?? "").toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q)
    );
  });

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    if (sortField === "due_date") {
      const diff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      return sortDir === "asc" ? diff : -diff;
    } else {
      const statusOrder = (x: typeof a): number => {
        if (x.completed) return 2;
        if (daysUntil(x.due_date) < 0) return 0;
        return 1;
      };
      const diff = statusOrder(a) - statusOrder(b);
      return sortDir === "asc" ? diff : -diff;
    }
  });

  const totalPages = Math.max(1, Math.ceil(sortedAssignments.length / PAGE_SIZE));
  const paginatedAssignments = sortedAssignments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Header date label: "Apr, 2 Thursday"
  const selDateObj = new Date(selectedDate + "T00:00:00");
  const dateLabel = `${selDateObj.toLocaleDateString("en-US", { month: "short" })}, ${selDateObj.getDate()} ${selDateObj.toLocaleDateString("en-US", { weekday: "long" })}`;

  // Gauge SVG constants
  const GAUGE_R = 38;
  const GAUGE_CIRC = 2 * Math.PI * GAUGE_R;
  const GAUGE_ARC  = GAUGE_CIRC * 0.75; // 270°

  return (
    <div className="flex min-h-screen blob-gradient-bg">

      {/* ── Floating sidebar toggle — midpoint sits on panel right edge ── */}
      <button
        onClick={() => setSidebarOpen((o) => !o)}
        style={{ left: sidebarOpen ? "234px" : "0px" }}
        className={`fixed top-5 z-50 transition-[left] duration-300 ease-in-out ${sidebarOpen ? "" : "[transform:scaleX(-1)]"}`}
        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        <Image src="/icons/icon-show-hide-left-panel.svg" alt="" width={44} height={44} />
      </button>

      {/* ── Floating calendar toggle — midpoint sits on panel left edge ── */}
      <button
        onClick={() => setCalendarOpen((o) => !o)}
        style={{ right: calendarOpen ? "618px" : "0px" }}
        className="fixed top-5 z-50 transition-[right] duration-300 ease-in-out"
        title={calendarOpen ? "Hide calendar" : "Show calendar"}
      >
        <Image src="/icons/icon-show-hide-calendar-panel.svg" alt="" width={44} height={44} />
      </button>

      {/* ── Modals ── */}
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

      {/* ── Left sidebar ── */}
      <div
        className={`flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${sidebarOpen ? "w-64" : "w-0"}`}
        style={{ transitionProperty: "width" }}
      >
        <Sidebar mode="student" classes={classes} profile={profile} onAddClass={() => setShowAddClass(true)} />
      </div>

      {/* ── Main area ── */}
      <main className="flex-1 overflow-auto min-w-0">

        {/* ── Header ── */}
        <header className="sticky top-0 z-10 px-14">
          <div className="py-3 flex items-center gap-4 border-b border-white/10">

          {/* Title + upload button — fixed 40px gap between them */}
          <div className="flex items-center gap-[40px] flex-shrink-0">
            <h1 className="text-[36px] font-medium text-white whitespace-nowrap leading-none">{firstName}&apos;s Dashboard</h1>
            <Link
              href="/capture"
              className="flex items-center gap-2 bg-[#E6FF5B] hover:bg-[#d4ec48] text-[#062243] text-[19px] font-medium px-4 py-2 rounded-[6px] transition-colors whitespace-nowrap flex-shrink-0"
            >
              <Image src="/icons/icon-upload.svg" width={26} height={26} alt="" />
              Upload Material
            </Link>
          </div>

          <div className="flex-1" />

          {/* User info */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right hidden md:block">
              <h3 className="text-[29px] font-medium text-white leading-none">{profile.full_name}</h3>
              <p className="text-[16px] text-white/50 mt-1 capitalize">{profile.grade ?? profile.role}</p>
            </div>
            <div className="w-[70px] h-[70px] rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20">
              <Image src="/icons/icon-user.jpg" width={70} height={70} alt="avatar" className="w-full h-full object-cover" />
            </div>
          </div>

          </div>
        </header>

        {/* ── Body ── */}
        <div className="px-14 py-6 space-y-6">

          {/* ── 3 Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Assignments to Complete */}
            <div className="bg-[#0A2637]/75 backdrop-blur-sm rounded-[20px] border border-white/10 p-6 flex flex-col gap-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                Assignments to Complete
              </p>
              <p className="text-[52px] font-bold text-white leading-none">{assignmentsToComplete}</p>
              <p className="text-[13px] text-white/50">
                {assignmentsToComplete === 0 ? "All caught up!" : assignmentsToComplete === 1 ? "pending assignment" : "pending assignments"}
              </p>
            </div>

            {/* Study Hours to Do */}
            <div className="bg-[#0A2637]/75 backdrop-blur-sm rounded-[20px] border border-white/10 p-6 flex flex-col gap-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                Study Hours to Do
              </p>
              <p className="text-[52px] font-bold text-white leading-none">
                {studyHoursToDo}<span className="text-[28px] font-medium text-white/60 ml-1">h</span>
              </p>
              <p className="text-[13px] text-white/50">
                {studyMinsToDo === 0 ? "No sessions scheduled" : "in planned study sessions"}
              </p>
            </div>

            {/* Upcoming Exams */}
            <div className="bg-[#0A2637]/75 backdrop-blur-sm rounded-[20px] border border-white/10 p-6 flex flex-col gap-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                Upcoming Exams
              </p>
              <p className="text-[52px] font-bold text-white leading-none">{upcomingExams}</p>
              <p className="text-[13px] text-white/50">
                {upcomingExams === 0 ? "No exams coming up" : upcomingExams === 1 ? "exam or quiz ahead" : "exams & quizzes ahead"}
              </p>
            </div>

          </div>

          {/* ── Class Gauge Cards ── */}
          {classes.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {classes.map((cls) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const clsAssignments = assignments.filter((a) => (a as any).class_id === cls.id);
                const total     = clsAssignments.length;
                const completed = clsAssignments.filter((a) => a.completed).length;
                const pct       = total > 0 ? completed / total : 0;
                const arcProgress = pct * GAUGE_ARC;
                const strokeColor = gaugeColorMap[cls.color] ?? "#6366f1";
                const perfIcon =
                  pct >= 0.75 ? "/icons/icon-fire.svg" :
                  pct >= 0.5  ? "/icons/icon-satisfied.svg" :
                                 "/icons/icon-unsatisfied.svg";

                return (
                  <div key={cls.id} className="bg-[#0A2637]/75 backdrop-blur-sm rounded-[20px] border border-white/10 p-5 flex flex-col items-center gap-3">
                    <p className="text-[13px] font-semibold text-white text-center w-full truncate">{cls.name}</p>

                    {/* Circular gauge */}
                    <div className="relative w-[110px] h-[110px]">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        {/* Background track */}
                        <circle
                          cx="50" cy="50" r={GAUGE_R}
                          fill="none"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="7"
                          strokeDasharray={`${GAUGE_ARC} ${GAUGE_CIRC}`}
                          strokeLinecap="round"
                          transform="rotate(-135 50 50)"
                        />
                        {/* Progress */}
                        <circle
                          cx="50" cy="50" r={GAUGE_R}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth="7"
                          strokeDasharray={`${arcProgress} ${GAUGE_CIRC}`}
                          strokeLinecap="round"
                          transform="rotate(-135 50 50)"
                          style={{ transition: "stroke-dasharray 0.6s ease" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[22px] font-bold text-white leading-none">
                          {Math.round(pct * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Performance icon + count */}
                    <div className="flex items-center gap-2">
                      <Image src={perfIcon} width={18} height={18} alt="" />
                      <span className="text-[12px] text-white/50">
                        {total === 0 ? "No assignments" : `${completed}/${total} done`}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Add class placeholder if fewer than 4 */}
              {classes.length < 4 && (
                <button
                  onClick={() => setShowAddClass(true)}
                  className="bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-[20px] p-5 flex flex-col items-center justify-center gap-2 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white/30" />
                  </div>
                  <span className="text-[12px] text-white/30">Add Course</span>
                </button>
              )}
            </div>
          )}

          {/* ── Assignments / Materials Table ── */}
          <div className="bg-[#0A2637]/75 backdrop-blur-sm rounded-[20px] border border-white/10 overflow-hidden">

            {/* Table toolbar */}
            <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-white/10">
              <h2 className="text-[15px] font-bold text-white flex-1 min-w-0">Uploaded Materials</h2>

              {/* Add assignment */}
              <button
                onClick={() => setShowAddAssignment(true)}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-white/70 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-[6px] transition-colors flex-shrink-0"
              >
                <Image src="/icons/icon-add.svg" width={14} height={14} alt="" />
                Add
              </button>

              {/* Search */}
              <div className="flex items-center gap-2 bg-white/10 rounded-[6px] px-3 py-1.5 flex-shrink-0">
                <Image src="/icons/icon-filter.svg" width={14} height={14} alt="" className="opacity-60" />
                <input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search…"
                  className="bg-transparent text-[13px] text-white placeholder-white/30 focus:outline-none w-36"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setCurrentPage(1); }}>
                    <Image src="/icons/icon-clear.svg" width={12} height={12} alt="Clear" className="opacity-60 hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>

              {/* Sort: Due Date */}
              <button
                onClick={() => {
                  if (sortField === "due_date") setSortDir((d) => d === "asc" ? "desc" : "asc");
                  else { setSortField("due_date"); setSortDir("asc"); }
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-[6px] transition-colors flex-shrink-0 ${
                  sortField === "due_date" ? "bg-white/20 text-white" : "text-white/50 hover:text-white hover:bg-white/10"
                }`}
              >
                Due Date
                <Image
                  src={sortField === "due_date" && sortDir === "desc" ? "/icons/icon-descending.svg" : "/icons/icon-ascending.svg"}
                  width={12} height={12} alt=""
                />
              </button>

              {/* Sort: Status */}
              <button
                onClick={() => {
                  if (sortField === "status") setSortDir((d) => d === "asc" ? "desc" : "asc");
                  else { setSortField("status"); setSortDir("asc"); }
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-[6px] transition-colors flex-shrink-0 ${
                  sortField === "status" ? "bg-white/20 text-white" : "text-white/50 hover:text-white hover:bg-white/10"
                }`}
              >
                Status
                <Image
                  src={sortField === "status" && sortDir === "desc" ? "/icons/icon-descending.svg" : "/icons/icon-ascending.svg"}
                  width={12} height={12} alt=""
                />
              </button>
            </div>

            {/* Table rows */}
            {paginatedAssignments.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-white/30">
                <CheckCircle2 className="w-10 h-10 opacity-40" />
                <p className="text-sm">
                  {searchQuery ? "No assignments match your search." : "No assignments yet."}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowAddAssignment(true)}
                    className="mt-1 flex items-center gap-1.5 text-[13px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    <Plus className="w-4 h-4" /> Add assignment
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {paginatedAssignments.map((a) => {
                  const d = daysUntil(a.due_date);
                  const isOverdue = !a.completed && d < 0;
                  const statusLabel = a.completed
                    ? "Completed"
                    : isOverdue
                    ? "Overdue"
                    : d === 0
                    ? "Due Today"
                    : "Pending";
                  const statusColor = a.completed
                    ? "text-emerald-400"
                    : isOverdue
                    ? "text-rose-400"
                    : d === 0
                    ? "text-amber-400"
                    : "text-white/40";

                  const typeIcon =
                    a.type === "exam"
                      ? <FileText className="w-4 h-4 text-rose-400" />
                      : a.type === "quiz"
                      ? <ClipboardList className="w-4 h-4 text-amber-400" />
                      : <StickyNote className="w-4 h-4 text-indigo-400" />;

                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Type icon */}
                      <div className="w-9 h-9 rounded-[6px] bg-white/10 flex items-center justify-center flex-shrink-0">
                        {typeIcon}
                      </div>

                      {/* Class */}
                      <div className="flex items-center gap-1.5 w-[120px] flex-shrink-0 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colorMap[a.classes?.color ?? ""] ?? "bg-slate-400"}`} />
                        <span className="text-[12px] text-white/60 truncate">{a.classes?.name ?? "—"}</span>
                      </div>

                      {/* Type badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 capitalize ${
                        a.type === "exam"
                          ? "bg-rose-500/20 text-rose-300"
                          : a.type === "quiz"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-indigo-500/20 text-indigo-300"
                      }`}>
                        {a.type}
                      </span>

                      {/* Title */}
                      <span className="text-[13px] font-medium text-white flex-1 min-w-0 truncate">{a.title}</span>

                      {/* Due date */}
                      <span className="text-[12px] text-white/40 flex-shrink-0 w-[90px] text-right hidden sm:block">
                        {formatDate(a.due_date)}
                      </span>

                      {/* Status */}
                      <span className={`text-[12px] font-semibold flex-shrink-0 w-[80px] text-right ${statusColor}`}>
                        {statusLabel}
                      </span>

                      {/* CTA */}
                      <Link
                        href="/calendar"
                        className="flex items-center gap-1 text-[12px] text-white/40 hover:text-white transition-colors flex-shrink-0 whitespace-nowrap hidden lg:flex"
                      >
                        Work on Assignment
                        <Image src="/icons/icon-forward-arrow.svg" width={12} height={12} alt="" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-white/10">
                <span className="text-[12px] text-white/30">{sortedAssignments.length} assignments</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="disabled:opacity-20 transition-opacity"
                  >
                    <Image src="/icons/icon-previous.svg" width={20} height={20} alt="Previous" />
                  </button>
                  <span className="text-[13px] text-white/70 min-w-[60px] text-center">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="disabled:opacity-20 transition-opacity"
                  >
                    <Image src="/icons/icon-next.svg" width={20} height={20} alt="Next" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── Right calendar panel ── */}
      <div
        className={`flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out sticky top-0 h-screen ${calendarOpen ? "w-[640px]" : "w-0"}`}
      >
        <div className="w-[640px] h-full bg-[#0A2637]/75 border-l border-white/10 flex flex-col overflow-hidden">

          {/* Month section */}
          <div className="px-[40px] pt-[20px] pb-[40px] border-b border-white/10 flex flex-col gap-[25px] flex-shrink-0">

            {/* Date header + month nav */}
            <div className="flex items-center justify-between">
              <h3 className="text-[29px] font-light text-white leading-none whitespace-nowrap min-w-0">
                {MONTH_NAMES[viewMonth].slice(0, 3)}, {new Date(selectedDate + "T00:00:00").getDate()}{" "}
                <span className="text-[#9f9f9f]">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" })}
                </span>
              </h3>
              <div className="flex items-center gap-0 flex-shrink-0 ml-2">
                <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-[6px] transition-colors">
                  <ChevronLeft className="w-7 h-7 text-white" />
                </button>
                <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-[6px] transition-colors">
                  <ChevronRight className="w-7 h-7 text-white" />
                </button>
              </div>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => (
                <div key={i} className="text-center text-[16px] text-[#9f9f9f]">{d}</div>
              ))}
            </div>

            {/* Day cells — collapsible */}
            <div
              className="transition-all duration-300 ease-in-out overflow-hidden"
              style={{ maxHeight: calendarExpanded ? `${calendarRows.length * 46}px` : "46px" }}
            >
              {visibleRows.map((row, rowIdx) => (
                <div key={rowIdx} className="grid grid-cols-7">
                  {row.map((day, colIdx) => {
                    if (!day) return <div key={colIdx} className="h-[46px]" />;
                    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isToday    = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate && !isToday;
                    const isPast     = dateStr < todayStr;
                    const aTypes = assignmentTypesByDate[dateStr];
                    const sTypes = sessionTypesByDate[dateStr];
                    const hasDots = (aTypes && aTypes.size > 0) || (sTypes && sTypes.size > 0);
                    return (
                      <button
                        key={colIdx}
                        onClick={() => setSelectedDate(dateStr)}
                        className="flex flex-col items-center justify-start pt-[6px] h-[46px] hover:bg-white/10 rounded-[6px] transition-colors"
                      >
                        <span className={`w-[30px] h-[30px] flex items-center justify-center rounded-full text-[16px] leading-none
                          ${isToday    ? "bg-black text-white font-bold" : ""}
                          ${isSelected ? "ring-2 ring-white/40 font-bold text-white" : ""}
                          ${!isToday && !isSelected && isPast  ? "font-normal text-[#9f9f9f]" : ""}
                          ${!isToday && !isSelected && !isPast ? "font-normal text-white" : ""}
                        `}>
                          {day}
                        </span>
                        <span className="flex items-center gap-[3px] h-[5px] mt-[1px]">
                          {hasDots && (
                            <>
                              {aTypes?.has("exam")       && <span className="w-[5px] h-[5px] rounded-full bg-rose-500" />}
                              {aTypes?.has("quiz")       && <span className="w-[5px] h-[5px] rounded-full bg-amber-400" />}
                              {aTypes?.has("assignment") && <span className="w-[5px] h-[5px] rounded-full bg-indigo-400" />}
                              {sTypes?.has("study")      && <span className="w-[5px] h-[5px] rounded-full bg-teal-400" />}
                              {sTypes?.has("exam")       && <span className="w-[5px] h-[5px] rounded-full bg-rose-500" />}
                              {sTypes?.has("quiz")       && <span className="w-[5px] h-[5px] rounded-full bg-amber-400" />}
                              {sTypes?.has("assignment") && <span className="w-[5px] h-[5px] rounded-full bg-indigo-400" />}
                            </>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Expand / collapse handle */}
            <button
              onClick={() => setCalendarExpanded((v) => !v)}
              className="w-full flex justify-center pt-2"
            >
              <div className="w-8 h-1 rounded-full bg-white/30 hover:bg-white/50 transition-colors" />
            </button>
          </div>

          {/* Daily timeline */}
          <div className="flex-1 overflow-y-auto min-h-0">

            {/* Day sub-header */}
            <div className="px-[40px] pt-6 pb-3 flex items-center justify-between sticky top-0 bg-[#0A2637] z-10 border-b border-white/10">
              <p className="text-[16px] font-bold text-white">
                {selectedDate === todayStr
                  ? "Today"
                  : new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
              <button
                onClick={() => openPopoverNew("09:00")}
                className="flex items-center gap-1 text-[15px] text-indigo-400 font-semibold hover:text-indigo-300"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {/* Assignments due banner */}
            {selectedDateAssignments.length > 0 && (
              <div className="px-[40px] py-3 border-b border-amber-500/20 bg-amber-500/10 space-y-1.5 flex-shrink-0">
                {selectedDateAssignments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-[13px]">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.type === "exam" ? "bg-rose-400" : "bg-amber-400"}`} />
                    <span className="font-medium text-white/80 truncate">{a.title}</span>
                    <span className={`ml-auto flex-shrink-0 font-semibold ${a.type === "exam" ? "text-rose-400" : "text-amber-400"}`}>
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
                  className="absolute left-0 right-0 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors flex items-start"
                  style={{ top: i * SLOT_H, height: SLOT_H }}
                >
                  <span className={`text-[16px] text-[#9f9f9f] pl-[40px] pt-1 flex-shrink-0 select-none leading-none ${slot.label ? "" : "opacity-0"}`}>
                    {slot.label || "·"}
                  </span>
                  {slot.label && (
                    <span className="absolute left-[120px] right-[40px] top-1/2 border-t border-white/10" />
                  )}
                </div>
              ))}

              {/* Session blocks */}
              {selectedDateSessions.map((s) => {
                const origTop   = slotTop(s.start_time ?? "09:00");
                const top       = dragTop?.sessionId === s.id ? dragTop.top : origTop;
                const height    = slotHeight(s.duration_minutes);
                const isDragging = dragTop?.sessionId === s.id;
                const sType     = (s.type as SessionType) ?? "study";
                return (
                  <div
                    key={s.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      dragRef.current = { sessionId: s.id, startY: e.pageY, origTop, currentTop: origTop, moved: false };
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute rounded-[20px] px-4 py-2 border-4 select-none transition-shadow
                      ${isDragging ? "shadow-xl cursor-grabbing z-20 opacity-90" : "cursor-grab hover:shadow-md"}
                      ${sessionBlockClasses(sType, s.completed)}`}
                    style={{ top: top + 2, height: height - 4, left: "120px", right: "40px" }}
                  >
                    <p className={`text-[13px] font-bold truncate leading-tight ${sessionTextClass(sType)}`}>{s.title}</p>
                    {height >= 40 && (
                      <p className={`text-[12px] mt-0.5 ${sessionSubTextClass(sType)}`}>
                        {s.start_time?.slice(0, 5) ?? "09:00"} · {s.duration_minutes}m
                      </p>
                    )}
                    {s.completed && height >= 40 && (
                      <p className="text-[11px] text-emerald-400 font-semibold">Done ✓</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer link */}
            <div className="px-[40px] py-5 border-t border-white/10">
              <Link href="/calendar" className="text-[15px] text-indigo-400 font-medium hover:underline flex items-center gap-1">
                Open full calendar <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
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
          <div className="relative bg-white rounded-[6px] shadow-2xl w-full max-w-sm p-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {popover.sessionId ? "Edit session" : "New session"}
              </h3>
              <button
                onClick={() => setPopover((p) => ({ ...p, open: false }))}
                className="w-7 h-7 rounded-[6px] hover:bg-slate-100 flex items-center justify-center"
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
                        className={`flex flex-col items-center gap-1 py-2 rounded-[6px] border text-[11px] font-semibold transition-all
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
                  className="w-full text-sm border border-slate-200 rounded-[6px] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Date</label>
                <input
                  type="date"
                  value={popover.date}
                  onChange={(e) => setPopover((p) => ({ ...p, date: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-[6px] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                    className="w-full text-sm border border-slate-200 rounded-[6px] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Duration</label>
                  <select
                    value={popover.durationMinutes}
                    onChange={(e) => setPopover((p) => ({ ...p, durationMinutes: Number(e.target.value) }))}
                    className="w-full text-sm border border-slate-200 rounded-[6px] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
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

            {/* Completed toggle */}
            {popover.sessionId && (
              <button
                onClick={() => setPopover((p) => ({ ...p, completed: !p.completed }))}
                className={`w-full mt-4 flex items-center gap-2.5 px-3 py-2.5 rounded-[6px] border text-sm font-medium transition-all ${
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
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-[6px] transition-colors"
              >
                {popover.sessionId ? "Save changes" : "Add session"}
              </button>
              {popover.sessionId && (
                <button
                  onClick={deleteSession}
                  className="w-10 h-10 rounded-[6px] border border-slate-200 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition-colors"
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

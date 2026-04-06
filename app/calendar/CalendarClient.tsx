"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import AddAssignmentModal from "../components/AddAssignmentModal";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronLeft, ChevronRight, Plus, AlertCircle,
  ClipboardList, HelpCircle, Sparkles, Clock, CheckCircle2, Trash2,
} from "lucide-react";
import type { Profile, Class, Assignment, StudySession } from "@/lib/supabase/types";

interface Props {
  profile: Profile;
  allClasses: Class[];
  assignments: Assignment[];
  initialStudySessions: StudySession[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function todayStr() {
  const t = new Date();
  return toDateStr(t.getFullYear(), t.getMonth(), t.getDate());
}
function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(dateStr + "T00:00:00"); due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

const typeEventColor: Record<string, string> = {
  exam:       "bg-rose-500",
  quiz:       "bg-amber-500",
  assignment: "bg-indigo-500",
};
const typeIcon: Record<string, React.ElementType> = {
  exam:       AlertCircle,
  quiz:       HelpCircle,
  assignment: ClipboardList,
};
const typeUpcomingColor: Record<string, string> = {
  exam:       "bg-rose-50 border-rose-200 text-rose-800",
  quiz:       "bg-amber-50 border-amber-200 text-amber-800",
  assignment: "bg-indigo-50 border-indigo-200 text-indigo-800",
};

export default function CalendarClient({ profile, allClasses, assignments, initialStudySessions }: Props) {
  const supabase = createClient();
  const router   = useRouter();

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
  });
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [studySessions, setStudySessions]         = useState<StudySession[]>(initialStudySessions);
  const [generating, setGenerating]               = useState(false);
  const [generateError, setGenerateError]         = useState("");

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = todayStr();
  const classMap    = new Map(allClasses.map((c) => [c.id, c]));

  // Build calendar cells
  type Cell = { day: number | null; assignments: Assignment[]; sessions: StudySession[] };
  const cells: Cell[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, assignments: [], sessions: [] });
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = toDateStr(year, month, d);
    cells.push({
      day: d,
      assignments: assignments.filter((a) => a.due_date === ds),
      sessions:    studySessions.filter((s) => s.scheduled_date === ds),
    });
  }

  const upcoming = assignments
    .filter((a) => !a.completed && daysUntil(a.due_date) >= 0 && daysUntil(a.due_date) <= 60)
    .slice(0, 8);

  const upcomingForPlan = assignments.filter(
    (a) => !a.completed && daysUntil(a.due_date) >= 0 && daysUntil(a.due_date) <= 30
  );

  const todaySessions = studySessions
    .filter((s) => s.scheduled_date === today)
    .sort((a, b) => a.duration_minutes - b.duration_minutes);

  function prevMonth() { setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }
  function nextMonth() { setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)); }

  async function generateStudyPlan() {
    if (!upcomingForPlan.length) return;
    setGenerating(true);
    setGenerateError("");

    try {
      // Build payload with class names for Claude context
      const assignmentsPayload = upcomingForPlan.map((a) => ({
        id:         a.id,
        title:      a.title,
        type:       a.type,
        due_date:   a.due_date,
        class_name: classMap.get(a.class_id)?.name ?? "Unknown class",
      }));

      const res = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignments:  assignmentsPayload,
          studentName:  profile.full_name ?? "Student",
          today,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate plan");
      const { sessions: generated } = await res.json() as {
        sessions: { assignment_id: string | null; title: string; scheduled_date: string; start_time?: string; duration_minutes: number }[];
      };

      if (!generated?.length) throw new Error("No sessions generated");

      // Delete existing incomplete sessions before inserting fresh plan
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("study_sessions")
        .delete()
        .eq("student_id", profile.id)
        .eq("completed", false);

      // Insert new sessions
      const toInsert = generated.map((s) => ({
        student_id:       profile.id,
        assignment_id:    s.assignment_id ?? null,
        title:            s.title,
        scheduled_date:   s.scheduled_date,
        start_time:       s.start_time ?? "16:00",
        duration_minutes: s.duration_minutes,
        completed:        false,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inserted } = await (supabase as any)
        .from("study_sessions")
        .insert(toInsert)
        .select();

      if (inserted) setStudySessions(inserted as StudySession[]);
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function toggleSession(id: string, completed: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("study_sessions")
      .update({ completed: !completed })
      .eq("id", id);
    setStudySessions((prev) =>
      prev.map((s) => s.id === id ? { ...s, completed: !s.completed } : s)
    );
  }

  async function clearPlan() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("study_sessions")
      .delete()
      .eq("student_id", profile.id)
      .eq("completed", false);
    setStudySessions((prev) => prev.filter((s) => s.completed));
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {showAddAssignment && (
        <AddAssignmentModal
          studentId={profile.id}
          classes={allClasses}
          onClose={() => setShowAddAssignment(false)}
          onSaved={() => { setShowAddAssignment(false); router.refresh(); }}
        />
      )}

      <Sidebar mode="student" classes={allClasses} profile={profile} />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Calendar</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Exam
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Quiz
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> Assignment
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-400 inline-block" /> Study
              </div>
            </div>
            <button
              onClick={() => setShowAddAssignment(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add event
            </button>
          </div>
        </header>

        <div className="px-8 py-6">
          <div className="grid grid-cols-3 gap-6">

            {/* ── Calendar grid ── */}
            <div className="col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                  </button>
                  <h2 className="text-base font-bold text-slate-900">{MONTH_NAMES[month]} {year}</h2>
                  <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                <div className="grid grid-cols-7 border-b border-slate-100">
                  {DAYS.map((d) => (
                    <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {cells.map((cell, i) => {
                    const ds      = cell.day ? toDateStr(year, month, cell.day) : null;
                    const isToday = ds === today;
                    return (
                      <div
                        key={i}
                        className={`min-h-20 p-2 border-b border-r border-slate-100 ${
                          !cell.day
                            ? "bg-slate-50/50"
                            : isToday
                            ? "bg-indigo-50/40 ring-1 ring-inset ring-indigo-200"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {cell.day && (
                          <>
                            <span className={`text-xs font-semibold inline-flex w-6 h-6 items-center justify-center rounded-full ${
                              isToday ? "bg-indigo-600 text-white" : "text-slate-600"
                            }`}>
                              {cell.day}
                            </span>
                            <div className="mt-1 space-y-0.5">
                              {cell.assignments.map((a) => (
                                <div
                                  key={a.id}
                                  className={`${typeEventColor[a.type] ?? "bg-slate-400"} text-white text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${a.completed ? "opacity-40 line-through" : ""}`}
                                  title={a.title}
                                >
                                  {a.title}
                                </div>
                              ))}
                              {cell.sessions.map((s) => (
                                <div
                                  key={s.id}
                                  className={`bg-teal-400 text-white text-[10px] font-medium px-1.5 py-0.5 rounded truncate flex items-center gap-0.5 ${s.completed ? "opacity-40 line-through" : ""}`}
                                  title={`${s.title} · ${s.duration_minutes} min`}
                                >
                                  <Clock className="w-2 h-2 flex-shrink-0" />
                                  {s.title}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Right column ── */}
            <div className="space-y-4">

              {/* Today's study sessions */}
              {todaySessions.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-teal-500" />
                    <h3 className="font-bold text-slate-900 text-sm">Today&apos;s Study Plan</h3>
                  </div>
                  <div className="space-y-2">
                    {todaySessions.map((s) => (
                      <div
                        key={s.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border border-slate-100 ${s.completed ? "opacity-50" : "bg-slate-50"}`}
                      >
                        <button
                          onClick={() => toggleSession(s.id, s.completed)}
                          className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                            s.completed ? "bg-teal-500 border-teal-500" : "border-slate-300 hover:border-teal-400"
                          }`}
                        >
                          {s.completed && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${s.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {s.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{s.duration_minutes} min</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming deadlines */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm">Upcoming Deadlines</h3>
                </div>
                {upcoming.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-400 mb-3">No upcoming deadlines</p>
                    <button
                      onClick={() => setShowAddAssignment(true)}
                      className="text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg"
                    >
                      + Add assignment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {upcoming.map((a) => {
                      const days = daysUntil(a.due_date);
                      const Icon = typeIcon[a.type] ?? ClipboardList;
                      const cls  = classMap.get(a.class_id);
                      return (
                        <div key={a.id} className={`border rounded-xl px-3 py-3 ${typeUpcomingColor[a.type] ?? "bg-slate-50 border-slate-200 text-slate-800"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold truncate">{a.title}</p>
                                <p className="text-xs opacity-70">{cls?.name ?? "Unknown class"} · {formatDate(a.due_date)}</p>
                              </div>
                            </div>
                            <span className={`text-xs font-bold flex-shrink-0 ${days === 0 ? "text-rose-700" : days <= 2 ? "text-rose-600" : "opacity-70"}`}>
                              {days === 0 ? "today" : `${days}d`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* AI Study Plan generator */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm">AI Study Plan</h3>
                  </div>
                  {studySessions.some((s) => !s.completed) && (
                    <button
                      onClick={clearPlan}
                      className="text-[10px] text-slate-400 hover:text-rose-500 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>

                {upcomingForPlan.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-400">Add assignments or exams to generate a study plan</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 mb-3">
                      {studySessions.filter((s) => !s.completed).length > 0
                        ? `${studySessions.filter((s) => !s.completed).length} sessions planned · ${studySessions.filter((s) => s.completed).length} completed`
                        : "Claude will build a day-by-day schedule around your deadlines."}
                    </p>

                    {generateError && (
                      <p className="text-xs text-rose-600 mb-2">{generateError}</p>
                    )}

                    <button
                      onClick={generateStudyPlan}
                      disabled={generating}
                      className="w-full py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2"
                    >
                      {generating ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          Building your plan…
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          {studySessions.some((s) => !s.completed) ? "Regenerate plan" : "Generate study plan"}
                        </>
                      )}
                    </button>

                    {/* Show upcoming planned sessions (next 3) */}
                    {studySessions.filter((s) => !s.completed && daysUntil(s.scheduled_date) >= 0).length > 0 && (
                      <div className="mt-3 space-y-2">
                        {studySessions
                          .filter((s) => !s.completed && daysUntil(s.scheduled_date) >= 0)
                          .slice(0, 3)
                          .map((s) => (
                            <div key={s.id} className="flex items-start gap-2.5 p-2.5 bg-teal-50 border border-teal-100 rounded-lg">
                              <Clock className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-800 truncate">{s.title}</p>
                                <p className="text-[10px] text-teal-600 mt-0.5">
                                  {formatDate(s.scheduled_date)} · {s.duration_minutes} min
                                </p>
                              </div>
                            </div>
                          ))}
                        {studySessions.filter((s) => !s.completed && daysUntil(s.scheduled_date) >= 0).length > 3 && (
                          <p className="text-[10px] text-slate-400 text-center">
                            +{studySessions.filter((s) => !s.completed && daysUntil(s.scheduled_date) >= 0).length - 3} more sessions on the calendar
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

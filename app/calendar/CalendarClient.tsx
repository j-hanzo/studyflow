"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import AddAssignmentModal from "../components/AddAssignmentModal";
import {
  ChevronLeft, ChevronRight, Plus, AlertCircle,
  ClipboardList, HelpCircle, Sparkles, Clock,
} from "lucide-react";
import type { Profile, Class, Assignment } from "@/lib/supabase/types";

interface Props {
  profile: Profile;
  allClasses: Class[];
  assignments: Assignment[];
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

// assignment type → display color for calendar dots
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

export default function CalendarClient({ profile, allClasses, assignments }: Props) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const router = useRouter();

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = todayStr();

  // Build calendar cells
  type Cell = { day: number | null; assignments: Assignment[] };
  const cells: Cell[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, assignments: [] });
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = toDateStr(year, month, d);
    cells.push({
      day: d,
      assignments: assignments.filter((a) => a.due_date === ds),
    });
  }

  // Upcoming deadlines — not completed, due today or later, next 60 days
  const upcoming = assignments
    .filter((a) => {
      if (a.completed) return false;
      const d = daysUntil(a.due_date);
      return d >= 0 && d <= 60;
    })
    .slice(0, 8);

  // Build class map for class names
  const classMap = new Map(allClasses.map((c) => [c.id, c]));

  function prevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
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
          <div className="flex items-center gap-3">
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

            {/* Calendar */}
            <div className="col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Month nav */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <button
                    onClick={prevMonth}
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                  </button>
                  <h2 className="text-base font-bold text-slate-900">
                    {MONTH_NAMES[month]} {year}
                  </h2>
                  <button
                    onClick={nextMonth}
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-slate-100">
                  {DAYS.map((d) => (
                    <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                  {cells.map((cell, i) => {
                    const ds = cell.day ? toDateStr(year, month, cell.day) : null;
                    const isToday = ds === today;
                    return (
                      <div
                        key={i}
                        className={`min-h-20 p-2 border-b border-r border-slate-100 ${
                          !cell.day
                            ? "bg-slate-50/50"
                            : isToday
                            ? "bg-indigo-50/40 ring-1 ring-inset ring-indigo-200"
                            : "hover:bg-slate-50 cursor-pointer"
                        }`}
                      >
                        {cell.day && (
                          <>
                            <span
                              className={`text-xs font-semibold inline-flex w-6 h-6 items-center justify-center rounded-full ${
                                isToday ? "bg-indigo-600 text-white" : "text-slate-600"
                              }`}
                            >
                              {cell.day}
                            </span>
                            <div className="mt-1 space-y-0.5">
                              {cell.assignments.map((a) => (
                                <div
                                  key={a.id}
                                  className={`${typeEventColor[a.type] ?? "bg-slate-400"} text-white text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${
                                    a.completed ? "opacity-40 line-through" : ""
                                  }`}
                                  title={a.title}
                                >
                                  {a.title}
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

            {/* Right column */}
            <div className="space-y-4">

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
                                <p className="text-xs opacity-70">
                                  {cls?.name ?? "Unknown class"} · {formatDate(a.due_date)}
                                </p>
                              </div>
                            </div>
                            <span className={`text-xs font-bold flex-shrink-0 ${
                              days === 0 ? "text-rose-700" : days <= 2 ? "text-rose-600" : "opacity-70"
                            }`}>
                              {days === 0 ? "today" : `${days}d`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* AI Study Plan — placeholder until study_sessions are generated */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">AI Study Plan</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  AI-generated study sessions will appear here once you add exams and assignments.
                </p>

                {/* Show a teaser if there are upcoming exams */}
                {assignments.filter((a) => a.type === "exam" && !a.completed && daysUntil(a.due_date) >= 0).length > 0 ? (
                  <div className="space-y-2.5">
                    {assignments
                      .filter((a) => a.type === "exam" && !a.completed && daysUntil(a.due_date) >= 0)
                      .slice(0, 2)
                      .map((a) => {
                        const cls = classMap.get(a.class_id);
                        const days = daysUntil(a.due_date);
                        return (
                          <div key={a.id} className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-bold text-rose-700">{a.title}</p>
                              <span className="text-xs text-rose-500 font-medium">{days}d away</span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <Clock className="w-3 h-3 text-rose-400 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-rose-600">
                                {cls?.name} — study plan coming soon
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    <button className="mt-1 w-full py-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate study plan
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-slate-400">Add an exam to generate a study plan</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

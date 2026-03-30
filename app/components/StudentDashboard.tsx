"use client";

import Link from "next/link";
import {
  Camera, Bell, CheckCircle2, Clock, FlameIcon, Sparkles,
  TrendingUp, AlertCircle, ChevronRight, Plus,
} from "lucide-react";
import Sidebar from "./Sidebar";
import type { Profile, Class, Assignment, StudySession, Message } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface Props {
  profile: Profile;
  classes: Class[];
  assignments: (Assignment & { classes: { name: string; color: string } | null })[];
  studySessions: StudySession[];
  messages: (Message & { sender: { full_name: string | null } | null })[];
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

export default function StudentDashboard({ profile, classes, assignments, studySessions, messages }: Props) {
  const [sessions, setSessions] = useState(studySessions);
  const supabase = createClient();
  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  const completedToday = sessions.filter((s) => s.completed).length;
  const totalToday = sessions.length;

  const nextExam = assignments.find((a) => a.type === "exam");
  const avgProgress = classes.length > 0 ? Math.round(Math.random() * 30 + 55) : 0; // placeholder until we track per-class progress

  async function toggleSession(id: string, completed: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("study_sessions") as any).update({ completed: !completed }).eq("id", id);
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, completed: !completed } : s));
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mode="student" classes={classes} profile={profile} />

      <main className="flex-1 overflow-auto">
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
              Capture
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
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500 font-medium">Today&apos;s Tasks</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {completedToday}<span className="text-lg text-slate-400 font-medium">/{totalToday || "—"}</span>
              </p>
              {totalToday > 0 && (
                <div className="mt-3 bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{ width: `${(completedToday / totalToday) * 100}%` }}
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500 font-medium">Study Streak</span>
                <FlameIcon className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900">
                —<span className="text-lg text-slate-400 font-medium"> days</span>
              </p>
              <p className="mt-2 text-xs text-slate-400">Keep studying to build streak!</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500 font-medium">Next Exam</span>
                <AlertCircle className="w-4 h-4 text-rose-500" />
              </div>
              {nextExam ? (
                <>
                  <p className="text-3xl font-bold text-slate-900">
                    {daysUntil(nextExam.due_date)}<span className="text-lg text-slate-400 font-medium"> days</span>
                  </p>
                  <p className="mt-2 text-xs text-rose-600 font-medium truncate">{nextExam.title}</p>
                </>
              ) : (
                <p className="text-2xl font-bold text-slate-400 mt-1">No exams</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500 font-medium">Classes</span>
                <TrendingUp className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {classes.length}<span className="text-lg text-slate-400 font-medium"> active</span>
              </p>
              <p className="mt-2 text-xs text-indigo-600 font-medium">
                {assignments.length} upcoming deadlines
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">

              {/* Today's study plan */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-slate-900">Today&apos;s Study Plan</h2>
                  <Link href="/calendar" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                    View calendar <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                {sessions.length === 0 ? (
                  <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
                    <Sparkles className="w-8 h-8 text-indigo-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600 mb-1">No study sessions yet</p>
                    <p className="text-xs text-slate-400 mb-4">Add assignments or exams and AI will generate a study plan</p>
                    <Link
                      href="/calendar"
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                      Add assignment
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-4 ${session.completed ? "opacity-60" : ""}`}
                      >
                        <button
                          onClick={() => toggleSession(session.id, session.completed)}
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${session.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-emerald-400"}`}
                        >
                          {session.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${session.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {session.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-500">{session.duration_minutes} min</span>
                          </div>
                        </div>
                        <Link href="/tutor" className="flex items-center gap-1 text-xs text-indigo-600 font-medium bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md flex-shrink-0">
                          <Sparkles className="w-3 h-3" />
                          Help
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Classes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-slate-900">My Classes</h2>
                </div>

                {classes.length === 0 ? (
                  <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
                    <p className="text-sm font-medium text-slate-600 mb-1">No classes yet</p>
                    <p className="text-xs text-slate-400 mb-4">Add your first class to get started</p>
                    <button className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg">
                      <Plus className="w-4 h-4" />
                      Add class
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {classes.map((cls) => {
                      const clsAssignments = assignments.filter((a) => a.class_id === cls.id);
                      return (
                        <Link
                          key={cls.id}
                          href={`/class/${cls.id}`}
                          className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-200 hover:shadow-sm group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-3 h-3 rounded-full ${colorMap[cls.color] ?? "bg-indigo-500"} mt-0.5`} />
                            <span className="text-xs text-slate-400">{clsAssignments.length} due</span>
                          </div>
                          <p className="font-semibold text-slate-900 text-sm">{cls.name}</p>
                          {cls.teacher && <p className="text-xs text-slate-500">{cls.teacher}</p>}
                        </Link>
                      );
                    })}
                    <button className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-4 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-300">
                      <Plus className="w-4 h-4" />
                      Add class
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">

              {/* Upcoming deadlines */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-slate-900">Upcoming</h2>
                  <Link href="/calendar" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">All</Link>
                </div>

                {assignments.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <p className="text-sm text-slate-400">No upcoming deadlines</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignments.slice(0, 4).map((a) => {
                      const days = daysUntil(a.due_date);
                      return (
                        <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 leading-snug">{a.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{formatDate(a.due_date)}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${days <= 2 ? "bg-rose-50 text-rose-600" : days <= 5 ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                              {days}d
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${a.type === "exam" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}>
                              {a.type.charAt(0).toUpperCase() + a.type.slice(1)}
                            </span>
                            {a.classes && <span className="text-xs text-slate-400">{a.classes.name}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* AI recommendation */}
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

              {/* Messages from parent */}
              {messages.length > 0 && (
                <div className="space-y-2">
                  {messages.slice(0, 2).map((m) => (
                    <div key={m.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-800">
                          {m.sender?.full_name?.[0] ?? "P"}
                        </div>
                        <span className="text-xs font-semibold text-amber-800">{m.sender?.full_name ?? "Parent"}</span>
                        <span className="text-xs text-amber-500 ml-auto">
                          {new Date(m.created_at).toLocaleDateString()}
                        </span>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import Sidebar from "./Sidebar";
import { Bell, MessageCircle, AlertCircle, Sparkles, Clock, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import type { Profile, Assignment, Message } from "@/lib/supabase/types";

interface Props {
  profile: Profile;
  students: Profile[];
  assignments: (Assignment & { classes: { name: string; color: string } | null })[];
  messages: (Message & { sender: { full_name: string | null } | null })[];
}

function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr); due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ParentDashboard({ profile, students, assignments, messages }: Props) {
  const firstName = profile.full_name?.split(" ")[0] ?? "there";
  const upcomingExams = assignments.filter((a) => a.type === "exam");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mode="parent" profile={profile} classes={[]} />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Family Overview</h1>
            <p className="text-sm text-slate-500">Welcome back, {firstName}</p>
          </div>
          <button className="relative w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <Bell className="w-4 h-4 text-slate-600" />
            {messages.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />}
          </button>
        </header>

        <div className="px-8 py-6 space-y-6">

          {/* Exam alert */}
          {upcomingExams.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800 font-medium">
                {upcomingExams.length} upcoming exam{upcomingExams.length > 1 ? "s" : ""} — {upcomingExams.map(e => e.title).join(", ")}
              </p>
              <Link href="/calendar" className="ml-auto text-xs font-semibold text-amber-700 whitespace-nowrap">
                View calendar →
              </Link>
            </div>
          )}

          {/* No students linked yet */}
          {students.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
              <Sparkles className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-700 mb-1">No students linked yet</p>
              <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
                Ask your child to sign up as a student, then use their email to link accounts.
              </p>
              <button className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
                <Plus className="w-4 h-4" />
                Link a student
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              {students.map((student) => {
                const studentAssignments = assignments.filter((a) => a.student_id === student.id);
                const nextExam = studentAssignments.find((a) => a.type === "exam");
                return (
                  <div key={student.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-sm text-indigo-700">
                          {student.full_name?.[0] ?? "S"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{student.full_name}</p>
                          <p className="text-xs text-slate-500">{student.grade}</p>
                        </div>
                      </div>
                      <button className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-lg">
                        <MessageCircle className="w-3.5 h-3.5" />
                        Message
                      </button>
                    </div>

                    <div className="px-6 py-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Upcoming deadlines</span>
                        <span className="font-semibold text-slate-800">{studentAssignments.length}</span>
                      </div>

                      {nextExam && (
                        <div className="flex items-center justify-between bg-rose-50 rounded-lg px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                            <span className="text-sm text-slate-700 font-medium">{nextExam.title}</span>
                          </div>
                          <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                            {daysUntil(nextExam.due_date)}d
                          </span>
                        </div>
                      )}

                      {studentAssignments.slice(0, 3).map((a) => (
                        <div key={a.id} className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <p className="text-xs text-slate-600 flex-1 truncate">{a.title}</p>
                          <span className="text-xs text-slate-400">{daysUntil(a.due_date)}d</span>
                        </div>
                      ))}

                      {studentAssignments.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-2">No upcoming assignments</p>
                      )}
                    </div>

                    <div className="px-6 pb-4">
                      <button className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center gap-1">
                        View full report <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Messages */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">Messages</h2>
              <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View all</button>
            </div>
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <MessageCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-sm text-indigo-700 flex-shrink-0">
                      {m.sender?.full_name?.[0] ?? "S"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">{m.sender?.full_name}</p>
                        <span className="text-xs text-slate-400">{new Date(m.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-500 truncate">{m.body}</p>
                    </div>
                    {!m.read && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

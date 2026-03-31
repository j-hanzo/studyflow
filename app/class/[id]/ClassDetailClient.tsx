"use client";

import Sidebar from "../../components/Sidebar";
import AddAssignmentModal from "../../components/AddAssignmentModal";
import {
  FileText, Image as ImageIcon, Camera, Sparkles, Clock,
  CheckCircle2, AlertCircle, ChevronRight, Search, Plus, BookOpen,
  ClipboardList, StickyNote,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Class, Material, Assignment } from "@/lib/supabase/types";

interface Props {
  profile: Profile;
  cls: Class;
  allClasses: Class[];
  materials: Material[];
  signedUrls: Record<string, string>;
  assignments: Assignment[];
}

const typeConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  notes:      { label: "Notes",      color: "bg-indigo-50 text-indigo-600",  icon: StickyNote    },
  assignment: { label: "Assignment", color: "bg-amber-50 text-amber-600",    icon: ClipboardList },
  handout:    { label: "Handout",    color: "bg-emerald-50 text-emerald-600", icon: FileText     },
};

function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = new Date(dateStr); due.setHours(0,0,0,0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ClassDetailClient({ profile, cls, allClasses, materials, signedUrls, assignments }: Props) {
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "notes" | "assignment" | "handout">("all");
  const [search, setSearch] = useState("");
  const [localAssignments, setLocalAssignments] = useState(assignments);
  const router = useRouter();
  const supabase = createClient();

  const filteredMaterials = materials.filter((m) => {
    const matchesTab  = activeTab === "all" || m.type === activeTab;
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.content_text ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchSearch;
  });

  const completedCount = localAssignments.filter((a) => a.completed).length;

  async function toggleAssignment(id: string, completed: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("assignments").update({ completed: !completed }).eq("id", id);
    setLocalAssignments((prev) =>
      prev.map((a) => a.id === id ? { ...a, completed: !completed } : a)
    );
  }

  const tabs = [
    { key: "all",     label: "All",      icon: BookOpen   },
    { key: "notes",   label: "Notes",    icon: StickyNote },
    { key: "handout", label: "Handouts", icon: FileText   },
  ] as const;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {showAddAssignment && (
        <AddAssignmentModal
          studentId={profile.id}
          classes={allClasses}
          defaultClassId={cls.id}
          onClose={() => setShowAddAssignment(false)}
          onSaved={() => { setShowAddAssignment(false); router.refresh(); }}
        />
      )}

      <Sidebar mode="student" classes={allClasses} profile={profile} />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${cls.color}`} />
              <div>
                <h1 className="text-xl font-bold text-slate-900">{cls.name}</h1>
                <p className="text-sm text-slate-500">
                  {[cls.teacher, cls.period].filter(Boolean).join(" · ") || "No teacher set"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search materials..."
                  className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
                />
              </div>
              <button
                onClick={() => setShowAddAssignment(true)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Add assignment
              </button>
              <Link
                href={`/capture?classId=${cls.id}`}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                <Camera className="w-4 h-4" />
                Add material
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab.key
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <div className="px-8 py-6">
          <div className="grid grid-cols-3 gap-6">

            {/* Materials */}
            <div className="col-span-2 space-y-3">
              <p className="text-sm text-slate-400">
                {filteredMaterials.length} {activeTab === "all" ? "items" : activeTab + "s"}
                {search && ` matching "${search}"`}
              </p>

              {filteredMaterials.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 text-center">
                  <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500 mb-1">
                    {search ? "No materials match your search" : "No materials yet"}
                  </p>
                  <p className="text-xs text-slate-400 mb-4">
                    {search ? "Try a different search term" : "Capture a photo or paste text to add your first material"}
                  </p>
                  {!search && (
                    <Link
                      href={`/capture?classId=${cls.id}`}
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg"
                    >
                      <Camera className="w-4 h-4" />
                      Capture first material
                    </Link>
                  )}
                </div>
              ) : (
                filteredMaterials.map((m) => {
                  const config = typeConfig[m.type] ?? typeConfig.notes;
                  const Icon = config.icon;
                  const thumb = signedUrls[m.id];
                  return (
                    <Link
                      key={m.id}
                      href={`/material/${m.id}`}
                      className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-sm cursor-pointer group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt={m.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center group-hover:bg-indigo-50">
                              <Icon className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                                  {config.label}
                                </span>
                              </div>
                              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-700">
                                {m.title}
                              </h3>
                            </div>
                            <span className="text-xs text-slate-400 flex-shrink-0">
                              {new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          {m.content_text && (
                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                              {m.content_text}
                            </p>
                          )}
                          {m.tags.length > 0 && (
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {m.tags.map((tag) => (
                                <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}

              <Link
                href={`/capture?classId=${cls.id}`}
                className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-300"
              >
                <Plus className="w-4 h-4" />
                Add notes, handout, or photo
              </Link>
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              {/* Progress */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 text-sm mb-4">Class Overview</h3>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-xl font-bold text-slate-900">{materials.length}</p>
                    <p className="text-xs text-slate-500">Materials</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-xl font-bold text-slate-900">{completedCount}/{localAssignments.length}</p>
                    <p className="text-xs text-slate-500">Done</p>
                  </div>
                </div>
              </div>

              {/* Assignments */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm">Assignments & Exams</h3>
                  <button
                    onClick={() => setShowAddAssignment(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Add
                  </button>
                </div>

                {localAssignments.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-400 mb-3">No assignments yet</p>
                    <button
                      onClick={() => setShowAddAssignment(true)}
                      className="text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg"
                    >
                      + Add first assignment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {localAssignments.map((a) => {
                      const days = daysUntil(a.due_date);
                      return (
                        <div key={a.id} className="flex items-start gap-2.5">
                          <button
                            onClick={() => toggleAssignment(a.id, a.completed)}
                            className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                              a.completed
                                ? "bg-emerald-500 border-emerald-500"
                                : a.type === "exam"
                                ? "border-rose-300 hover:border-rose-400"
                                : "border-slate-300 hover:border-indigo-400"
                            }`}
                          >
                            {a.completed && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium leading-snug ${a.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                              {a.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                a.type === "exam"  ? "bg-rose-50 text-rose-600" :
                                a.type === "quiz"  ? "bg-amber-50 text-amber-600" :
                                "bg-blue-50 text-blue-600"
                              }`}>
                                {a.type.charAt(0).toUpperCase() + a.type.slice(1)}
                              </span>
                              <span className="text-[10px] text-slate-400">{formatDate(a.due_date)}</span>
                            </div>
                          </div>
                          {!a.completed && (
                            <span className={`text-xs font-bold flex-shrink-0 ${
                              days <= 1 ? "text-rose-600" : days <= 3 ? "text-amber-600" : "text-slate-400"
                            }`}>
                              {days === 0 ? "today" : `${days}d`}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* AI tools */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-4 text-white space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wide">AI Tools</span>
                </div>
                {[
                  "Create practice exam",
                  "Summarize all notes",
                  "Make flashcards",
                  "Build study schedule",
                ].map((action) => (
                  <Link
                    key={action}
                    href={`/tutor?classId=${cls.id}&prompt=${encodeURIComponent(action + " for " + cls.name)}`}
                    className="w-full text-left text-sm text-white bg-white/15 hover:bg-white/25 px-3 py-2 rounded-lg flex items-center justify-between group"
                  >
                    {action}
                    <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

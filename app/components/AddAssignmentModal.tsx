"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2, CalendarDays, BookOpen, ClipboardList, HelpCircle } from "lucide-react";
import type { Class } from "@/lib/supabase/types";

const TYPE_OPTIONS = [
  { value: "assignment", label: "Assignment", desc: "Homework, project, paper", icon: ClipboardList, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "exam",       label: "Exam",       desc: "Mid-term, final, test",   icon: BookOpen,     color: "text-rose-600 bg-rose-50 border-rose-200" },
  { value: "quiz",       label: "Quiz",       desc: "Short quiz, pop quiz",    icon: HelpCircle,   color: "text-amber-600 bg-amber-50 border-amber-200" },
] as const;

interface Props {
  studentId: string;
  classes: Class[];
  defaultClassId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddAssignmentModal({ studentId, classes, defaultClassId, onClose, onSaved }: Props) {
  const [title, setTitle]         = useState("");
  const [classId, setClassId]     = useState(defaultClassId ?? classes[0]?.id ?? "");
  const [type, setType]           = useState<"assignment" | "exam" | "quiz">("assignment");
  const [dueDate, setDueDate]     = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const supabase = createClient();

  // Min date = today
  const today = new Date().toISOString().split("T")[0];

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !classId || !dueDate) return;
    setLoading(true);
    setError("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("assignments").insert({
      student_id:  studentId,
      class_id:    classId,
      title:       title.trim(),
      type,
      due_date:    dueDate,
      description: description.trim() || null,
      completed:   false,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    onSaved();
  }

  const selectedClass = classes.find((c) => c.id === classId);

  // Helper — days until due
  function daysUntil(dateStr: string) {
    if (!dateStr) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const due   = new Date(dateStr); due.setHours(0,0,0,0);
    return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
  const days = daysUntil(dueDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-base font-bold text-slate-900">Add assignment or exam</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="px-6 py-5 space-y-5">

          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      type === t.value
                        ? `${t.color} border-current`
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{t.label}</span>
                    <span className="text-[10px] text-center opacity-70 leading-tight">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "exam"
                  ? "e.g. Biology Mid-Term Exam"
                  : type === "quiz"
                  ? "e.g. Chapter 7 Quiz"
                  : "e.g. Essay Draft — The Great Gatsby"
              }
              required
              autoFocus
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Class */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Class <span className="text-rose-500">*</span>
            </label>
            {classes.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No classes yet — add a class first</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setClassId(cls.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${
                      classId === cls.id
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${cls.color}`} />
                    {cls.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Due date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Due date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={dueDate}
                min={today}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {days !== null && dueDate && (
              <p className={`text-xs mt-1.5 font-medium ${
                days === 0 ? "text-rose-600" :
                days <= 2  ? "text-rose-500" :
                days <= 5  ? "text-amber-600" :
                "text-slate-500"
              }`}>
                {days === 0 ? "Due today!" : days === 1 ? "Due tomorrow" : `${days} days away`}
              </p>
            )}
          </div>

          {/* Description (optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any details, requirements, or reminders..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Preview */}
          {title && classId && dueDate && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Preview</p>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedClass && (
                      <>
                        <div className={`w-2 h-2 rounded-full ${selectedClass.color}`} />
                        <span className="text-xs text-slate-500">{selectedClass.name}</span>
                        <span className="text-xs text-slate-300">·</span>
                      </>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      type === "exam"  ? "bg-rose-50 text-rose-600" :
                      type === "quiz"  ? "bg-amber-50 text-amber-600" :
                      "bg-blue-50 text-blue-600"
                    }`}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                  </div>
                </div>
                {days !== null && (
                  <span className={`text-sm font-bold flex-shrink-0 ${
                    days <= 2 ? "text-rose-600" : days <= 5 ? "text-amber-600" : "text-slate-500"
                  }`}>
                    {days}d
                  </span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !classId || !dueDate || classes.length === 0}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Saving..." : `Add ${type}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

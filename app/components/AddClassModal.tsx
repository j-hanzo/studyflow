"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2 } from "lucide-react";

const COLOR_OPTIONS = [
  { label: "Indigo", value: "bg-indigo-500", hex: "#6366f1" },
  { label: "Emerald", value: "bg-emerald-500", hex: "#10b981" },
  { label: "Amber", value: "bg-amber-500", hex: "#f59e0b" },
  { label: "Rose", value: "bg-rose-500", hex: "#f43f5e" },
  { label: "Violet", value: "bg-violet-500", hex: "#8b5cf6" },
  { label: "Blue", value: "bg-blue-500", hex: "#3b82f6" },
  { label: "Orange", value: "bg-orange-500", hex: "#f97316" },
  { label: "Teal", value: "bg-teal-500", hex: "#14b8a6" },
];

interface Props {
  studentId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddClassModal({ studentId, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [period, setPeriod] = useState("");
  const [color, setColor] = useState("bg-indigo-500");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("classes").insert({
      student_id: studentId,
      name: name.trim(),
      teacher: teacher.trim() || null,
      period: period.trim() || null,
      color,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Add a class</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          {/* Class name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Class name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Biology, Algebra II, English Lit"
              required
              autoFocus
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Teacher */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Teacher <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="e.g. Mr. Thompson"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Period / Block <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="e.g. Period 3, Block B, 10:00 AM"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full transition-all ${c.value} ${
                    color === c.value
                      ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                      : "hover:scale-105"
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200`}>
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <div>
              <p className="text-sm font-semibold text-slate-800">{name || "Class name"}</p>
              {teacher && <p className="text-xs text-slate-500">{teacher}</p>}
            </div>
          </div>

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
              disabled={loading || !name.trim()}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Saving..." : "Add class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

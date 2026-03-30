import Sidebar from "../../components/Sidebar";
import {
  FileText,
  Image as ImageIcon,
  Camera,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Download,
  Search,
  Plus,
  BookOpen,
  ClipboardList,
  StickyNote,
} from "lucide-react";
import Link from "next/link";

const materials = [
  {
    id: 1,
    title: "Chapter 7 — Photosynthesis",
    type: "notes",
    date: "Mar 28",
    pages: 4,
    hasPhoto: true,
    preview: "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of glucose. Light-dependent reactions occur in the thylakoid membrane...",
    tags: ["Chapter 7", "Photosynthesis", "Light reactions"],
  },
  {
    id: 2,
    title: "Lab Report — Osmosis Experiment",
    type: "assignment",
    date: "Mar 25",
    pages: 3,
    hasPhoto: false,
    preview: "Hypothesis: If potato cells are placed in a hypertonic solution, then water will move out of the cells via osmosis causing the potato to shrink...",
    tags: ["Lab", "Osmosis", "Due Apr 3"],
  },
  {
    id: 3,
    title: "Chapter 6 Handout — Cell Respiration",
    type: "handout",
    date: "Mar 20",
    pages: 2,
    hasPhoto: true,
    preview: "Cellular respiration is a set of metabolic reactions that take place in the cells of organisms to convert biochemical energy from nutrients into ATP...",
    tags: ["Chapter 6", "Cell Respiration", "ATP"],
  },
  {
    id: 4,
    title: "Mid-Term Study Guide",
    type: "notes",
    date: "Mar 18",
    pages: 6,
    hasPhoto: false,
    preview: "Topics covered: Ch 1–7. Cell structure and function, Membrane transport, Photosynthesis (light & dark reactions), Cell respiration (glycolysis, Krebs cycle, ETC)...",
    tags: ["Exam prep", "Mid-Term", "All chapters"],
  },
];

const assignments = [
  { title: "Lab Report — Osmosis", due: "Apr 3", daysLeft: 4, status: "in-progress" },
  { title: "Chapter 8 Reading Quiz", due: "Apr 2", daysLeft: 3, status: "not-started" },
  { title: "Chapter 7 Worksheet", due: "Apr 1", daysLeft: 2, status: "completed" },
  { title: "Mid-Term Exam", due: "Apr 4", daysLeft: 5, status: "upcoming-exam" },
];

const typeConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  notes: { label: "Notes", color: "bg-indigo-50 text-indigo-600", icon: StickyNote },
  assignment: { label: "Assignment", color: "bg-amber-50 text-amber-600", icon: ClipboardList },
  handout: { label: "Handout", color: "bg-emerald-50 text-emerald-600", icon: FileText },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  completed: { label: "Done", color: "bg-emerald-50 text-emerald-600" },
  "in-progress": { label: "In progress", color: "bg-blue-50 text-blue-600" },
  "not-started": { label: "Not started", color: "bg-slate-100 text-slate-500" },
  "upcoming-exam": { label: "Exam", color: "bg-rose-50 text-rose-600" },
};

export default function ClassPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mode="student" />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">Biology</h1>
                <p className="text-sm text-slate-500">Mr. Thompson · Period 3 · 10th Grade</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
                />
              </div>
              <Link
                href="/capture"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                <Camera className="w-4 h-4" />
                Add material
              </Link>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mt-4">
            {[
              { label: "All Materials", icon: BookOpen, active: true },
              { label: "Notes", icon: StickyNote, active: false },
              { label: "Assignments", icon: ClipboardList, active: false },
              { label: "Handouts", icon: FileText, active: false },
            ].map((tab) => (
              <button
                key={tab.label}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg ${
                  tab.active
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
            {/* Materials list */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-slate-500">{materials.length} items · sorted by date</p>
              </div>

              {materials.map((m) => {
                const config = typeConfig[m.type];
                const Icon = config.icon;
                return (
                  <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-sm cursor-pointer group">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50">
                        {m.hasPhoto
                          ? <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" />
                          : <FileText className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                                {config.label}
                              </span>
                              {m.hasPhoto && (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <ImageIcon className="w-3 h-3" /> photo
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-slate-900 text-sm">{m.title}</h3>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-slate-400">{m.date}</span>
                            <button className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                              <Download className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{m.preview}</p>

                        <div className="flex items-center gap-2 mt-3">
                          {m.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                              {tag}
                            </span>
                          ))}
                          <button className="ml-auto flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium opacity-0 group-hover:opacity-100">
                            <Sparkles className="w-3 h-3" />
                            Ask AI about this
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add material CTA */}
              <Link
                href="/capture"
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
                <h3 className="font-bold text-slate-900 text-sm mb-4">Class Progress</h3>
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Overall</span>
                    <span className="font-semibold">78%</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "78%" }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-lg font-bold text-slate-900">14</p>
                    <p className="text-xs text-slate-500">Materials</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-lg font-bold text-slate-900">3/4</p>
                    <p className="text-xs text-slate-500">Assignments</p>
                  </div>
                </div>
              </div>

              {/* Assignments */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm">Assignments & Exams</h3>
                </div>
                <div className="space-y-2.5">
                  {assignments.map((a, i) => {
                    const sc = statusConfig[a.status];
                    return (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {a.status === "completed"
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            : a.status === "upcoming-exam"
                              ? <AlertCircle className="w-4 h-4 text-rose-500" />
                              : <Clock className="w-4 h-4 text-slate-300" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${a.status === "completed" ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {a.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${sc.color}`}>{sc.label}</span>
                            <span className="text-xs text-slate-400">{a.due}</span>
                          </div>
                        </div>
                        {a.status !== "completed" && (
                          <span className="text-xs font-bold text-slate-500 flex-shrink-0">{a.daysLeft}d</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 hover:text-slate-600 hover:border-slate-300">
                  <Plus className="w-3.5 h-3.5" />
                  Add assignment
                </button>
              </div>

              {/* AI Study actions */}
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
                  <button
                    key={action}
                    className="w-full text-left text-sm text-white bg-white/15 hover:bg-white/25 px-3 py-2 rounded-lg flex items-center justify-between group"
                  >
                    {action}
                    <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

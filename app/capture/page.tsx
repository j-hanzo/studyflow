import Sidebar from "../components/Sidebar";
import {
  Camera,
  Upload,
  ClipboardPaste,
  Sparkles,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  X,
} from "lucide-react";

const classes = [
  { id: "bio", name: "Biology", color: "bg-emerald-500" },
  { id: "math", name: "Algebra II", color: "bg-indigo-500" },
  { id: "eng", name: "English Lit", color: "bg-amber-500" },
  { id: "hist", name: "US History", color: "bg-rose-500" },
  { id: "chem", name: "Chemistry", color: "bg-violet-500" },
];

const recentCaptures = [
  { title: "Chapter 7 — Photosynthesis", class: "Biology", color: "bg-emerald-500", time: "2h ago", type: "photo", extracted: true },
  { title: "Problem Set 4.1", class: "Algebra II", color: "bg-indigo-500", time: "Yesterday", type: "paste", extracted: true },
  { title: "WWI Handout", class: "US History", color: "bg-rose-500", time: "Mar 27", type: "photo", extracted: true },
];

export default function CapturePage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mode="student" />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4">
          <h1 className="text-xl font-bold text-slate-900">Capture Material</h1>
          <p className="text-sm text-slate-500 mt-0.5">Add notes, handouts, or assignments to your study library</p>
        </header>

        <div className="px-8 py-6">
          <div className="grid grid-cols-3 gap-6">

            {/* Main capture area */}
            <div className="col-span-2 space-y-5">

              {/* Class selector */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Which class is this for?
                </label>
                <div className="flex flex-wrap gap-2">
                  {classes.map((cls) => (
                    <button
                      key={cls.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        cls.id === "bio"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${cls.color}`} />
                      {cls.name}
                    </button>
                  ))}
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-slate-300">
                    + Add class
                  </button>
                </div>
              </div>

              {/* Material type */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  What type of material?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Class Notes", desc: "Handwritten or typed", active: true },
                    { label: "Assignment", desc: "Homework or project", active: false },
                    { label: "Handout", desc: "Teacher-provided sheet", active: false },
                  ].map((t) => (
                    <button
                      key={t.label}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        t.active
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <p className={`text-sm font-semibold ${t.active ? "text-indigo-700" : "text-slate-700"}`}>
                        {t.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Capture methods */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  How would you like to add it?
                </label>

                {/* Photo upload — active/selected state */}
                <div className="border-2 border-indigo-300 bg-indigo-50 rounded-xl p-6 mb-3">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                      <Camera className="w-8 h-8 text-indigo-600" />
                    </div>
                    <p className="font-semibold text-indigo-700 mb-1">Take a Photo</p>
                    <p className="text-xs text-indigo-500 mb-4">
                      Point your camera at handwritten notes or printed handouts
                    </p>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg">
                      Open Camera
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* File upload */}
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl p-5 text-center cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-50 flex items-center justify-center mx-auto mb-2">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 group-hover:text-indigo-700">Upload file</p>
                    <p className="text-xs text-slate-400 mt-0.5">PDF, JPG, PNG</p>
                  </div>

                  {/* Paste text */}
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl p-5 text-center cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-50 flex items-center justify-center mx-auto mb-2">
                      <ClipboardPaste className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 group-hover:text-indigo-700">Paste text</p>
                    <p className="text-xs text-slate-400 mt-0.5">Digital notes or content</p>
                  </div>
                </div>
              </div>

              {/* AI extraction preview — shown after capture */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-semibold text-slate-900">AI Extraction Preview</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Complete</span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 divide-x divide-slate-100">
                  {/* Original photo */}
                  <div className="p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" /> Original Photo
                    </p>
                    <div className="bg-slate-100 rounded-xl h-48 flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                        <p className="text-xs text-slate-400">chapter7_notes.jpg</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-center">Stored in original quality</p>
                  </div>

                  {/* Extracted text */}
                  <div className="p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Extracted Text
                    </p>
                    <div className="bg-slate-50 rounded-xl h-48 p-4 overflow-y-auto">
                      <p className="text-xs text-slate-700 leading-relaxed">
                        <strong>Chapter 7 — Photosynthesis</strong><br /><br />
                        Photosynthesis: process by which plants convert light → glucose<br /><br />
                        <strong>Equation:</strong> 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂<br /><br />
                        <strong>Two stages:</strong><br />
                        1. Light-dependent reactions (thylakoid membrane)<br />
                        — Splits water, releases O₂<br />
                        — Produces ATP + NADPH<br /><br />
                        2. Calvin Cycle / Light-independent (stroma)<br />
                        — Uses ATP + NADPH<br />
                        — Fixes CO₂ into glucose
                      </p>
                    </div>
                    <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Text extracted and searchable
                    </p>
                  </div>
                </div>

                {/* Tags + title */}
                <div className="px-5 py-4 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Title</label>
                    <input
                      type="text"
                      defaultValue="Chapter 7 — Photosynthesis"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                      AI-suggested tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Chapter 7", "Photosynthesis", "Light reactions", "Calvin Cycle", "Mid-term prep"].map((tag) => (
                        <span key={tag} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">
                          {tag}
                          <X className="w-3 h-3 cursor-pointer hover:text-indigo-800" />
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Save to Biology
                    </button>
                    <button className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                      Edit text
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              {/* Tips */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wide">Photo Tips</span>
                </div>
                <ul className="space-y-2 text-xs text-indigo-100 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-300 mt-0.5">•</span>
                    Good lighting = better text extraction
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-300 mt-0.5">•</span>
                    Lay paper flat before shooting
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-300 mt-0.5">•</span>
                    Include entire page in frame
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-300 mt-0.5">•</span>
                    Claude AI extracts text automatically
                  </li>
                </ul>
              </div>

              {/* Recent captures */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 text-sm mb-3">Recent Captures</h3>
                <div className="space-y-3">
                  {recentCaptures.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 cursor-pointer group">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        {c.type === "photo"
                          ? <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                          : <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{c.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
                          <span className="text-xs text-slate-400">{c.class} · {c.time}</span>
                        </div>
                      </div>
                      {c.extracted && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Due date selector */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 text-sm mb-3">Assignment details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Due date</label>
                    <button className="w-full flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                      <span>Select date...</span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Add to study plan?</label>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded-lg border-2 border-indigo-500 bg-indigo-50 text-xs font-medium text-indigo-700">Yes</button>
                      <button className="flex-1 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-500">No</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

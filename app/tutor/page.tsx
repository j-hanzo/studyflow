import Sidebar from "../components/Sidebar";
import {
  Sparkles,
  Send,
  BookOpen,
  FileText,
  ChevronRight,
  Clock,
  CheckCircle2,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
} from "lucide-react";

const suggestedQuestions = [
  "Explain light-dependent reactions in simple terms",
  "What's the difference between photosynthesis and respiration?",
  "Give me 5 practice questions on Chapter 7",
  "What topics should I focus on for the mid-term?",
  "Can you create a 5-day study schedule for Biology?",
];

const studyPlan = [
  { day: "Today (Mon)", tasks: ["Review Ch. 7 — Photosynthesis (30 min)", "Flashcards: light reactions key terms"], done: 1, total: 2 },
  { day: "Tuesday", tasks: ["Cell respiration — Ch. 6 re-read (25 min)", "Practice Q's: ATP production"], done: 0, total: 2 },
  { day: "Wednesday", tasks: ["Chapters 1–5 rapid review", "Make summary sheet"], done: 0, total: 2 },
  { day: "Thursday", tasks: ["Full practice exam (timed)", "Review wrong answers with AI"], done: 0, total: 2 },
  { day: "Friday — Exam Day", tasks: ["Light review only — 20 min", "Breakfast + sleep well 🎯"], done: 0, total: 2 },
];

const conversation = [
  {
    role: "user",
    text: "I have my Biology mid-term in 5 days. Can you help me create a study plan and explain photosynthesis?",
    time: "10:24 AM",
  },
  {
    role: "ai",
    text: "Absolutely! I've reviewed your notes and here's what I recommend. First, let me explain photosynthesis clearly, then I'll build you a 5-day study plan.",
    time: "10:24 AM",
    hasStudyPlan: false,
  },
  {
    role: "ai",
    text: "**Photosynthesis — The Simple Version**\n\nPlants are basically solar-powered food factories. Here's the process:\n\n1. **Capture light** → Chlorophyll in the leaves absorbs sunlight\n2. **Split water** → Light energy breaks water molecules (releases O₂ — that's why we breathe!)\n3. **Build glucose** → CO₂ from air + hydrogen from water → glucose (C₆H₁₂O₆)\n\n**The equation to memorize:**\n6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂\n\n**Two stages:**\n• Light reactions (thylakoid): Produce ATP + NADPH, release O₂\n• Calvin cycle (stroma): Use ATP + NADPH to build glucose from CO₂\n\nBased on your Chapter 7 notes, you already have good coverage of this. The area I'd focus on is the *electron transport chain* — it came up a lot in your captured handouts.",
    time: "10:24 AM",
    hasStudyPlan: false,
  },
  {
    role: "user",
    text: "That helps! Now can you build the study schedule?",
    time: "10:26 AM",
  },
  {
    role: "ai",
    text: "Here's your personalized 5-day Biology mid-term study plan, built from your notes and the topics most likely on the exam based on your handouts:",
    time: "10:26 AM",
    hasStudyPlan: true,
  },
];

export default function TutorPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mode="student" />

      <main className="flex-1 overflow-auto flex flex-col">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">AI Tutor</h1>
              <p className="text-xs text-slate-500">Context: Biology · Mid-Term prep · 5 days out</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg">
              <BookOpen className="w-3.5 h-3.5" />
              My notes
            </button>
            <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg">
              <RotateCcw className="w-3.5 h-3.5" />
              New chat
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

              {/* Context banner */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <p className="text-xs text-indigo-700">
                  <span className="font-semibold">AI has access to:</span> Your Biology notes (14 files), Chapter 7 handout, mid-term study guide, and class schedule.
                </p>
              </div>

              {conversation.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-3`}>
                  {msg.role === "ai" && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className={`max-w-xl ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-tr-sm"
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                      }`}
                    >
                      <p className={`text-sm leading-relaxed whitespace-pre-line ${msg.role === "user" ? "text-white" : "text-slate-700"}`}>
                        {msg.text}
                      </p>

                      {/* Study plan block inside message */}
                      {msg.hasStudyPlan && (
                        <div className="mt-3 space-y-2">
                          {studyPlan.map((day, j) => (
                            <div key={j} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-xs font-bold text-slate-900">{day.day}</p>
                                <span className="text-xs text-slate-400">{day.done}/{day.total} done</span>
                              </div>
                              {day.tasks.map((task, k) => (
                                <div key={k} className="flex items-start gap-1.5 mt-1">
                                  <div className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center ${day.done > k ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                                    {day.done > k && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                  <p className="text-xs text-slate-600">{task}</p>
                                </div>
                              ))}
                            </div>
                          ))}
                          <button className="w-full mt-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Add to my calendar
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{msg.time}</span>
                      {msg.role === "ai" && (
                        <div className="flex items-center gap-1">
                          <button className="text-slate-300 hover:text-emerald-500">
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button className="text-slate-300 hover:text-rose-500">
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0 mt-1">
                      JH
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Suggested questions */}
            <div className="px-8 py-3 border-t border-slate-100 bg-white">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0"
                  >
                    <Lightbulb className="w-3 h-3" />
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input bar */}
            <div className="px-8 py-4 bg-white border-t border-slate-200">
              <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-300">
                <textarea
                  placeholder="Ask anything about Biology, your notes, or request practice questions..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none outline-none leading-relaxed"
                />
                <button className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center flex-shrink-0">
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                AI Tutor uses your actual notes and class materials to give personalized answers
              </p>
            </div>
          </div>

          {/* Right panel — Practice / resources */}
          <div className="w-64 border-l border-slate-200 bg-white flex-shrink-0 overflow-y-auto">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: "Practice exam — Biology", icon: FileText, color: "text-emerald-600 bg-emerald-50" },
                  { label: "Make flashcards", icon: BookOpen, color: "text-indigo-600 bg-indigo-50" },
                  { label: "Summarize my notes", icon: Sparkles, color: "text-violet-600 bg-violet-50" },
                  { label: "Explain a concept", icon: Lightbulb, color: "text-amber-600 bg-amber-50" },
                ].map((a) => (
                  <button
                    key={a.label}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium ${a.color} hover:opacity-80`}
                  >
                    <a.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {a.label}
                    <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Today&apos;s Study Plan</h3>
              <div className="space-y-2">
                {studyPlan[0].tasks.map((task, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${i < studyPlan[0].done ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                      {i < studyPlan[0].done && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">{task}</p>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>~50 min total</span>
                </div>
              </div>
            </div>

            <div className="p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Your Biology Notes</h3>
              <div className="space-y-2">
                {[
                  "Chapter 7 — Photosynthesis",
                  "Chapter 6 — Cell Respiration",
                  "Mid-Term Study Guide",
                  "Lab Report — Osmosis",
                ].map((note) => (
                  <button key={note} className="w-full flex items-center gap-2 text-xs text-slate-600 hover:text-indigo-600 text-left group">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 group-hover:text-indigo-500" />
                    <span className="truncate">{note}</span>
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

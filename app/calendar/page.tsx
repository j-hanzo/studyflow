import Sidebar from "../components/Sidebar";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
  BookOpen,
  ClipboardList,
  Sparkles,
  Clock,
} from "lucide-react";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// April 2025 calendar — starts on Tuesday (index 2)
const calendarData = [
  { day: null }, { day: null },
  { day: 1, events: [] },
  { day: 2, events: [{ type: "assignment", label: "Essay Draft", class: "English Lit", color: "bg-amber-400" }] },
  { day: 3, events: [{ type: "assignment", label: "Chemistry Lab", class: "Chemistry", color: "bg-violet-400" }] },
  { day: 4, events: [{ type: "exam", label: "Bio Mid-Term", class: "Biology", color: "bg-rose-500" }] },
  { day: 5, events: [] },
  { day: 6, events: [] },
  { day: 7, events: [{ type: "exam", label: "Algebra Ch. Test", class: "Algebra II", color: "bg-indigo-500" }] },
  { day: 8, events: [{ type: "study", label: "Study Session", class: "US History", color: "bg-blue-400" }] },
  { day: 9, events: [] },
  { day: 10, events: [{ type: "assignment", label: "History Essay", class: "US History", color: "bg-rose-400" }] },
  { day: 11, events: [] },
  { day: 12, events: [] },
  { day: 13, events: [] },
  { day: 14, events: [{ type: "study", label: "Study Session", class: "Biology", color: "bg-emerald-400" }] },
  { day: 15, events: [{ type: "assignment", label: "Math Problem Set", class: "Algebra II", color: "bg-indigo-400" }] },
  { day: 16, events: [] },
  { day: 17, events: [{ type: "exam", label: "English Quiz", class: "English Lit", color: "bg-amber-500" }] },
  { day: 18, events: [] },
  { day: 19, events: [] },
  { day: 20, events: [] },
  { day: 21, events: [{ type: "assignment", label: "Bio Lab Report", class: "Biology", color: "bg-emerald-500" }] },
  { day: 22, events: [] },
  { day: 23, events: [{ type: "study", label: "Study Session", class: "Chemistry", color: "bg-violet-400" }] },
  { day: 24, events: [{ type: "exam", label: "Chemistry Test", class: "Chemistry", color: "bg-violet-500" }] },
  { day: 25, events: [] },
  { day: 26, events: [] },
  { day: 27, events: [] },
  { day: 28, events: [{ type: "assignment", label: "History Presentation", class: "US History", color: "bg-rose-400" }] },
  { day: 29, events: [] },
  { day: 30, events: [{ type: "study", label: "Finals Prep", class: "All Classes", color: "bg-indigo-400" }] },
];

const upcomingEvents = [
  { day: "Wed Apr 2", type: "assignment", label: "Essay Draft Due", class: "English Lit", color: "bg-amber-50 border-amber-200 text-amber-800", icon: ClipboardList, daysLeft: 3 },
  { day: "Thu Apr 3", type: "assignment", label: "Chemistry Lab Report", class: "Chemistry", color: "bg-violet-50 border-violet-200 text-violet-800", icon: ClipboardList, daysLeft: 4 },
  { day: "Fri Apr 4", type: "exam", label: "Biology Mid-Term", class: "Biology", color: "bg-rose-50 border-rose-200 text-rose-800", icon: AlertCircle, daysLeft: 5 },
  { day: "Mon Apr 7", type: "exam", label: "Algebra II Chapter Test", class: "Algebra II", color: "bg-indigo-50 border-indigo-200 text-indigo-800", icon: AlertCircle, daysLeft: 8 },
];

const studyPlan = [
  { day: "Today", tasks: ["Review Ch. 7 notes (30 min)", "Photosynthesis flashcards (20 min)"], class: "Biology", urgent: true },
  { day: "Tomorrow", tasks: ["Light reactions practice questions", "Start essay outline — Gatsby"], class: "Biology + English", urgent: true },
  { day: "Wed Apr 2", tasks: ["Essay draft due — submit", "Bio: Cell respiration review"], class: "English + Bio", urgent: false },
  { day: "Thu Apr 3", tasks: ["Chem lab report due", "Full Bio review — all chapters"], class: "Chemistry + Bio", urgent: false },
];

export default function CalendarPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mode="student" />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Calendar</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" /> Exam
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Assignment
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" /> Study session
              </div>
            </div>
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
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
                  <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                  </button>
                  <h2 className="text-base font-bold text-slate-900">April 2025</h2>
                  <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-slate-100">
                  {days.map((d) => (
                    <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                  {calendarData.map((cell, i) => (
                    <div
                      key={i}
                      className={`min-h-20 p-2 border-b border-r border-slate-100 ${
                        !cell.day ? "bg-slate-50/50" : "hover:bg-slate-50 cursor-pointer"
                      } ${cell.day === 30 ? "bg-indigo-50/40 ring-1 ring-inset ring-indigo-200" : ""}`}
                    >
                      {cell.day && (
                        <>
                          <span
                            className={`text-xs font-semibold inline-flex w-6 h-6 items-center justify-center rounded-full ${
                              cell.day === 30
                                ? "bg-indigo-600 text-white"
                                : "text-slate-600"
                            }`}
                          >
                            {cell.day}
                          </span>
                          <div className="mt-1 space-y-0.5">
                            {cell.events.map((ev, j) => (
                              <div
                                key={j}
                                className={`${ev.color} text-white text-[10px] font-medium px-1.5 py-0.5 rounded truncate`}
                              >
                                {ev.label}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Upcoming */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm">Upcoming Deadlines</h3>
                </div>
                <div className="space-y-2.5">
                  {upcomingEvents.map((ev, i) => {
                    const Icon = ev.icon;
                    return (
                      <div key={i} className={`border rounded-xl px-3 py-3 ${ev.color}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold">{ev.label}</p>
                              <p className="text-xs opacity-70">{ev.class} · {ev.day}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold flex-shrink-0 opacity-70">{ev.daysLeft}d</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Study Plan */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">AI Study Plan</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Generated based on your upcoming exams and assignments
                </p>
                <div className="space-y-3">
                  {studyPlan.map((sp, i) => (
                    <div key={i} className={`rounded-xl border p-3 ${sp.urgent ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50"}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className={`text-xs font-bold ${sp.urgent ? "text-rose-700" : "text-slate-700"}`}>{sp.day}</p>
                        <span className="text-xs text-slate-400">{sp.class}</span>
                      </div>
                      <div className="space-y-1">
                        {sp.tasks.map((task, j) => (
                          <div key={j} className="flex items-start gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-slate-600">{task}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-3 w-full py-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Regenerate study plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

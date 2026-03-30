import Sidebar from "../components/Sidebar";
import {
  Bell,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Sparkles,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

const students = [
  {
    id: "jordan",
    name: "Jordan",
    grade: "10th Grade",
    initials: "JH",
    color: "bg-indigo-100 text-indigo-700",
    streak: 12,
    tasksToday: { done: 1, total: 4 },
    avgProgress: 64,
    nextExam: { name: "Biology Mid-Term", daysLeft: 5 },
    recentActivity: "Captured Biology notes · 2h ago",
    alerts: ["Biology exam in 5 days — study plan active", "Algebra homework due tomorrow"],
    weekSummary: "Jordan studied 4.5 hrs this week and completed 8 of 11 tasks.",
  },
  {
    id: "maya",
    name: "Maya",
    grade: "8th Grade",
    initials: "MH",
    color: "bg-rose-100 text-rose-700",
    streak: 5,
    tasksToday: { done: 3, total: 3 },
    avgProgress: 81,
    nextExam: { name: "Science Quiz", daysLeft: 2 },
    recentActivity: "Completed all tasks · 1h ago",
    alerts: ["Science quiz in 2 days — needs review"],
    weekSummary: "Maya studied 6 hrs this week and completed all 12 tasks. Great week!",
  },
];

const messages = [
  { from: "Jordan", initials: "JH", color: "bg-indigo-100 text-indigo-700", text: "Mom, can you help me with my essay outline?", time: "30m ago", unread: true },
  { from: "Maya", initials: "MH", color: "bg-rose-100 text-rose-700", text: "I finished all my homework! 🎉", time: "1h ago", unread: false },
];

const reminders = [
  { text: "Jordan — Biology exam Friday", urgency: "high", icon: AlertCircle },
  { text: "Maya — Science quiz Wednesday", urgency: "high", icon: AlertCircle },
  { text: "Jordan — Essay draft due tomorrow", urgency: "medium", icon: Clock },
  { text: "Maya — Math test next Monday", urgency: "low", icon: BookOpen },
];

export default function ParentDashboard() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mode="parent" />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Family Overview</h1>
            <p className="text-sm text-slate-500">Monday, March 30 · Mike & Patricia Harris</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
          </div>
        </header>

        <div className="px-8 py-6 space-y-6">

          {/* Alert banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              2 upcoming exams this week — Jordan (Biology, Fri) and Maya (Science, Wed)
            </p>
            <Link href="/calendar" className="ml-auto text-xs font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap">
              View calendar →
            </Link>
          </div>

          {/* Student cards */}
          <div className="grid grid-cols-2 gap-5">
            {students.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Card header */}
                <div className="px-6 py-5 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${s.color} flex items-center justify-center font-bold text-sm`}>
                        {s.initials}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.grade}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-lg">
                        <MessageCircle className="w-3.5 h-3.5" />
                        Message
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-slate-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{s.tasksToday.done}/{s.tasksToday.total}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Tasks today</p>
                    <div className="mt-1.5 bg-slate-100 rounded-full h-1">
                      <div
                        className="bg-emerald-500 h-1 rounded-full"
                        style={{ width: `${(s.tasksToday.done / s.tasksToday.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{s.avgProgress}%</p>
                    <p className="text-xs text-slate-500 mt-0.5">Avg progress</p>
                    <div className="mt-1.5 bg-slate-100 rounded-full h-1">
                      <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${s.avgProgress}%` }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">🔥{s.streak}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Day streak</p>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-3">
                  {/* Next exam */}
                  <div className="flex items-center justify-between bg-rose-50 rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <span className="text-sm text-slate-700 font-medium">{s.nextExam.name}</span>
                    </div>
                    <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                      {s.nextExam.daysLeft}d
                    </span>
                  </div>

                  {/* Week summary from AI */}
                  <div className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-600 leading-relaxed">{s.weekSummary}</p>
                  </div>

                  {/* Recent activity */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-xs text-slate-500">{s.recentActivity}</p>
                  </div>

                  {/* Alerts */}
                  <div className="space-y-1.5 pt-1">
                    {s.alerts.map((alert, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        <p className="text-xs text-slate-600">{alert}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-6 pb-4">
                  <button className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center gap-1">
                    View full report <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom grid */}
          <div className="grid grid-cols-3 gap-5">
            {/* Messages */}
            <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">Messages</h2>
                <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View all</button>
              </div>
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer">
                    <div className={`w-9 h-9 rounded-full ${m.color} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                      {m.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">{m.from}</p>
                        <span className="text-xs text-slate-400">{m.time}</span>
                      </div>
                      <p className="text-sm text-slate-500 truncate">{m.text}</p>
                    </div>
                    {m.unread && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />}
                  </div>
                ))}
                <button className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-sm font-medium text-indigo-700 flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Send encouragement
                </button>
              </div>
            </div>

            {/* Reminders */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">Reminders</h2>
                <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Manage</button>
              </div>
              <div className="space-y-2.5">
                {reminders.map((r, i) => {
                  const Icon = r.icon;
                  const colors: Record<string, string> = {
                    high: "text-rose-500 bg-rose-50",
                    medium: "text-amber-500 bg-amber-50",
                    low: "text-slate-400 bg-slate-50",
                  };
                  return (
                    <div key={i} className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 ${colors[r.urgency]}`}>
                      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-medium leading-snug">{r.text}</p>
                    </div>
                  );
                })}
                <button className="w-full mt-2 py-2.5 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400 hover:text-slate-600 hover:border-slate-300 flex items-center justify-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  Add reminder
                </button>
              </div>
            </div>
          </div>

          {/* Weekly AI summary */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-indigo-200" />
                <span className="text-sm font-semibold text-indigo-200 uppercase tracking-wide">Weekly AI Summary</span>
              </div>
              <p className="text-lg font-bold mb-1">Your kids had a solid week overall.</p>
              <p className="text-sm text-indigo-200 leading-relaxed max-w-xl">
                Maya completed 100% of her tasks — great consistency. Jordan had a strong start but needs to pick up pace on Biology before Friday&apos;s exam. Both kids are on track with their study streaks. No missed assignments this week.
              </p>
            </div>
            <div className="flex flex-col gap-3 flex-shrink-0">
              <div className="bg-white/15 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold">91%</p>
                <p className="text-xs text-indigo-200">Maya tasks</p>
              </div>
              <div className="bg-white/15 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold">73%</p>
                <p className="text-xs text-indigo-200">Jordan tasks</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

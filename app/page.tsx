import Sidebar from "./components/Sidebar";
import {
  CheckCircle2,
  Clock,
  FlameIcon,
  Sparkles,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Plus,
  Bell,
  Camera,
} from "lucide-react";
import Link from "next/link";

const todayTasks = [
  { id: 1, text: "Review Chapter 7 notes — Photosynthesis", class: "Biology", color: "bg-emerald-500", done: true, due: "Today" },
  { id: 2, text: "Complete Problem Set 4.2 (Questions 1–15)", class: "Algebra II", color: "bg-indigo-500", done: false, due: "Today" },
  { id: 3, text: "Read pages 88–102 — The Great Gatsby", class: "English Lit", color: "bg-amber-500", done: false, due: "Today" },
  { id: 4, text: "Flashcard review — WWI causes & dates", class: "US History", color: "bg-rose-500", done: false, due: "Today" },
];

const upcoming = [
  { title: "Biology Mid-Term Exam", date: "Fri, Apr 4", daysLeft: 5, type: "exam", class: "Biology", color: "text-emerald-600 bg-emerald-50" },
  { title: "Essay Draft Due — Gatsby themes", date: "Wed, Apr 2", daysLeft: 3, type: "assignment", class: "English Lit", color: "text-amber-600 bg-amber-50" },
  { title: "Chemistry Lab Report", date: "Thu, Apr 3", daysLeft: 4, type: "assignment", class: "Chemistry", color: "text-violet-600 bg-violet-50" },
  { title: "Algebra II Chapter Test", date: "Mon, Apr 7", daysLeft: 8, type: "exam", class: "Algebra II", color: "text-indigo-600 bg-indigo-50" },
];

const classes = [
  { id: "bio", name: "Biology", teacher: "Mr. Thompson", color: "bg-emerald-500", progress: 78, materials: 14, nextUp: "Chapter 8 — Cell Division" },
  { id: "math", name: "Algebra II", teacher: "Ms. Rivera", color: "bg-indigo-500", progress: 62, materials: 22, nextUp: "Quadratic Functions" },
  { id: "eng", name: "English Lit", teacher: "Mrs. Chen", color: "bg-amber-500", progress: 55, materials: 9, nextUp: "Gatsby Ch. 6–7 Analysis" },
  { id: "hist", name: "US History", teacher: "Mr. Jackson", color: "bg-rose-500", progress: 81, materials: 18, nextUp: "WWI — Treaty of Versailles" },
  { id: "chem", name: "Chemistry", teacher: "Dr. Patel", color: "bg-violet-500", progress: 44, materials: 11, nextUp: "Atomic Structure Lab" },
];

export default function StudentDashboard() {
  const completedToday = todayTasks.filter((t) => t.done).length;
  const totalToday = todayTasks.length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mode="student" />

      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Good morning, Jordan 👋</h1>
            <p className="text-sm text-slate-500">Monday, March 30 · 10th Grade</p>
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
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
          </div>
        </header>

        <div className="px-8 py-6 space-y-8">

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500 font-medium">Today&apos;s Tasks</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {completedToday}
                <span className="text-lg text-slate-400 font-medium">/{totalToday}</span>
              </p>
              <div className="mt-3 bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full"
                  style={{ width: `${(completedToday / totalToday) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500 font-medium">Study Streak</span>
                <FlameIcon className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900">
                12<span className="text-lg text-slate-400 font-medium"> days</span>
              </p>
              <p className="mt-2 text-xs text-amber-600 font-medium">🔥 Personal best!</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500 font-medium">Next Exam</span>
                <AlertCircle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900">
                5<span className="text-lg text-slate-400 font-medium"> days</span>
              </p>
              <p className="mt-2 text-xs text-rose-600 font-medium">Biology Mid-Term</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500 font-medium">Avg. Progress</span>
                <TrendingUp className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900">
                64<span className="text-lg text-slate-400 font-medium">%</span>
              </p>
              <p className="mt-2 text-xs text-indigo-600 font-medium">Across all classes</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left / center column */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Today&apos;s Study Plan</h2>
                <Link href="/calendar" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                  View calendar <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-4 ${task.done ? "opacity-60" : ""}`}
                  >
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${task.done ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}
                    >
                      {task.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.done ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {task.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${task.color}`} />
                        <span className="text-xs text-slate-500">{task.class}</span>
                        <span className="text-xs text-slate-300">·</span>
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{task.due}</span>
                      </div>
                    </div>
                    <Link
                      href="/tutor"
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md flex-shrink-0"
                    >
                      <Sparkles className="w-3 h-3" />
                      Help
                    </Link>
                  </div>
                ))}

                <button className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:text-slate-600 hover:border-slate-300">
                  <Plus className="w-4 h-4" />
                  Add task
                </button>
              </div>

              {/* Classes */}
              <div className="flex items-center justify-between pt-2">
                <h2 className="text-base font-bold text-slate-900">My Classes</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {classes.map((cls) => (
                  <Link
                    key={cls.id}
                    href={`/class/${cls.id}`}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-200 hover:shadow-sm group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-3 h-3 rounded-full ${cls.color} mt-0.5`} />
                      <span className="text-xs text-slate-400">{cls.materials} files</span>
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">{cls.name}</p>
                    <p className="text-xs text-slate-500 mb-3">{cls.teacher}</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Progress</span>
                        <span className="text-xs font-semibold text-slate-700">{cls.progress}%</span>
                      </div>
                      <div className="bg-slate-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${cls.color}`} style={{ width: `${cls.progress}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2.5 truncate">Next: {cls.nextUp}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Upcoming</h2>
                <Link href="/calendar" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">All</Link>
              </div>
              <div className="space-y-2">
                {upcoming.map((item, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 leading-snug">{item.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.date}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${item.color}`}>
                        {item.daysLeft}d
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${item.type === "exam" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}>
                        {item.type === "exam" ? "Exam" : "Assignment"}
                      </span>
                      <span className="text-xs text-slate-400">{item.class}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI recommendation */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wide">AI Recommendation</span>
                </div>
                <p className="text-sm font-medium mb-1">Biology exam in 5 days</p>
                <p className="text-xs text-indigo-200 leading-relaxed">
                  Focus on photosynthesis and cell respiration. I&apos;ve built a 5-day study plan for you.
                </p>
                <Link
                  href="/tutor"
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg w-fit"
                >
                  View study plan <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Parent message */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-800">M</div>
                  <span className="text-xs font-semibold text-amber-800">Mom</span>
                  <span className="text-xs text-amber-500 ml-auto">2h ago</span>
                </div>
                <p className="text-xs text-amber-800">&quot;Don&apos;t forget your Biology exam is Friday! How&apos;s studying going? 💪&quot;</p>
                <button className="mt-2 text-xs font-medium text-amber-700 hover:text-amber-900">Reply →</button>
              </div>

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

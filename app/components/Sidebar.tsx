"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Camera,
  Home,
  MessageCircle,
  Bell,
  Users,
  GraduationCap,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const studentNav = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/capture", icon: Camera, label: "Capture" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/tutor", icon: Sparkles, label: "AI Tutor" },
  { href: "/messages", icon: MessageCircle, label: "Messages" },
];

const parentNav = [
  { href: "/parent", icon: Users, label: "Overview" },
  { href: "/parent/messages", icon: MessageCircle, label: "Messages" },
  { href: "/parent/reminders", icon: Bell, label: "Reminders" },
];

const classes = [
  { id: "bio", name: "Biology", color: "bg-emerald-500", teacher: "Mr. Thompson" },
  { id: "math", name: "Algebra II", color: "bg-indigo-500", teacher: "Ms. Rivera" },
  { id: "eng", name: "English Lit", color: "bg-amber-500", teacher: "Mrs. Chen" },
  { id: "hist", name: "US History", color: "bg-rose-500", teacher: "Mr. Jackson" },
  { id: "chem", name: "Chemistry", color: "bg-violet-500", teacher: "Dr. Patel" },
];

export default function Sidebar({ mode = "student" }: { mode?: "student" | "parent" }) {
  const pathname = usePathname();
  const nav = mode === "student" ? studentNav : parentNav;

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">StudyFlow</span>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
          <Link
            href="/"
            className={cn(
              "flex-1 text-center text-xs font-medium py-1.5 rounded-md transition-all",
              mode === "student"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Student
          </Link>
          <Link
            href="/parent"
            className={cn(
              "flex-1 text-center text-xs font-medium py-1.5 rounded-md transition-all",
              mode === "parent"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Parent
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {nav.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              pathname === href
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}

        {mode === "student" && (
          <>
            <div className="pt-4 pb-2">
              <div className="flex items-center justify-between px-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  My Classes
                </span>
                <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                  + Add
                </button>
              </div>
            </div>
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/class/${cls.id}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                  pathname === `/class/${cls.id}`
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", cls.color)} />
                <span className="font-medium flex-1">{cls.name}</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User profile */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
            {mode === "student" ? "JH" : "MP"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {mode === "student" ? "Jordan H." : "Mike & Patricia H."}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {mode === "student" ? "10th Grade" : "Parent Account"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar, MessageCircle,
  Bell, Users, ChevronRight, Sparkles, LogOut, FlipHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Class } from "@/lib/supabase/types";

type NavItem = {
  href: string;
  icon?: React.ElementType;
  iconPath?: string;
  label: string;
};

const studentNav: NavItem[] = [
  { href: "/",         iconPath: "/icons/icon-home.svg",   label: "Dashboard" },
  { href: "/capture",  iconPath: "/icons/icon-upload.svg", label: "Upload" },
  { href: "/calendar", icon: Calendar,                     label: "Calendar" },
  { href: "/tutor",    icon: Sparkles,                     label: "AI Tutor" },
  { href: "/practice", icon: FlipHorizontal,               label: "Flashcards" },
  { href: "/messages", icon: MessageCircle,                label: "Messages" },
];

const parentNav: NavItem[] = [
  { href: "/",          icon: Users,          label: "Overview" },
  { href: "/messages",  icon: MessageCircle,  label: "Messages" },
  { href: "/reminders", icon: Bell,           label: "Reminders" },
];

const classColors: Record<string, string> = {
  "bg-emerald-500": "bg-emerald-500",
  "bg-indigo-500": "bg-indigo-500",
  "bg-amber-500": "bg-amber-500",
  "bg-rose-500": "bg-rose-500",
  "bg-violet-500": "bg-violet-500",
  "bg-blue-500": "bg-blue-500",
};

interface Props {
  mode: "student" | "parent";
  profile?: Profile;
  classes?: Class[];
  onAddClass?: () => void;
}

const defaultProfile: Profile = {
  id: "", role: "student", full_name: "You", grade: null, color: null, created_at: "",
};

export default function Sidebar({ mode, profile = defaultProfile, classes = [], onAddClass }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const nav = mode === "student" ? studentNav : parentNav;

  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "??";

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 min-h-screen bg-[#0A2637]/75 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10 flex items-center">
        <Image src="/icons/logo.svg" alt="Lumen" width={140} height={39} priority />
      </div>

      {/* Mode switcher */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex bg-white/10 rounded-lg p-1 gap-1">
          <Link
            href="/"
            className={cn(
              "flex-1 text-center text-xs font-medium py-1.5 rounded-md transition-all",
              mode === "student" ? "bg-white/15 text-white shadow-sm" : "text-white/50 hover:text-white/80"
            )}
          >
            Student
          </Link>
          <Link
            href="/"
            className={cn(
              "flex-1 text-center text-xs font-medium py-1.5 rounded-md transition-all",
              mode === "parent" ? "bg-white/15 text-white shadow-sm" : "text-white/50 hover:text-white/80"
            )}
          >
            Parent
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, icon: Icon, iconPath, label }) => (
          <Link
            key={`${href}-${label}`}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              pathname === href
                ? "bg-white/15 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            {iconPath ? (
              <Image src={iconPath} alt="" width={18} height={18} className="flex-shrink-0 opacity-80" />
            ) : Icon ? (
              <Icon className="w-4 h-4 flex-shrink-0" />
            ) : null}
            {label}
          </Link>
        ))}

        {mode === "student" && classes.length > 0 && (
          <>
            <div className="pt-4 pb-2">
              <div className="flex items-center justify-between px-3">
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">My Courses</span>
                <button onClick={onAddClass} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">+ Add</button>
              </div>
            </div>
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/class/${cls.id}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                  pathname === `/class/${cls.id}`
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", classColors[cls.color] ?? "bg-indigo-500")} />
                <span className="font-medium flex-1 truncate">{cls.name}</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User profile + sign out */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center text-indigo-300 font-semibold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
            <p className="text-xs text-white/50 truncate">
              {mode === "student" && profile.grade ? profile.grade : profile.role}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-white/40 hover:text-white flex-shrink-0"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

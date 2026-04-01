"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, Send, BookOpen, FileText, RotateCcw,
  Lightbulb, Loader2, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import type { Profile, Class, Material, Assignment } from "@/lib/supabase/types";

interface Props {
  profile: Profile;
  allClasses: Class[];
  allMaterials: Material[];
  upcomingAssignments: Assignment[];
  defaultClassId?: string;
  defaultPrompt?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS = [
  "Give me 5 practice questions on this topic",
  "Explain the key concepts in simple terms",
  "Make flashcards from my notes",
  "What should I focus on for the exam?",
  "Summarize my notes into bullet points",
  "Create a 5-day study plan",
];

function buildSystemPrompt(
  profile: Profile,
  allClasses: Class[],
  materials: Material[],
  upcoming: Assignment[],
  selectedClassId: string | null
): string {
  const studentName = profile.full_name ?? "Student";
  const selectedClass = allClasses.find((c) => c.id === selectedClassId);

  const classContext = selectedClass
    ? `Currently focused on: **${selectedClass.name}**`
    : `Classes: ${allClasses.map((c) => c.name).join(", ")}`;

  const upcomingText = upcoming.length
    ? upcoming
        .map((a) => {
          const cls = allClasses.find((c) => c.id === a.class_id);
          return `- ${a.type.toUpperCase()}: "${a.title}" (${cls?.name ?? "unknown"}) due ${a.due_date}`;
        })
        .join("\n")
    : "No upcoming deadlines.";

  // Include materials for selected class, or all if none selected
  const relevantMaterials = materials.filter(
    (m) => !selectedClassId || m.class_id === selectedClassId
  );

  const materialsText = relevantMaterials.length
    ? relevantMaterials
        .map((m) => {
          const cls = allClasses.find((c) => c.id === m.class_id);
          const text = m.content_text ? m.content_text.slice(0, 3000) : "(no text — image only)";
          return `### ${m.title} (${cls?.name ?? "unknown"} — ${m.type})\n${text}`;
        })
        .join("\n\n---\n\n")
    : "No materials uploaded yet. Encourage the student to add notes via the Capture page.";

  return `You are a knowledgeable, encouraging AI tutor for ${studentName}.

STUDENT CONTEXT:
${classContext}
Grade: ${profile.grade ?? "not specified"}

UPCOMING DEADLINES:
${upcomingText}

STUDENT'S NOTES & MATERIALS:
${materialsText}

INSTRUCTIONS:
- Reference specific content from the student's actual notes when answering
- For practice questions, base them on the student's real material
- For study schedules, use the actual upcoming deadlines above
- Be encouraging, clear, and appropriately detailed
- Use markdown formatting: **bold** for key terms, bullet lists, headers for structure
- Keep responses focused and actionable — students are busy
- If the student hasn't uploaded notes yet, gently encourage them to use the Capture feature`;
}

export default function TutorClient({
  profile,
  allClasses,
  allMaterials,
  upcomingAssignments,
  defaultClassId,
  defaultPrompt,
}: Props) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(
    defaultClassId ?? null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState(defaultPrompt ?? "");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError]       = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  const selectedClass = allClasses.find((c) => c.id === selectedClassId);
  const classMaterials = allMaterials.filter(
    (m) => !selectedClassId || m.class_id === selectedClassId
  );

  const systemPrompt = buildSystemPrompt(
    profile, allClasses, allMaterials, upcomingAssignments, selectedClassId
  );

  // Dynamic suggested questions based on upcoming exams
  const suggestedQuestions = [
    ...upcomingAssignments
      .filter((a) => a.type === "exam")
      .slice(0, 2)
      .map((a) => {
        const cls = allClasses.find((c) => c.id === a.class_id);
        return `Help me prepare for my ${cls?.name ?? ""} exam: "${a.title}"`;
      }),
    ...QUICK_ACTIONS.slice(0, 4 - Math.min(upcomingAssignments.filter((a) => a.type === "exam").length, 2)),
  ];

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);
    setStreamingText("");
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          systemPrompt,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${await res.text()}`);
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreamingText(full);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: full }]);
      setStreamingText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming, systemPrompt]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function resetChat() {
    setMessages([]);
    setStreamingText("");
    setError("");
    setInput("");
  }

  const initials = (profile.full_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mode="student" classes={allClasses} profile={profile} />

      <main className="flex-1 overflow-hidden flex flex-col" style={{ height: "100vh" }}>
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">AI Tutor</h1>
              <p className="text-xs text-slate-500">
                {selectedClass ? `Focused on ${selectedClass.name}` : "All classes"} · {classMaterials.length} materials in context
              </p>
            </div>
          </div>

          {/* Class filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedClassId(null)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0 transition-all ${
                !selectedClassId
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All classes
            </button>
            {allClasses.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0 transition-all ${
                  selectedClassId === cls.id
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cls.color}`} />
                {cls.name}
              </button>
            ))}
            <button
              onClick={resetChat}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full flex-shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              New chat
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* ── Chat area ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Context banner */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <p className="text-xs text-indigo-700">
                  <span className="font-semibold">AI has access to:</span>{" "}
                  {classMaterials.length > 0
                    ? `${classMaterials.length} material${classMaterials.length > 1 ? "s" : ""} from your ${selectedClass ? selectedClass.name : "classes"} (${classMaterials.map((m) => m.title).slice(0, 3).join(", ")}${classMaterials.length > 3 ? "…" : ""})`
                    : "No materials yet — upload notes to get personalized help"}
                  {upcomingAssignments.length > 0 && ` · ${upcomingAssignments.length} upcoming deadline${upcomingAssignments.length > 1 ? "s" : ""}`}
                </p>
              </div>

              {/* Empty state */}
              {messages.length === 0 && !streaming && (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-7 h-7 text-indigo-600" />
                  </div>
                  <h2 className="font-bold text-slate-800 mb-1">
                    Hi {profile.full_name?.split(" ")[0] ?? "there"}! Ready to study?
                  </h2>
                  <p className="text-sm text-slate-500">
                    Ask me anything about your classes, notes, or upcoming exams.
                  </p>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-2xl ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                    <div className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                    }`}>
                      {msg.role === "user" ? (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:mb-1 prose-ul:my-1 prose-li:my-0">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0 mt-1">
                      {initials}
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming response */}
              {(streaming || streamingText) && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3">
                    {streamingText ? (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:mb-1 prose-ul:my-1 prose-li:my-0">
                        <ReactMarkdown>{streamingText}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking…</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested questions */}
            {messages.length === 0 && (
              <div className="flex-shrink-0 px-6 py-2 border-t border-slate-100 bg-white">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      disabled={streaming}
                      className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 disabled:opacity-50"
                    >
                      <Lightbulb className="w-3 h-3" />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input bar */}
            <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-slate-200">
              <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-300">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedClass
                      ? `Ask about ${selectedClass.name}… (Enter to send, Shift+Enter for newline)`
                      : "Ask anything about your classes… (Enter to send)"
                  }
                  rows={1}
                  disabled={streaming}
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none outline-none leading-relaxed max-h-40 disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || streaming}
                  className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center flex-shrink-0"
                >
                  {streaming
                    ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                    : <Send className="w-4 h-4 text-white" />
                  }
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Answers are based on your actual notes and class materials
              </p>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="w-60 border-l border-slate-200 bg-white flex-shrink-0 overflow-y-auto">
            {/* Quick actions */}
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide text-slate-500 mb-3">Quick actions</h3>
              <div className="space-y-1.5">
                {QUICK_ACTIONS.slice(0, 5).map((a) => (
                  <button
                    key={a}
                    onClick={() => sendMessage(a + (selectedClass ? ` for ${selectedClass.name}` : ""))}
                    disabled={streaming}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{a}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Materials in context */}
            <div className="p-4">
              <h3 className="font-bold text-xs uppercase tracking-wide text-slate-500 mb-3">
                Materials in context
              </h3>
              {classMaterials.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-400 mb-2">No materials yet</p>
                  <Link
                    href="/capture"
                    className="text-xs text-indigo-600 font-medium hover:underline"
                  >
                    + Add notes
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {classMaterials.slice(0, 10).map((m) => {
                    const cls = allClasses.find((c) => c.id === m.class_id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => setInput(`Using my "${m.title}" notes, `)}
                        className="w-full flex items-start gap-2 text-left group"
                      >
                        <FileText className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 group-hover:text-indigo-500 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs text-slate-700 group-hover:text-indigo-600 truncate font-medium">{m.title}</p>
                          {cls && <p className="text-[10px] text-slate-400">{cls.name}</p>}
                        </div>
                      </button>
                    );
                  })}
                  {classMaterials.length > 10 && (
                    <p className="text-xs text-slate-400 text-center">+{classMaterials.length - 10} more</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

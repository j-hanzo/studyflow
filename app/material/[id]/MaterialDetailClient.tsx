"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "../../components/Sidebar";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft, Sparkles, Save, Trash2, X, Plus,
  FileText, StickyNote, ClipboardList, Loader2, AlertCircle,
  Send, ChevronDown, ChevronUp, Calendar, Clock, MessageSquare,
} from "lucide-react";
import Link from "next/link";
import type { Profile, Class, Material, Assignment } from "@/lib/supabase/types";

interface Props {
  profile: Profile;
  allClasses: Class[];
  material: Material;
  classInfo: Class;
  signedUrl: string | null;
  linkedAssignment: Assignment | null;
}

interface ChatMessage { role: "user" | "assistant"; content: string; timestamp?: string; }

interface TutorSession {
  id: string;
  messages: ChatMessage[];
  started_at: string;
  last_message_at: string;
}

type MaterialType = "notes" | "assignment" | "handout";

const TYPE_OPTIONS: { value: MaterialType; label: string; icon: React.ElementType }[] = [
  { value: "notes",      label: "Class Notes",  icon: StickyNote    },
  { value: "handout",    label: "Handout",       icon: FileText      },
  { value: "assignment", label: "Assignment",    icon: ClipboardList },
];

export default function MaterialDetailClient({ profile, allClasses, material, classInfo, signedUrl, linkedAssignment }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle]           = useState(material.title);
  const [content, setContent]       = useState(material.content_text ?? "");
  const [type, setType]             = useState<MaterialType>(material.type);
  const [tags, setTags]             = useState<string[]>(material.tags ?? []);
  const [classId, setClassId]       = useState(material.class_id);
  const [newTag, setNewTag]         = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError]           = useState("");
  const [saved, setSaved]           = useState(false);

  // Inline tutor state
  const [tutorOpen, setTutorOpen]             = useState(false);
  const [tutorTab, setTutorTab]               = useState<"chat" | "history">("chat");
  const [chatMessages, setChatMessages]       = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput]             = useState("");
  const [chatStreaming, setChatStreaming]      = useState(false);
  const [chatStreamText, setChatStreamText]   = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Session history state
  const [sessions, setSessions]                 = useState<TutorSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionsLoaded, setSessionsLoaded]     = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatStreamText]);

  // Load sessions the first time the tutor panel is opened
  useEffect(() => {
    if (tutorOpen && !sessionsLoaded) loadSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorOpen]);

  async function loadSessions() {
    setSessionsLoaded(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("tutor_sessions")
      .select("id, messages, started_at, last_message_at")
      .eq("material_id", material.id)
      .eq("student_id", profile.id)
      .order("last_message_at", { ascending: false })
      .limit(20);
    if (!data || data.length === 0) return;
    setSessions(data as TutorSession[]);
    // Resume the most recent session — gives Claude full context
    const recent = data[0] as TutorSession;
    setCurrentSessionId(recent.id);
    // Strip timestamps before passing to state used for Claude API calls
    setChatMessages(recent.messages.map((m) => ({ role: m.role, content: m.content })));
  }

  function startNewConversation() {
    setChatMessages([]);
    setCurrentSessionId(null);
    setTutorTab("chat");
  }

  const dirty =
    title !== material.title ||
    content !== (material.content_text ?? "") ||
    type !== material.type ||
    classId !== material.class_id ||
    JSON.stringify(tags) !== JSON.stringify(material.tags ?? []) ||
    (type === "assignment" && !!newDueDate && !linkedAssignment);

  async function handleSave() {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from("materials")
      .update({ title: title.trim(), content_text: content.trim() || null, type, tags, class_id: classId })
      .eq("id", material.id);
    setSaving(false);
    if (err) { setError(err.message); return; }

    // If assignment type and a new due date was entered, create calendar deadline
    if (type === "assignment" && newDueDate && !linkedAssignment) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("assignments").insert({
        student_id:  profile.id,
        class_id:    classId,
        title:       title.trim() || "Untitled",
        type:        "assignment",
        due_date:    newDueDate,
        description: `material_ref:${material.id}`,
      });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (classId !== material.class_id) {
      router.push(`/class/${classId}`);
    } else if (newDueDate) {
      router.refresh();
    }
  }

  async function handleDelete() {
    setDeleting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("materials").delete().eq("id", material.id);
    if (material.photo_url) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).storage.from("materials").remove([material.photo_url]);
    }
    router.push(`/class/${material.class_id}`);
  }

  function addTag() {
    const t = newTag.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setNewTag("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function sendChat(text: string) {
    const trimmed = text.trim();
    if (!trimmed || chatStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const newMessages: ChatMessage[] = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatStreaming(true);
    setChatStreamText("");

    const systemPrompt = `You are a homework helper for a student named ${profile.full_name ?? "Student"}.
They are working on: "${material.title}" (${material.type} for ${classInfo.name})
${linkedAssignment ? `Due: ${linkedAssignment.due_date}` : ""}
${content ? `\nMaterial content:\n${content}` : ""}

Help them understand and complete this assignment. Explain concepts clearly, ask guiding questions, and give examples — but don't just hand them the answers. Help them learn.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, systemPrompt }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setChatStreamText(full);
      }
      setChatMessages((prev) => [...prev, { role: "assistant", content: full }]);
      setChatStreamText("");

      // ── Persist Q&A to DB with timestamps ──────────────────────────
      const now = new Date().toISOString();
      const userMsgDb: ChatMessage  = { role: "user",      content: trimmed, timestamp: now };
      const asstMsgDb: ChatMessage  = { role: "assistant", content: full,    timestamp: now };

      if (!currentSessionId) {
        // First message → create a new session
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newSession } = await (supabase as any)
          .from("tutor_sessions")
          .insert({
            student_id:      profile.id,
            material_id:     material.id,
            messages:        [userMsgDb, asstMsgDb],
            last_message_at: now,
          })
          .select("id, started_at")
          .single();
        if (newSession) {
          setCurrentSessionId(newSession.id);
          const sess: TutorSession = {
            id:              newSession.id,
            messages:        [userMsgDb, asstMsgDb],
            started_at:      newSession.started_at,
            last_message_at: now,
          };
          setSessions((prev) => [sess, ...prev]);
        }
      } else {
        // Append to the existing session
        const existing     = sessions.find((s) => s.id === currentSessionId);
        const updatedMsgs  = [...(existing?.messages ?? []), userMsgDb, asstMsgDb];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("tutor_sessions")
          .update({ messages: updatedMsgs, last_message_at: now })
          .eq("id", currentSessionId);
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId ? { ...s, messages: updatedMsgs, last_message_at: now } : s
          )
        );
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong. Try again." }]);
    } finally {
      setChatStreaming(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mode="student" classes={allClasses} profile={profile} />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/class/${material.class_id}`}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              {classInfo.name}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}
            {saved && <span className="text-xs text-emerald-600 font-medium">Saved</span>}
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-sm font-medium px-3 py-2 rounded-lg border border-slate-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-80">
              <h3 className="font-bold text-slate-900 mb-2">Delete material?</h3>
              <p className="text-sm text-slate-500 mb-5">
                &quot;{material.title}&quot; will be permanently deleted. This can&apos;t be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="px-8 py-6 max-w-3xl">
          <div className="space-y-5">

            {/* Photo (if any) */}
            {signedUrl && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Original Photo</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={signedUrl} alt={material.title} className="w-full max-h-96 object-contain bg-slate-50" />
              </div>
            )}

            {/* Title */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-lg font-semibold text-slate-900 border-0 focus:outline-none focus:ring-0 p-0 placeholder:text-slate-300"
                placeholder="Add a title…"
              />
            </div>

            {/* Due date — shown for assignments, right under title */}
            {type === "assignment" && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Calendar className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  {linkedAssignment ? (
                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        Due {new Date(linkedAssignment.due_date + "T00:00:00").toLocaleDateString("en-US", {
                          weekday: "long", month: "long", day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">Deadline on your calendar</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm font-medium text-amber-800">Set a due date</p>
                      <input
                        type="date"
                        value={newDueDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        className="border border-amber-300 bg-white rounded-lg px-3 py-1.5 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      {newDueDate && (
                        <p className="text-xs text-amber-700 font-medium">Will be added to your calendar on save</p>
                      )}
                    </div>
                  )}
                </div>
                {linkedAssignment && (
                  <Link
                    href="/calendar"
                    className="text-xs text-amber-700 font-semibold bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg flex-shrink-0"
                  >
                    View calendar →
                  </Link>
                )}
              </div>
            )}

            {/* Class — move to different class */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Class</label>
              <div className="flex flex-wrap gap-2">
                {allClasses.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => setClassId(cls.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      classId === cls.id
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cls.color}`} />
                    {cls.name}
                  </button>
                ))}
              </div>
              {classId !== material.class_id && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Saving will move this material to {allClasses.find(c => c.id === classId)?.name ?? "the new class"}
                </p>
              )}
            </div>

            {/* Type */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Type</label>
              <div className="flex gap-3">
                {TYPE_OPTIONS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        type === t.value
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Content</label>
                {material.photo_url && (
                  <span className="flex items-center gap-1 text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    AI extracted
                  </span>
                )}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                placeholder="Notes, extracted text, or description…"
                className="w-full text-sm text-slate-700 leading-relaxed border-0 focus:outline-none focus:ring-0 p-0 resize-none placeholder:text-slate-300 bg-transparent"
              />
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-indigo-800">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                  placeholder="Add a tag…"
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={addTag} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Meta */}
            <p className="text-xs text-slate-400 px-1">
              Added {new Date(material.created_at).toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })} · {classInfo.name}
            </p>

            {/* ── Inline Tutor ── */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

              {/* Collapse / expand header */}
              <button
                onClick={() => setTutorOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900">Ask AI Tutor</p>
                    <p className="text-xs text-slate-400">Get help understanding this {material.type}</p>
                  </div>
                </div>
                {tutorOpen
                  ? <ChevronUp className="w-4 h-4 text-slate-400" />
                  : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {tutorOpen && (
                <div className="border-t border-slate-100">

                  {/* Tab bar */}
                  <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between">
                    <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                      <button
                        onClick={() => setTutorTab("chat")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          tutorTab === "chat"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <MessageSquare className="w-3 h-3" /> Chat
                      </button>
                      <button
                        onClick={() => setTutorTab("history")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          tutorTab === "history"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <Clock className="w-3 h-3" /> History
                        {sessions.length > 0 && (
                          <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {sessions.reduce((n, s) => n + Math.floor(s.messages.length / 2), 0)}
                          </span>
                        )}
                      </button>
                    </div>
                    <button
                      onClick={startNewConversation}
                      className="text-xs text-slate-400 hover:text-indigo-600 font-medium transition-colors"
                    >
                      + New conversation
                    </button>
                  </div>

                  {/* ── Chat tab ── */}
                  {tutorTab === "chat" && (
                    <>
                      <div className="max-h-80 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50">
                        {chatMessages.length === 0 && !chatStreaming && (
                          <div className="text-center py-6">
                            <p className="text-xs text-slate-400">
                              Ask anything about this {material.type} — concepts, examples, how to approach it.
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center mt-3">
                              {["Explain the key concept", "How do I start this?", "Give me an example"].map((q) => (
                                <button
                                  key={q}
                                  onClick={() => sendChat(q)}
                                  className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full hover:bg-indigo-100"
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            {msg.role === "assistant" && (
                              <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                            <div className={`max-w-sm rounded-xl px-3 py-2 text-xs ${
                              msg.role === "user"
                                ? "bg-indigo-600 text-white"
                                : "bg-white border border-slate-200 text-slate-700"
                            }`}>
                              {msg.role === "assistant"
                                ? <div className="prose prose-xs max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                                : msg.content}
                            </div>
                          </div>
                        ))}
                        {(chatStreaming || chatStreamText) && (
                          <div className="flex gap-2 justify-start">
                            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="max-w-sm bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700">
                              {chatStreamText
                                ? <div className="prose prose-xs max-w-none"><ReactMarkdown>{chatStreamText}</ReactMarkdown></div>
                                : <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Input */}
                      <div className="px-5 py-3 border-t border-slate-100 flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && sendChat(chatInput)}
                          placeholder="Ask a question…"
                          disabled={chatStreaming}
                          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        />
                        <button
                          onClick={() => sendChat(chatInput)}
                          disabled={!chatInput.trim() || chatStreaming}
                          className="w-9 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center flex-shrink-0"
                        >
                          {chatStreaming
                            ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                            : <Send className="w-4 h-4 text-white" />}
                        </button>
                      </div>
                    </>
                  )}

                  {/* ── History tab ── */}
                  {tutorTab === "history" && (
                    <div className="max-h-96 overflow-y-auto bg-slate-50">
                      {sessions.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                          <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                          <p className="text-xs text-slate-400">No conversation history yet</p>
                          <button
                            onClick={() => setTutorTab("chat")}
                            className="mt-3 text-xs text-indigo-600 font-medium hover:underline"
                          >
                            Start a conversation →
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {sessions.map((session) => {
                            // Group messages into Q&A pairs
                            const pairs: { q: ChatMessage; a?: ChatMessage }[] = [];
                            for (let i = 0; i < session.messages.length; i += 2) {
                              pairs.push({ q: session.messages[i], a: session.messages[i + 1] });
                            }
                            return (
                              <div key={session.id} className="px-5 py-4">
                                {/* Session date/time header */}
                                <div className="flex items-center gap-2 mb-3">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <p className="text-xs font-semibold text-slate-400">
                                    {new Date(session.started_at).toLocaleDateString("en-US", {
                                      weekday: "short", month: "short", day: "numeric", year: "numeric",
                                    })}
                                    {" · "}
                                    {new Date(session.started_at).toLocaleTimeString("en-US", {
                                      hour: "numeric", minute: "2-digit",
                                    })}
                                  </p>
                                </div>

                                {/* Q&A pairs */}
                                <div className="space-y-3">
                                  {pairs.map(({ q, a }, pi) => (
                                    <div key={pi} className="space-y-2">
                                      {/* Question */}
                                      <div className="flex justify-end">
                                        <div className="max-w-xs">
                                          <div className="bg-indigo-600 text-white rounded-xl px-3 py-2 text-xs">
                                            {q.content}
                                          </div>
                                          {q.timestamp && (
                                            <p className="text-[10px] text-slate-400 mt-0.5 text-right">
                                              {new Date(q.timestamp).toLocaleTimeString("en-US", {
                                                hour: "numeric", minute: "2-digit",
                                              })}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      {/* Answer */}
                                      {a && (
                                        <div className="flex gap-2">
                                          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Sparkles className="w-3.5 h-3.5 text-white" />
                                          </div>
                                          <div className="max-w-xs">
                                            <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700">
                                              <div className="prose prose-xs max-w-none">
                                                <ReactMarkdown>{a.content}</ReactMarkdown>
                                              </div>
                                            </div>
                                            {a.timestamp && (
                                              <p className="text-[10px] text-slate-400 mt-0.5">
                                                {new Date(a.timestamp).toLocaleTimeString("en-US", {
                                                  hour: "numeric", minute: "2-digit",
                                                })}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
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

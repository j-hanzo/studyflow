"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { createClient } from "@/lib/supabase/client";
import {
  Upload, ClipboardPaste, Sparkles, CheckCircle2,
  FileText, Image as ImageIcon, X, Loader2, Plus,
  AlertCircle, StickyNote, ClipboardList,
} from "lucide-react";
import Link from "next/link";
import type { Profile, Class, Material } from "@/lib/supabase/types";

interface Props {
  profile: Profile;
  allClasses: Class[];
  recentMaterials: Material[];
  defaultClassId?: string;
}

type MaterialType = "notes" | "assignment" | "handout";
type CaptureMode = "upload" | "paste";
type Step = "input" | "analyzing" | "review" | "saving" | "done";

const TYPE_OPTIONS: { value: MaterialType; label: string; desc: string; icon: React.ElementType }[] = [
  { value: "notes",      label: "Class Notes",  desc: "Handwritten or typed",     icon: StickyNote    },
  { value: "handout",    label: "Handout",       desc: "Teacher-provided sheet",   icon: FileText      },
  { value: "assignment", label: "Assignment",    desc: "Homework or project",      icon: ClipboardList },
];

const MAX_FILE_MB = 50;
const CLAUDE_MAX_PX = 1568; // Claude vision sweet spot — plenty for text extraction
const CLAUDE_MAX_B64_BYTES = 4_000_000; // stay under Vercel 4.5 MB body limit

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1)  return "Just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

export default function CaptureClient({ profile, allClasses, recentMaterials, defaultClassId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [classId, setClassId]         = useState(defaultClassId ?? allClasses[0]?.id ?? "");
  const [materialType, setMaterialType] = useState<MaterialType>("notes");
  const [mode, setMode]               = useState<CaptureMode>("upload");

  // File state
  const [file, setFile]               = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null); // ObjectURL for images
  const [dragOver, setDragOver]       = useState(false);

  // Paste state
  const [pasteText, setPasteText]     = useState("");

  // AI result state
  const [step, setStep]               = useState<Step>("input");
  const [aiTitle, setAiTitle]         = useState("");
  const [aiText, setAiText]           = useState("");
  const [aiTags, setAiTags]           = useState<string[]>([]);
  const [newTag, setNewTag]           = useState("");
  const [error, setError]             = useState("");

  // ── File handling ──────────────────────────────────────────────
  function handleFile(f: File) {
    const mb = f.size / (1024 * 1024);
    if (mb > MAX_FILE_MB) {
      setError(`File too large (${mb.toFixed(1)} MB). Max ${MAX_FILE_MB} MB.`);
      return;
    }
    setError("");
    setFile(f);
    if (f.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(f));
    } else {
      setFilePreview(null); // PDF — no preview
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  function clearFile() {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── AI extraction ───────────────────────────────────────────────
  async function runExtraction() {
    setStep("analyzing");
    setError("");

    try {
      let body: Record<string, string>;

      if (mode === "paste") {
        body = { mode: "text", text: pasteText };
      } else if (file!.type === "application/pdf") {
        const base64 = await fileToBase64(file!);
        body = { mode: "pdf", base64, mimeType: file!.type };
      } else {
        // Compress image before sending — keeps original for storage upload
        const { base64, mimeType } = await compressForClaude(file!);
        body = { mode: "image", base64, mimeType };
      }

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Extraction failed");
      }

      const result = await res.json();
      setAiTitle(result.title ?? "");
      setAiText(result.text ?? "");
      setAiTags(result.tags ?? []);
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStep("input");
    }
  }

  // ── Save to Supabase ────────────────────────────────────────────
  async function handleSave() {
    if (!classId) { setError("Please select a class first"); return; }
    setStep("saving");
    setError("");

    try {
      let photoUrl: string | null = null;

      // Upload file to Supabase Storage if we have one
      if (file) {
        const ext     = file.name.split(".").pop() ?? "bin";
        const path    = `${profile.id}/${crypto.randomUUID()}.${ext}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: uploadErr } = await (supabase as any).storage
          .from("materials")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadErr) throw new Error("Upload failed: " + uploadErr.message);
        // Store the storage path; signed URLs generated on display
        photoUrl = path;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertErr } = await (supabase as any).from("materials").insert({
        student_id:   profile.id,
        class_id:     classId,
        title:        aiTitle.trim() || "Untitled",
        type:         materialType,
        content_text: aiText.trim() || null,
        photo_url:    photoUrl,
        tags:         aiTags,
      });

      if (insertErr) throw new Error(insertErr.message);

      setStep("done");
      // Redirect to the class page after a short delay
      setTimeout(() => router.push(`/class/${classId}`), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setStep("review");
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────
  function fileToBase64(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]); // strip data URL prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }

  /**
   * Resize + compress an image File so the resulting base64 stays under
   * CLAUDE_MAX_B64_BYTES. Preserves aspect ratio. Returns a base64 string
   * (no data-URL prefix) and the output mime type.
   */
  async function compressForClaude(f: File): Promise<{ base64: string; mimeType: string }> {
    const bitmap = await createImageBitmap(f);
    const { width: origW, height: origH } = bitmap;

    // Scale down if either dimension exceeds CLAUDE_MAX_PX
    const scale  = Math.min(1, CLAUDE_MAX_PX / Math.max(origW, origH));
    const width  = Math.round(origW * scale);
    const height = Math.round(origH * scale);

    const canvas = document.createElement("canvas");
    canvas.width  = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    // Try quality 0.85 first, then drop to 0.65 if still too big
    for (const quality of [0.85, 0.65, 0.45]) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const base64  = dataUrl.split(",")[1];
      if (base64.length < CLAUDE_MAX_B64_BYTES) {
        return { base64, mimeType: "image/jpeg" };
      }
    }
    // Last resort — lowest quality
    const dataUrl = canvas.toDataURL("image/jpeg", 0.3);
    return { base64: dataUrl.split(",")[1], mimeType: "image/jpeg" };
  }

  function removeTag(tag: string) {
    setAiTags((prev) => prev.filter((t) => t !== tag));
  }

  function addTag() {
    const t = newTag.trim();
    if (t && !aiTags.includes(t)) setAiTags((prev) => [...prev, t]);
    setNewTag("");
  }

  const canAnalyze = (mode === "upload" && file !== null) || (mode === "paste" && pasteText.trim().length > 10);
  const selectedClass = allClasses.find((c) => c.id === classId);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mode="student" classes={allClasses} profile={profile} />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4">
          <h1 className="text-xl font-bold text-slate-900">Add Material</h1>
          <p className="text-sm text-slate-500 mt-0.5">Upload a file or paste text — Claude AI will extract and organize it</p>
        </header>

        <div className="px-8 py-6">
          <div className="grid grid-cols-3 gap-6">

            {/* ── Main area ── */}
            <div className="col-span-2 space-y-5">

              {/* Step: done */}
              {step === "done" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <p className="font-bold text-emerald-800 text-lg mb-1">Saved!</p>
                  <p className="text-sm text-emerald-600">Redirecting you to the class…</p>
                </div>
              )}

              {step !== "done" && (
                <>
                  {/* Class selector */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Which class is this for? <span className="text-rose-500">*</span>
                    </label>
                    {allClasses.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-slate-400 mb-3">No classes yet — add one first</p>
                        <Link href="/" className="text-sm text-indigo-600 font-medium hover:underline">
                          Go to dashboard to add a class
                        </Link>
                      </div>
                    ) : (
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
                            <div className={`w-2 h-2 rounded-full ${cls.color}`} />
                            {cls.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Material type */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">What type of material?</label>
                    <div className="grid grid-cols-3 gap-3">
                      {TYPE_OPTIONS.map((t) => {
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.value}
                            onClick={() => setMaterialType(t.value)}
                            className={`rounded-xl border-2 p-4 text-left transition-all ${
                              materialType === t.value
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <Icon className={`w-5 h-5 mb-2 ${materialType === t.value ? "text-indigo-600" : "text-slate-400"}`} />
                            <p className={`text-sm font-semibold ${materialType === t.value ? "text-indigo-700" : "text-slate-700"}`}>
                              {t.label}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Capture method tabs */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    {/* Tab switcher */}
                    <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
                      {(["upload", "paste"] as CaptureMode[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => { setMode(m); clearFile(); setPasteText(""); setStep("input"); }}
                          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            mode === m
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {m === "upload" ? "Upload file" : "Paste text"}
                        </button>
                      ))}
                    </div>

                    {/* Upload zone */}
                    {mode === "upload" && (
                      <>
                        {!file ? (
                          <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                              dragOver
                                ? "border-indigo-400 bg-indigo-50"
                                : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                              <Upload className="w-7 h-7 text-slate-400" />
                            </div>
                            <p className="font-semibold text-slate-700 mb-1">
                              Drop a file here, or <span className="text-indigo-600">browse</span>
                            </p>
                            <p className="text-xs text-slate-400">JPG, PNG, PDF · Max {MAX_FILE_MB} MB</p>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                              onChange={handleFileInput}
                              className="hidden"
                            />
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            {/* File preview */}
                            {filePreview ? (
                              <div className="relative bg-slate-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={filePreview}
                                  alt="Preview"
                                  className="w-full max-h-72 object-contain"
                                />
                              </div>
                            ) : (
                              <div className="bg-slate-50 p-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-6 h-6 text-rose-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800 text-sm">{file.name}</p>
                                  <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
                                </div>
                              </div>
                            )}
                            <div className="px-4 py-3 flex items-center justify-between bg-white border-t border-slate-100">
                              <p className="text-xs text-slate-500 truncate max-w-xs">{file.name}</p>
                              <button
                                onClick={clearFile}
                                className="text-slate-400 hover:text-rose-500 ml-2 flex-shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Paste zone */}
                    {mode === "paste" && (
                      <textarea
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        placeholder="Paste your notes, a copied handout, or any class text here…"
                        rows={10}
                        className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                      />
                    )}

                    {/* Error */}
                    {error && (
                      <div className="mt-3 flex items-start gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="text-xs">{error}</p>
                      </div>
                    )}

                    {/* Analyze button */}
                    {step === "input" && (
                      <button
                        onClick={runExtraction}
                        disabled={!canAnalyze || !classId}
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-xl"
                      >
                        <Sparkles className="w-4 h-4" />
                        Analyze with AI
                      </button>
                    )}

                    {step === "analyzing" && (
                      <div className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium py-3 rounded-xl">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Claude is reading your material…
                      </div>
                    )}
                  </div>

                  {/* ── AI Review section ── */}
                  {(step === "review" || step === "saving") && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-semibold text-slate-900">AI Extraction</span>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            Complete
                          </span>
                        </div>
                        <button
                          onClick={() => { setStep("input"); setAiTitle(""); setAiText(""); setAiTags([]); }}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          Start over
                        </button>
                      </div>

                      <div className="p-5 space-y-4">
                        {/* Editable title */}
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                            Title
                          </label>
                          <input
                            type="text"
                            value={aiTitle}
                            onChange={(e) => setAiTitle(e.target.value)}
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Extracted text */}
                        {aiText && (
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" /> Extracted Text
                            </label>
                            <textarea
                              value={aiText}
                              onChange={(e) => setAiText(e.target.value)}
                              rows={6}
                              className="w-full text-xs text-slate-700 leading-relaxed border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            />
                          </div>
                        )}

                        {/* Tags */}
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                            Tags
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {aiTags.map((tag) => (
                              <span
                                key={tag}
                                className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full"
                              >
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
                              className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              onClick={addTag}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Save button */}
                      <div className="px-5 pb-5">
                        <button
                          onClick={handleSave}
                          disabled={step === "saving" || !aiTitle.trim()}
                          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl"
                        >
                          {step === "saving" ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Save to {selectedClass?.name ?? "class"}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Right sidebar ── */}
            <div className="space-y-4">

              {/* SMS tip */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wide">Pro tip</span>
                </div>
                <p className="text-sm font-semibold mb-2">Add from anywhere</p>
                <p className="text-xs text-indigo-200 leading-relaxed mb-3">
                  In class? Text a photo directly to Lumen — it'll be filed here automatically. Coming soon.
                </p>
                <ul className="space-y-1.5 text-xs text-indigo-100">
                  <li className="flex items-start gap-2"><span className="text-indigo-300 mt-0.5">•</span> Good lighting = better text extraction</li>
                  <li className="flex items-start gap-2"><span className="text-indigo-300 mt-0.5">•</span> PDFs and images both supported</li>
                  <li className="flex items-start gap-2"><span className="text-indigo-300 mt-0.5">•</span> Edit AI suggestions before saving</li>
                </ul>
              </div>

              {/* Recent captures */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 text-sm mb-3">Recently Added</h3>
                {recentMaterials.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Nothing yet — add your first material above</p>
                ) : (
                  <div className="space-y-3">
                    {recentMaterials.map((m) => (
                      <div key={m.id} className="flex items-start gap-3 group">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          {m.photo_url
                            ? <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                            : <FileText  className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-800 truncate">{m.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{timeAgo(m.created_at)}</p>
                        </div>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

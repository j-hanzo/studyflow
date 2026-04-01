"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "../../components/Sidebar";
import {
  ArrowLeft, Sparkles, Save, Trash2, X, Plus,
  FileText, StickyNote, ClipboardList, Loader2, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import type { Profile, Class, Material } from "@/lib/supabase/types";

interface Props {
  profile: Profile;
  allClasses: Class[];
  material: Material;
  classInfo: Class;
  signedUrl: string | null;
}

type MaterialType = "notes" | "assignment" | "handout";

const TYPE_OPTIONS: { value: MaterialType; label: string; icon: React.ElementType }[] = [
  { value: "notes",      label: "Class Notes",  icon: StickyNote    },
  { value: "handout",    label: "Handout",       icon: FileText      },
  { value: "assignment", label: "Assignment",    icon: ClipboardList },
];

export default function MaterialDetailClient({ profile, allClasses, material, classInfo, signedUrl }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle]           = useState(material.title);
  const [content, setContent]       = useState(material.content_text ?? "");
  const [type, setType]             = useState<MaterialType>(material.type);
  const [tags, setTags]             = useState<string[]>(material.tags ?? []);
  const [classId, setClassId]       = useState(material.class_id);
  const [newTag, setNewTag]         = useState("");
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError]           = useState("");
  const [saved, setSaved]           = useState(false);

  const dirty =
    title !== material.title ||
    content !== (material.content_text ?? "") ||
    type !== material.type ||
    classId !== material.class_id ||
    JSON.stringify(tags) !== JSON.stringify(material.tags ?? []);

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
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // If class changed, navigate to the new class page
    if (classId !== material.class_id) {
      router.push(`/class/${classId}`);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("materials").delete().eq("id", material.id);
    // Also delete from storage if there's a photo
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
            {saved && (
              <span className="text-xs text-emerald-600 font-medium">Saved</span>
            )}
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
                "{material.title}" will be permanently deleted. This can't be undone.
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
                <img
                  src={signedUrl}
                  alt={material.title}
                  className="w-full max-h-96 object-contain bg-slate-50"
                />
              </div>
            )}

            {/* Title */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-lg font-semibold text-slate-900 border-0 focus:outline-none focus:ring-0 p-0 placeholder:text-slate-300"
                placeholder="Add a title…"
              />
            </div>

            {/* Class — move to different class */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Class
              </label>
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
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Type
              </label>
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

            {/* Extracted text / notes */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Content
                </label>
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
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
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
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600"
                >
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
          </div>
        </div>
      </main>
    </div>
  );
}

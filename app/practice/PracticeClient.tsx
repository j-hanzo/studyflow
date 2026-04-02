"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  Sparkles, RotateCcw, CheckCircle2, BookOpen,
  ChevronLeft, ChevronRight, Loader2, Trophy, RefreshCw,
} from "lucide-react";
import type { Profile, Class, Material } from "@/lib/supabase/types";

interface Props {
  profile: Profile;
  allClasses: Class[];
  allMaterials: Material[];
}

interface Flashcard { question: string; answer: string; }

type Screen = "setup" | "cards" | "done";

export default function PracticeClient({ profile, allClasses, allMaterials }: Props) {
  const [selectedClassId, setSelectedClassId] = useState<string>(allClasses[0]?.id ?? "");
  const [cards, setCards]                     = useState<Flashcard[]>([]);
  const [deck, setDeck]                       = useState<number[]>([]); // indices remaining
  const [currentIdx, setCurrentIdx]           = useState(0);           // index into deck
  const [flipped, setFlipped]                 = useState(false);
  const [screen, setScreen]                   = useState<Screen>("setup");
  const [generating, setGenerating]           = useState(false);
  const [error, setError]                     = useState("");
  const [gotCount, setGotCount]               = useState(0);

  const selectedClass = allClasses.find((c) => c.id === selectedClassId);
  const classMaterials = allMaterials.filter(
    (m) => m.class_id === selectedClassId && m.content_text
  );

  // Current card from deck
  const currentCard = deck.length > 0 ? cards[deck[currentIdx % deck.length]] : null;
  const remaining   = deck.length;
  const total       = cards.length;
  const progress    = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;

  async function generateCards() {
    if (!classMaterials.length) return;
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materials: classMaterials.map((m) => ({
            title:        m.title,
            content_text: m.content_text!,
          })),
          className: selectedClass?.name ?? "class",
          count: Math.min(classMaterials.length * 4, 15), // up to 15 cards
        }),
      });

      if (!res.ok) throw new Error("Failed to generate flashcards");
      const { cards: generated } = await res.json() as { cards: Flashcard[] };
      if (!generated?.length) throw new Error("No cards returned");

      setCards(generated);
      setDeck(generated.map((_, i) => i)); // full deck
      setCurrentIdx(0);
      setFlipped(false);
      setGotCount(0);
      setScreen("cards");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  function handleGotIt() {
    // Remove current card from deck
    const newDeck = deck.filter((_, i) => i !== currentIdx % deck.length);
    const newGot  = gotCount + 1;
    setGotCount(newGot);

    if (newDeck.length === 0) {
      setDeck([]);
      setScreen("done");
    } else {
      setDeck(newDeck);
      setCurrentIdx((prev) => prev % newDeck.length);
      setFlipped(false);
    }
  }

  function handleStudyAgain() {
    // Move card to end of deck
    const cardIdx = deck[currentIdx % deck.length];
    const newDeck = [...deck.filter((_, i) => i !== currentIdx % deck.length), cardIdx];
    setDeck(newDeck);
    setCurrentIdx((prev) => prev % newDeck.length);
    setFlipped(false);
  }

  function restartDeck() {
    setDeck(cards.map((_, i) => i));
    setCurrentIdx(0);
    setFlipped(false);
    setGotCount(0);
    setScreen("cards");
  }

  function backToSetup() {
    setScreen("setup");
    setCards([]);
    setDeck([]);
    setFlipped(false);
    setGotCount(0);
    setError("");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mode="student" classes={allClasses} profile={profile} />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {screen !== "setup" && (
              <button
                onClick={backToSetup}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900">Practice Flashcards</h1>
              {screen === "cards" && selectedClass && (
                <p className="text-sm text-slate-500">{selectedClass.name}</p>
              )}
            </div>
          </div>
          {screen === "cards" && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 font-medium">
                {total - remaining} / {total} mastered
              </span>
              <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </header>

        {/* ── Setup screen ── */}
        {screen === "setup" && (
          <div className="px-8 py-8 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Study with Flashcards</h2>
              <p className="text-slate-500 text-sm">
                Pick a class and Claude will turn your notes into flashcards to quiz you.
              </p>
            </div>

            {/* Class picker */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Which class do you want to study?
              </label>
              {allClasses.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No classes yet — add one from the dashboard.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {allClasses.map((cls) => {
                    const count = allMaterials.filter((m) => m.class_id === cls.id && m.content_text).length;
                    return (
                      <button
                        key={cls.id}
                        onClick={() => setSelectedClassId(cls.id)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                          selectedClassId === cls.id
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${cls.color}`} />
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${selectedClassId === cls.id ? "text-indigo-700" : "text-slate-800"}`}>
                            {cls.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {count} {count === 1 ? "note" : "notes"} available
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Material count summary */}
            {selectedClass && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <p className="text-sm text-indigo-700">
                  {classMaterials.length > 0
                    ? `Claude will generate up to ${Math.min(classMaterials.length * 4, 15)} flashcards from ${classMaterials.length} ${classMaterials.length === 1 ? "note" : "notes"} in ${selectedClass.name}`
                    : `No notes with text content found in ${selectedClass.name} yet. Upload some notes first.`}
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-rose-600 text-center mb-4">{error}</p>
            )}

            <button
              onClick={generateCards}
              disabled={generating || !selectedClassId || classMaterials.length === 0}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-2xl flex items-center justify-center gap-2 text-base"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating flashcards…
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Flashcards
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Flashcard screen ── */}
        {screen === "cards" && currentCard && (
          <div className="flex flex-col items-center justify-center px-8 py-8 min-h-[calc(100vh-73px)]">

            {/* Deck counter */}
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-6">
              {remaining} {remaining === 1 ? "card" : "cards"} remaining
            </p>

            {/* Flashcard */}
            <div
              className="w-full max-w-lg cursor-pointer select-none"
              style={{ perspective: "1200px" }}
              onClick={() => !flipped && setFlipped(true)}
            >
              <div
                style={{
                  transformStyle: "preserve-3d",
                  transition:     "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform:      flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  position:       "relative",
                  height:         "280px",
                }}
              >
                {/* Front — Question */}
                <div
                  className="absolute inset-0 bg-white rounded-3xl border-2 border-slate-200 shadow-lg flex flex-col items-center justify-center px-8 py-8"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-4">Question</span>
                  <p className="text-xl font-semibold text-slate-900 text-center leading-snug">
                    {currentCard.question}
                  </p>
                  <p className="text-xs text-slate-400 mt-6 flex items-center gap-1.5">
                    <RotateCcw className="w-3 h-3" /> Tap to reveal answer
                  </p>
                </div>

                {/* Back — Answer */}
                <div
                  className="absolute inset-0 bg-indigo-600 rounded-3xl shadow-lg flex flex-col items-center justify-center px-8 py-8"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-4">Answer</span>
                  <p className="text-lg font-medium text-white text-center leading-relaxed">
                    {currentCard.answer}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons — appear after flip */}
            <div className={`mt-8 flex gap-4 transition-all duration-300 ${flipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
              <button
                onClick={handleStudyAgain}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-amber-300 bg-amber-50 text-amber-700 font-semibold text-sm hover:bg-amber-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Study again
              </button>
              <button
                onClick={handleGotIt}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Got it!
              </button>
            </div>

            {/* Navigation hint */}
            <div className="mt-6 flex items-center gap-6">
              <button
                onClick={() => { setCurrentIdx((p) => (p - 1 + deck.length) % deck.length); setFlipped(false); }}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400">
                {(currentIdx % deck.length) + 1} of {deck.length} in deck
              </span>
              <button
                onClick={() => { setCurrentIdx((p) => (p + 1) % deck.length); setFlipped(false); }}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Done screen ── */}
        {screen === "done" && (
          <div className="flex flex-col items-center justify-center px-8 py-16 min-h-[calc(100vh-73px)]">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {gotCount === total ? "Perfect score! 🎉" : "Nice work!"}
              </h2>
              <p className="text-slate-500 mb-2">
                You mastered <span className="font-bold text-emerald-600">{gotCount}</span> out of{" "}
                <span className="font-bold text-slate-800">{total}</span> cards.
              </p>
              {selectedClass && (
                <p className="text-sm text-slate-400 mb-8">{selectedClass.name}</p>
              )}

              {/* Score bar */}
              <div className="w-full bg-slate-100 rounded-full h-3 mb-8 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.round((gotCount / total) * 100)}%` }}
                />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={restartDeck}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Study again
                </button>
                <button
                  onClick={backToSetup}
                  className="w-full py-3 border-2 border-slate-200 text-slate-600 font-semibold rounded-2xl hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Pick another class
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

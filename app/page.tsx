"use client";

import { useMemo, useState } from "react";

const GOALS = ["reply", "flirty", "apology", "boundary", "reconnect"] as const;
const TONES = ["chill", "playful", "confident", "soft"] as const;

type Goal = (typeof GOALS)[number];
type Tone = (typeof TONES)[number];

export default function Home() {
  const [goal, setGoal] = useState<Goal>("reply");
  const [tone, setTone] = useState<Tone>("chill");
  const [conversation, setConversation] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWhy, setShowWhy] = useState(false);

  const charCount = useMemo(() => conversation.length, [conversation]);

  const handleGenerate = async () => {
    setError(null);

    if (!conversation.trim()) {
      setError("paste a conversation first.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, tone, conversation }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || data?.detail || "something went wrong.");
        return;
      }

      setResult(data);
    } catch (e: any) {
      setError(e?.message || "request failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#efe6df]">
      {/* soft background orbs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full bg-rose-300/60 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-28 -left-28 h-[520px] w-[520px] rounded-full bg-amber-200/50 blur-[140px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-6 py-14">
        <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-2">
          {/* LEFT: input card */}
          <section className="rounded-3xl border border-white/50 bg-white/55 p-8 shadow-xl backdrop-blur-xl">
            <div className="mb-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-3 py-1 text-xs text-neutral-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                razz coach
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-900">
                say less. text better.
              </h1>
              <p className="mt-2 text-sm text-neutral-700">
                pick a goal + tone, paste the convo, get 3 natural replies.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-neutral-700">goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as Goal)}
                  className="mt-2 w-full rounded-2xl border border-black/5 bg-white px-4 py-2 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-black/10"
                >
                  {GOALS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700">tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="mt-2 w-full rounded-2xl border border-black/5 bg-white px-4 py-2 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-black/10"
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-700">conversation</label>
                <span className="text-xs text-neutral-500">{charCount} chars</span>
              </div>

              <textarea
                placeholder={`Her: you are funny\nMe: ???`}
                value={conversation}
                onChange={(e) => setConversation(e.target.value)}
                className="mt-2 h-44 w-full resize-none rounded-3xl border border-black/5 bg-white p-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-black/10"
              />
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-4">
              <label className="inline-flex items-center gap-2 text-xs text-neutral-700">
                <input
                  type="checkbox"
                  checked={showWhy}
                  onChange={(e) => setShowWhy(e.target.checked)}
                  className="h-4 w-4 rounded border-black/10"
                />
                show why
              </label>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="rounded-2xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "generating…" : "generate 3 replies"}
              </button>
            </div>

            <p className="mt-5 text-xs text-neutral-500">
              calm, understated, no try-hard lines.
            </p>
          </section>

          {/* RIGHT: output card */}
          <section className="rounded-3xl border border-white/50 bg-white/65 p-8 shadow-xl backdrop-blur-xl">
            <div className="mb-6">
              <div className="text-xs font-medium text-neutral-700">output</div>
              <div className="mt-2 text-4xl font-light tracking-tight text-neutral-900">
                {goal}
              </div>
              <div className="mt-1 text-sm text-neutral-700">
                tone: <span className="text-neutral-900">{tone}</span>
              </div>
            </div>

            {!result ? (
              <div className="rounded-3xl border border-black/5 bg-white p-6 text-sm text-neutral-700">
                your replies will appear here.
              </div>
            ) : (
              <div className="space-y-4">
                {result.replies?.map((reply: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-xs font-medium text-neutral-700">
                        reply {index + 1}
                      </div>
                      <button
                        onClick={() => handleCopy(reply.text)}
                        className="text-xs text-neutral-600 hover:text-neutral-900"
                      >
                        copy
                      </button>
                    </div>

                    <div className="mt-2 text-lg leading-relaxed text-neutral-900">
                      {reply.text}
                    </div>

                    {showWhy && reply.why && (
                      <div className="mt-2 text-xs text-neutral-700">
                        {reply.why}
                      </div>
                    )}
                  </div>
                ))}

                {result.notes?.[0] && (
                  <div className="rounded-3xl border border-black/5 bg-white px-5 py-4 text-xs text-neutral-700">
                    {result.notes[0]}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

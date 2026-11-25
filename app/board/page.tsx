"use client";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { nextAttemptValue, pointsFor } from "@/lib/scoring";
import { FortinetBar, Footer } from "../brand";

type Option = { key: string; label: string };
type Q = {
  id: number;
  prompt: string;
  options: Option[];
  attempts: number;
  solved: boolean;
  points: number;
  chosen: string[];
  rationale: string | null;
  correctKey: string | null;
};
type Task = {
  id: number;
  title: string;
  moment: string;
  severity: string;
  summary: string;
  unlocked: boolean;
  done: boolean;
  questions: Q[];
};
type State = {
  user: { id: string; alias: string; role: string; points: number };
  tasks: Task[];
  activeTaskId: number | null;
  allDone: boolean;
};
type Row = { id: string; alias: string; points: number; solved: number; firstTries: number; tasks: number; accuracy: number };

function avatarColor(alias: string) {
  const palette = ["#E8362F", "#E0A33E", "#2BB673", "#5BA7FF", "#B678E8", "#FF9BB3", "#4CC1C7"];
  let h = 0;
  for (const c of alias) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}

export default function BoardPage() {
  const { data: session } = useSession();
  const myAlias = session?.user?.alias;
  const [state, setState] = useState<State | null>(null);
  const [scoreboard, setScoreboard] = useState<Row[]>([]);
  const [feedback, setFeedback] = useState<Record<number, { ok: boolean; delta: number; attempt: number } | null>>({});
  const [celebrate, setCelebrate] = useState<number | null>(null);
  const prevPoints = useRef<number | null>(null);

  const load = useCallback(async () => {
    const [me, sc] = await Promise.all([
      fetch("/api/me", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/scoreboard", { cache: "no-store" }).then((r) => r.json())
    ]);
    if (me && !me.error) setState(me);
    if (sc?.rows) setScoreboard(sc.rows);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 1800);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!state) return;
    if (prevPoints.current !== null && state.user.points > prevPoints.current) {
      setCelebrate(state.user.points - prevPoints.current);
      setTimeout(() => setCelebrate(null), 1100);
    }
    prevPoints.current = state.user.points;
  }, [state]);

  const activeTask = useMemo(() => state?.tasks.find((t) => t.id === state.activeTaskId) || null, [state]);

  async function answer(q: Q, key: string) {
    const res = await fetch("/api/answers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ questionId: q.id, chosenKey: key })
    });
    const j = await res.json();
    if (!res.ok) {
      alert(j.error || "Error");
      return;
    }
    setFeedback((f) => ({ ...f, [q.id]: { ok: j.isCorrect, delta: j.pointsAwarded, attempt: j.attemptNumber } }));
    load();
  }

  if (!state) {
    return <main className="min-h-screen flex items-center justify-center text-[var(--muted)]">Cargando…</main>;
  }

  return (
    <main className="min-h-screen flex flex-col">
    <div className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
      <header className="flex items-center justify-between mb-2">
        <FortinetBar subtitle="Marcador" />
        <div className="flex items-center gap-4">
          <div className="text-right relative">
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Puntos</div>
            <div className="text-2xl font-bold leading-none">{state.user.points}</div>
            {celebrate !== null && (
              <div className="absolute right-0 -top-1 text-[var(--success)] font-bold gain">+{celebrate}</div>
            )}
          </div>
          <button className="btn btn-ghost" onClick={() => signOut({ callbackUrl: "/login" })}>Salir</button>
        </div>
      </header>
      <div className="chev-divider" />
      <div className="flex items-center gap-3 mb-6">
        <div className="avatar" style={{ background: avatarColor(state.user.alias) }}>
          {state.user.alias.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="text-lg font-bold leading-tight">{state.user.alias}</div>
          <div className="text-xs text-[var(--muted)]">Laboratorio PHP2Shell</div>
        </div>
      </div>

      {/* Scoreboard */}
      <section className="card overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold">Marcador general</h2>
          <span className="chip"><span className="pulse-dot"></span> live</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 56 }}>#</th>
                <th>Alias</th>
                <th>Puntos</th>
                <th>Aciertos 1ª</th>
                <th>Tareas</th>
                <th>Precisión</th>
              </tr>
            </thead>
            <tbody>
              {scoreboard.map((r, i) => (
                <tr key={r.id} className={r.alias === myAlias ? "me" : ""}>
                  <td className="pos">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="avatar" style={{ width: 24, height: 24, fontSize: 11, background: avatarColor(r.alias) }}>
                        {r.alias.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="mono">{r.alias}</span>
                    </div>
                  </td>
                  <td><strong>{r.points}</strong></td>
                  <td>{r.firstTries}</td>
                  <td>{r.tasks}/8</td>
                  <td>{r.accuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Task progress strip */}
      <section className="flex gap-1.5 mb-5 overflow-x-auto">
        {state.tasks.map((t) => {
          const isActive = t.id === state.activeTaskId;
          return (
            <div
              key={t.id}
              className={`flex-1 min-w-[80px] rounded-lg px-3 py-2 border text-center ${
                t.done
                  ? "border-[#1f6e49] bg-[rgba(43,182,115,0.08)]"
                  : isActive
                  ? "border-[var(--accent)] bg-[rgba(232,54,47,0.08)]"
                  : t.unlocked
                  ? "border-[var(--border)]"
                  : "border-[var(--border)] task-locked"
              }`}
              title={t.title}
            >
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Tarea {t.id}</div>
              <div className="text-xs font-semibold mt-0.5">
                {t.done ? "✓" : isActive ? "en curso" : t.unlocked ? "—" : "🔒"}
              </div>
            </div>
          );
        })}
      </section>

      {/* Active task */}
      {state.allDone ? (
        <section className="card p-8 text-center">
          <div className="text-5xl mb-2">🏁</div>
          <div className="text-xl font-bold mb-1">¡Has completado las 8 tareas!</div>
          <div className="text-[var(--muted)]">Puntuación final: <strong>{state.user.points}</strong> puntos.</div>
        </section>
      ) : activeTask ? (
        <section className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-xs text-[var(--muted)] mono">Tarea {activeTask.id} · {activeTask.moment}</div>
              <h2 className="text-xl font-bold mt-0.5">{activeTask.title}</h2>
              <div className="text-sm text-[var(--muted)]">{activeTask.summary}</div>
            </div>
            <span className={`chip chip-sev-${activeTask.severity}`}>Severidad {activeTask.severity}</span>
          </div>

          <ol className="space-y-6">
            {activeTask.questions.map((q, idx) => {
              const fb = feedback[q.id];
              const nextVal = nextAttemptValue(q.attempts);
              return (
                <li key={q.id}>
                  <div className="text-sm text-[var(--muted)] mono mb-1">Pregunta {idx + 1}</div>
                  <div className="font-medium mb-3">{q.prompt}</div>
                  <div className="space-y-2">
                    {q.options.map((o) => {
                      const chosen = q.chosen.includes(o.key);
                      const isCorrectReveal = q.solved && o.key === q.correctKey;
                      const isWrongChoice = chosen && !isCorrectReveal;
                      return (
                        <button
                          key={o.key}
                          disabled={q.solved || chosen}
                          onClick={() => answer(q, o.key)}
                          className={`option ${isCorrectReveal ? "correct" : ""} ${isWrongChoice ? "wrong" : ""}`}
                        >
                          <span className="key">{o.key.toUpperCase()}</span>
                          <span className="flex-1">{o.label}</span>
                          {isCorrectReveal && <span className="text-[var(--success)] text-xs font-semibold">✓ correcta</span>}
                          {isWrongChoice && <span className="text-[var(--danger)] text-xs font-semibold">✗</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-sm flex items-center gap-3">
                    {q.solved ? (
                      <span className="text-[var(--success)]">
                        +{q.points} puntos · {q.rationale}
                      </span>
                    ) : fb ? (
                      <span className={fb.ok ? "text-[var(--success)]" : "text-[var(--danger)]"}>
                        {fb.ok
                          ? `+${fb.delta} puntos (intento ${fb.attempt})`
                          : `Fallaste en el intento ${fb.attempt}. El siguiente vale ${nextVal} puntos.`}
                      </span>
                    ) : (
                      <span className="text-[var(--muted)]">
                        Vale {pointsFor(q.attempts + 1)} puntos · intentos realizados: {q.attempts}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : (
        <section className="card p-8 text-center text-[var(--muted)]">Esperando a que se desbloquee la siguiente tarea…</section>
      )}
    </div>
    <Footer />
    </main>
  );
}

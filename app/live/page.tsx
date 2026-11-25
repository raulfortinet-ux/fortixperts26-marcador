"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import "./live.css";

type Row = {
  id: string;
  alias: string;
  points: number;
  solved: number;
  firstTries: number;
  tasksDone: number;
  accuracy: number;
  activeTask: number | null;
  taskStrip: { id: number; done: boolean; active: boolean }[];
  lastGain: { points: number; isCorrect: boolean; taskId: number | null; attempt: number; at: string } | null;
};
type Event = {
  id: string;
  at: string;
  alias: string;
  taskId: number;
  questionOrder: number;
  isCorrect: boolean;
  pointsAwarded: number;
  attemptNumber: number;
};
type Payload = {
  rows: Row[];
  events: Event[];
  taskCount: number;
  kpi: {
    players: number;
    avgProgress: number;
    firstTries: number;
    solved: number;
    totalAttempts: number;
    leader: { alias: string; points: number; lead: number } | null;
  };
};

const PALETTE = ["#E8362F", "#E0A33E", "#2BB673", "#5BA7FF", "#B678E8", "#FF9BB3", "#4CC1C7", "#F4C249"];
function avatarColor(alias: string) {
  let h = 0;
  for (const c of alias) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function initials(alias: string) {
  const parts = alias.replace(/[._-]/g, " ").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return alias.slice(0, 2).toUpperCase();
}
function hhmm(iso: string) {
  const d = new Date(iso);
  return d.toTimeString().slice(0, 5);
}

export default function LivePage() {
  const [data, setData] = useState<Payload | null>(null);
  const [now, setNow] = useState("");
  const prevPoints = useRef<Record<string, number>>({});
  const [flashIds, setFlashIds] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    try {
      const j = (await fetch("/api/live", { cache: "no-store" }).then((r) => r.json())) as Payload;
      setData(j);
      const pts: Record<string, number> = {};
      const flashes: Record<string, number> = {};
      for (const r of j.rows) {
        const prev = prevPoints.current[r.id];
        if (prev !== undefined && r.points > prev) flashes[r.id] = r.points - prev;
        pts[r.id] = r.points;
      }
      prevPoints.current = pts;
      if (Object.keys(flashes).length) {
        setFlashIds(flashes);
        setTimeout(() => setFlashIds({}), 1400);
      }
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 1800);
    const c = setInterval(() => setNow(new Date().toTimeString().slice(0, 8)), 1000);
    setNow(new Date().toTimeString().slice(0, 8));
    return () => {
      clearInterval(t);
      clearInterval(c);
    };
  }, [load]);

  if (!data) {
    return (
      <main className="live-wrap">
        <div style={{ opacity: 0.6, padding: 40 }}>Cargando marcador…</div>
      </main>
    );
  }

  const top3 = data.rows.slice(0, 3);
  const rest = data.rows;
  const taskCount = data.taskCount || 8;
  const leaderPoints = data.kpi.leader?.points ?? 0;
  const maxPossible = taskCount * 3 * 10;

  return (
    <main className="live-wrap">
      <header className="bar">
        <div className="brand">
          <div className="mark" aria-hidden="true" />
          <div className="title">
            <b>Fortinet</b>
            <span>|</span>XPERTS26 · <span className="w">Marcador en vivo</span>
          </div>
        </div>
        <div className="meta">
          <span className="live">
            <span className="dot" /> LIVE · PHP2Shell
          </span>
          <span>{now}</span>
          <span>
            {data.kpi.players} <span className="mu">analistas</span>
          </span>
        </div>
      </header>

      <div>
        <h1>
          Laboratorio del analista · <span className="accent">PHP2Shell</span>
        </h1>
        <p className="subtitle">
          8 tareas, puntuación en vivo. Acertar a la primera vale 10 · segundo intento 7 · tercero 4 · cuarto 1.
        </p>
      </div>
      <div className="ribbon" aria-hidden="true" />

      <section className="stage">
        <div className="card">
          <div className="head">
            <h2>Clasificación general</h2>
            <small>
              Actualizado cada 1.8 s · {data.rows.length} participantes
            </small>
          </div>

          {top3.length > 0 && (
            <div className="podium">
              {top3[1] ? (
                <PodiumCol row={top3[1]} rank={2} />
              ) : (
                <div />
              )}
              {top3[0] ? (
                <PodiumCol row={top3[0]} rank={1} />
              ) : (
                <div />
              )}
              {top3[2] ? (
                <PodiumCol row={top3[2]} rank={3} />
              ) : (
                <div />
              )}
            </div>
          )}

          <div className="tbl-wrap">
            <div className="row hdr">
              <div className="pos">#</div>
              <div>Analista</div>
              <div className="pts-cell">Puntos</div>
              <div>Tareas 1 → {taskCount}</div>
              <div className="acc">Precisión</div>
            </div>

            {rest.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--live-muted)" }}>
                Esperando a los primeros intentos…
              </div>
            )}

            {rest.map((r, i) => {
              const flash = flashIds[r.id];
              const rankClass = i === 0 ? "g1" : i === 1 ? "g2" : i === 2 ? "g3" : "";
              const activeId = r.activeTask;
              return (
                <div key={r.id} className={`row${flash ? " flash" : ""}`}>
                  <div className={`pos ${rankClass}`}>{String(i + 1).padStart(2, "0")}</div>
                  <div className="who">
                    <div className="av" style={{ background: avatarColor(r.alias) }}>
                      {initials(r.alias)}
                    </div>
                    <div>
                      <div className="name">{r.alias}</div>
                      <div className="sub">
                        {activeId ? `Tarea ${activeId}` : r.tasksDone === taskCount ? "✓ terminado" : "—"}
                      </div>
                    </div>
                  </div>
                  <div className="pts-cell">
                    {r.points}
                    {flash ? <span className="gain">+{flash}</span> : null}
                  </div>
                  <div className="tasks">
                    {r.taskStrip.map((t) => (
                      <div
                        key={t.id}
                        className={`t-cell${t.done ? " done" : ""}${t.active ? " active" : ""}`}
                      >
                        {t.id}
                      </div>
                    ))}
                  </div>
                  <div className="acc">
                    {r.accuracy}%<small>{r.firstTries} a la 1ª</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rail">
          <div className="card">
            <div className="head">
              <h2>Pulso del evento</h2>
              <small>en vivo</small>
            </div>
            <div className="kpi">
              <div className="k">
                <div className="lbl">Avance medio</div>
                <div className="val">
                  {data.kpi.avgProgress}
                  <span className="u">/ 100</span>
                </div>
                <div className="bar-fill">
                  <i style={{ width: `${data.kpi.avgProgress}%` }} />
                </div>
              </div>
              <div className="k">
                <div className="lbl">Aciertos 1ª</div>
                <div className="val">
                  {data.kpi.firstTries}
                  <span className="u">/ {data.kpi.solved || 0} totales</span>
                </div>
                <div className="bar-fill">
                  <i
                    style={{
                      width: `${data.kpi.solved ? Math.round((data.kpi.firstTries / data.kpi.solved) * 100) : 0}%`
                    }}
                  />
                </div>
              </div>
              <div className="k">
                <div className="lbl">Líder</div>
                <div className="val sm" style={{ color: "var(--live-gold)" }}>
                  {data.kpi.leader?.alias ?? "—"}
                  <span className="u" style={{ color: "var(--live-muted)" }}>
                    {data.kpi.leader ? `+${data.kpi.leader.lead}` : ""}
                  </span>
                </div>
                <div className="bar-fill">
                  <i
                    style={{
                      width: `${Math.min(100, Math.round((leaderPoints / maxPossible) * 100))}%`,
                      background: "linear-gradient(90deg,var(--live-gold),#ffe29a)"
                    }}
                  />
                </div>
              </div>
              <div className="k">
                <div className="lbl">Intentos totales</div>
                <div className="val sm">{data.kpi.totalAttempts}</div>
                <div className="bar-fill">
                  <i style={{ width: "100%", background: "linear-gradient(90deg,var(--live-good),#5de0a0)" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="head">
              <h2>Jugadas recientes</h2>
              <small>últimas {data.events.length}</small>
            </div>
            <div className="ticker">
              {data.events.length === 0 && (
                <div style={{ padding: 20, color: "var(--live-muted)" }}>
                  Ninguna jugada aún. Al primer intento se verá aquí.
                </div>
              )}
              {data.events.map((e, idx) => {
                const first = e.isCorrect && e.attemptNumber === 1;
                const tag = e.isCorrect
                  ? first
                    ? "first"
                    : "pts"
                  : "fail";
                const label = e.isCorrect
                  ? first
                    ? `+${e.pointsAwarded} · 1ª`
                    : `+${e.pointsAwarded} · ${e.attemptNumber}º`
                  : `fallo ${e.attemptNumber}º`;
                return (
                  <div key={e.id} className={`ev${idx === 0 ? " flash" : ""}`}>
                    <span className="time">{hhmm(e.at)}</span>
                    <span className="av" style={{ background: avatarColor(e.alias) }}>
                      {initials(e.alias)}
                    </span>
                    <span className="msg">
                      <b>{e.alias}</b>{" "}
                      {e.isCorrect ? (first ? "acierta a la primera" : "acierta") : "falla"}{" "}
                      <em>
                        Tarea {e.taskId} · P{e.questionOrder}
                      </em>
                    </span>
                    <span className={`tag ${tag}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function PodiumCol({ row, rank }: { row: Row; rank: 1 | 2 | 3 }) {
  return (
    <div className={`p-col p-${rank}`}>
      <div className="rank">{String(rank).padStart(2, "0")}</div>
      {rank === 1 && <div className="cup">🏆</div>}
      <div className="avatar" style={{ background: avatarColor(row.alias), color: rank === 1 ? "#fff" : "#000" }}>
        {initials(row.alias)}
      </div>
      <div className="alias">{row.alias}</div>
      <div className="pts">{row.points}</div>
      <div className="delta">
        {row.lastGain
          ? row.lastGain.isCorrect
            ? `▲ +${row.lastGain.points} · T${row.lastGain.taskId}`
            : `fallo T${row.lastGain.taskId}`
          : "sin jugadas"}
      </div>
    </div>
  );
}

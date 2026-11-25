"use client";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { FortinetBar, Footer } from "../brand";

type Participant = { id: string; alias: string; createdAt: string };
type Row = { id: string; alias: string; points: number; solved: number; firstTries: number; tasks: number; accuracy: number; durationSec: number | null };

function fmtDuration(s: number | null) {
  if (s == null) return "—";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r.toString().padStart(2, "0")}s`;
}

export default function AdminPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [scoreboard, setScoreboard] = useState<Row[]>([]);
  const [newAlias, setNewAlias] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [lastCreated, setLastCreated] = useState<{ alias: string; password: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [p, s] = await Promise.all([
      fetch("/api/admin/participants").then((r) => r.json()),
      fetch("/api/scoreboard").then((r) => r.json())
    ]);
    setParticipants(p.users || []);
    setScoreboard(s.rows || []);
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newAlias.trim()) return;
    setBusy(true);
    const res = await fetch("/api/admin/participants", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ alias: newAlias.trim(), password: newPwd || undefined })
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "No se pudo crear");
      return;
    }
    const j = await res.json();
    setLastCreated({ alias: j.user.alias, password: j.password });
    setNewAlias("");
    setNewPwd("");
    load();
  }

  async function remove(id: string, alias: string) {
    if (!confirm(`¿Eliminar a ${alias}? Se borra también su progreso.`)) return;
    await fetch(`/api/admin/participants/${id}`, { method: "DELETE" });
    load();
  }
  async function reset(id: string, alias: string) {
    if (!confirm(`¿Reiniciar progreso de ${alias}?`)) return;
    await fetch(`/api/admin/participants/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "reset" })
    });
    load();
  }
  async function resetPassword(id: string, alias: string) {
    const manual = prompt(`Nueva contraseña para ${alias} (deja vacío para generar una):`, "");
    if (manual === null) return;
    const res = await fetch(`/api/admin/participants/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "resetPassword", password: manual || undefined })
    });
    const j = await res.json();
    if (!res.ok) {
      alert(j.error || "No se pudo cambiar la contraseña");
      return;
    }
    setLastCreated({ alias: j.alias, password: j.password });
  }
  async function resetAll() {
    if (!confirm("¿Reiniciar el evento? Se borran TODOS los intentos y progresos.")) return;
    await fetch("/api/admin/reset", { method: "POST" });
    load();
  }

  return (
    <main className="min-h-screen flex flex-col">
     <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
      <header className="flex items-center justify-between mb-2">
        <FortinetBar subtitle="Panel admin" />
        <div className="flex gap-2">
          <a className="btn" href="/api/admin/export" download>Exportar CSV</a>
          <button className="btn" onClick={resetAll}>Reiniciar evento</button>
          <button className="btn btn-ghost" onClick={() => signOut({ callbackUrl: "/login" })}>Salir</button>
        </div>
      </header>
      <div className="chev-divider" />
      <div className="text-xs text-[var(--muted)] mb-6">
        {participants.length} participantes · marcador en vivo
      </div>

      <section className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold mb-3">Crear participante</h2>
            <form onSubmit={create} className="space-y-3">
              <input className="input" placeholder="Alias" value={newAlias} onChange={(e) => setNewAlias(e.target.value)} />
              <input className="input" placeholder="Contraseña (opcional, se genera si vacía)" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
              <button disabled={busy} className="btn btn-primary w-full">Dar de alta</button>
            </form>
            {lastCreated && (
              <div className="mt-4 p-3 rounded-lg border border-[var(--border)] bg-[#0f151b]">
                <div className="text-xs text-[var(--muted)]">Credenciales actuales de <span className="mono">{lastCreated.alias}</span> (cópialas, no se vuelven a mostrar):</div>
                <div className="mt-2 flex items-center gap-2">
                  <code className="mono text-base px-2 py-1 bg-[#1a2129] rounded">{lastCreated.password}</code>
                  <button
                    className="btn"
                    onClick={() => navigator.clipboard.writeText(`${lastCreated.alias} / ${lastCreated.password}`)}
                  >Copiar</button>
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-3">Participantes</h2>
            {participants.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">Aún no hay participantes.</div>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {participants.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2 gap-2 flex-wrap">
                    <div className="mono text-sm">{p.alias}</div>
                    <div className="flex gap-2 flex-wrap">
                      <button className="btn" onClick={() => resetPassword(p.id, p.alias)}>Nueva contraseña</button>
                      <button className="btn" onClick={() => reset(p.id, p.alias)}>Reset</button>
                      <button className="btn" onClick={() => remove(p.id, p.alias)}>Eliminar</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="font-semibold">Marcador en vivo</h2>
              <span className="chip"><span className="pulse-dot"></span> live</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>#</th>
                  <th>Alias</th>
                  <th>Puntos</th>
                  <th>1ª</th>
                  <th>Tareas</th>
                  <th>Precisión</th>
                  <th>Tiempo</th>
                </tr>
              </thead>
              <tbody>
                {scoreboard.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-[var(--muted)] py-8">Esperando participantes…</td></tr>
                ) : scoreboard.map((r, i) => (
                  <tr key={r.id}>
                    <td className="pos">{i + 1}</td>
                    <td className="mono">{r.alias}</td>
                    <td><strong>{r.points}</strong></td>
                    <td>{r.firstTries}</td>
                    <td>{r.tasks}/8</td>
                    <td>{r.accuracy}%</td>
                    <td className="mono">{fmtDuration(r.durationSec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
     </div>
     <Footer />
    </main>
  );
}

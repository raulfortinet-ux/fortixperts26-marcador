"use client";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Footer } from "../brand";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn("credentials", { alias, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setErr("Alias o contraseña incorrectos");
      return;
    }
    const cb = params.get("callbackUrl") || "/";
    router.push(cb);
    router.refresh();
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="hero p-8 md:p-12 mb-8">
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <Image src="/fortinet-mark.png" alt="Fortinet" width={40} height={28} priority />
            <div className="text-sm uppercase tracking-widest font-semibold text-white/90">Fortinet</div>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <Image
                src="/xperts26-logo.png?v=2"
                alt="Fortinet Spain · XPERTS 26"
                width={340}
                height={120}
                priority
                unoptimized
                className="mb-4"
              />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Marcador <span className="text-[var(--accent)]">PHP2Shell</span>
              </h1>
              <p className="text-[var(--muted)] mt-1">
                Laboratorio del analista · ocho tareas, puntuación en vivo.
              </p>
            </div>
            <form onSubmit={submit} className="card p-6 w-full md:w-[360px] space-y-4">
              <div className="chev-divider" />
              <div>
                <label className="text-xs uppercase tracking-wider text-[var(--muted)]">Alias</label>
                <input autoFocus className="input mt-1" value={alias} onChange={(e) => setAlias(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[var(--muted)]">Contraseña</label>
                <input type="password" className="input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {err && <div className="text-sm text-[var(--danger)]">{err}</div>}
              <button disabled={loading} className="btn btn-primary w-full">
                {loading ? "Entrando…" : "Entrar al laboratorio"}
              </button>
              <div className="text-xs text-[var(--muted)] text-center">
                Tu organizador te ha dado el alias y la contraseña.
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

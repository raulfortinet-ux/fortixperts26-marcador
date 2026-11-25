import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function csvCell(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user || s.user.role !== "ADMIN") return new Response("forbidden", { status: 403 });

  const players = await prisma.user.findMany({
    where: { role: "PLAYER" },
    include: {
      attempts: { include: { question: { select: { taskId: true, order: true } } } },
      progress: true
    }
  });
  const totalQuestions = await prisma.question.count();

  const rows = players.map((p) => {
    const points = p.attempts.reduce((a, b) => a + b.pointsAwarded, 0);
    const solved = new Set(p.attempts.filter((a) => a.isCorrect).map((a) => a.questionId));
    const firstTries = p.attempts.filter((a) => a.isCorrect && a.pointsAwarded === 10).length;
    const wrong = p.attempts.filter((a) => !a.isCorrect).length;
    const accuracy = p.attempts.length ? Math.round((solved.size / p.attempts.length) * 100) : 0;
    const last = p.attempts.length
      ? p.attempts.reduce((m, a) => (a.createdAt > m ? a.createdAt : m), p.attempts[0].createdAt)
      : null;
    return {
      alias: p.alias,
      puntos: points,
      preguntas_resueltas: solved.size,
      total_preguntas: totalQuestions,
      aciertos_1a: firstTries,
      intentos_fallidos: wrong,
      tareas_completadas: p.progress.length,
      precision_pct: accuracy,
      ultima_actividad: last ? last.toISOString() : "",
      alta: p.createdAt.toISOString()
    };
  });
  rows.sort((a, b) => b.puntos - a.puntos || b.aciertos_1a - a.aciertos_1a || a.alias.localeCompare(b.alias));

  const header = [
    "posicion",
    "alias",
    "puntos",
    "preguntas_resueltas",
    "total_preguntas",
    "aciertos_1a",
    "intentos_fallidos",
    "tareas_completadas",
    "precision_pct",
    "ultima_actividad",
    "alta"
  ];
  const lines = [header.join(",")];
  rows.forEach((r, i) => {
    lines.push(
      [
        i + 1,
        r.alias,
        r.puntos,
        r.preguntas_resueltas,
        r.total_preguntas,
        r.aciertos_1a,
        r.intentos_fallidos,
        r.tareas_completadas,
        r.precision_pct,
        r.ultima_actividad,
        r.alta
      ]
        .map(csvCell)
        .join(",")
    );
  });

  const csv = "﻿" + lines.join("\n");
  const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="fortixperts26_marcador_${stamp}.csv"`
    }
  });
}

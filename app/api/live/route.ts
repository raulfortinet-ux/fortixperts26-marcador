import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [tasks, players, recent] = await Promise.all([
    prisma.task.findMany({
      orderBy: { id: "asc" },
      include: { questions: { select: { id: true, taskId: true } } }
    }),
    prisma.user.findMany({
      where: { role: "PLAYER" },
      select: {
        id: true,
        alias: true,
        attempts: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            questionId: true,
            isCorrect: true,
            pointsAwarded: true,
            attemptNumber: true,
            createdAt: true
          }
        },
        progress: { select: { taskId: true } }
      }
    }),
    prisma.attempt.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        createdAt: true,
        isCorrect: true,
        pointsAwarded: true,
        attemptNumber: true,
        user: { select: { alias: true } },
        question: { select: { taskId: true, order: true } }
      }
    })
  ]);

  const qToTask = new Map<number, number>();
  for (const t of tasks) for (const q of t.questions) qToTask.set(q.id, t.id);
  const taskIds = tasks.map((t) => t.id);

  const rows = players.map((p) => {
    const points = p.attempts.reduce((a, b) => a + b.pointsAwarded, 0);
    const solvedQ = new Set(p.attempts.filter((a) => a.isCorrect).map((a) => a.questionId));
    const tries = p.attempts.length;
    const firstTries = p.attempts.filter((a) => a.isCorrect && a.pointsAwarded === 10).length;
    const accuracy = tries ? Math.round((solvedQ.size / tries) * 100) : 0;
    const doneTasks = new Set(p.progress.map((pr) => pr.taskId));
    let activeTask: number | null = null;
    for (const tid of taskIds) {
      if (!doneTasks.has(tid)) { activeTask = tid; break; }
    }
    const taskStrip = taskIds.map((tid) => ({
      id: tid,
      done: doneTasks.has(tid),
      active: activeTask === tid
    }));
    const last = p.attempts[p.attempts.length - 1];
    const lastGain = last
      ? {
          points: last.pointsAwarded,
          isCorrect: last.isCorrect,
          taskId: qToTask.get(last.questionId) ?? null,
          attempt: last.attemptNumber,
          at: last.createdAt
        }
      : null;
    const finished = doneTasks.size === taskIds.length;
    const finishedAt = finished && last ? last.createdAt.getTime() : null;
    return {
      id: p.id,
      alias: p.alias,
      points,
      solved: solvedQ.size,
      firstTries,
      tasksDone: doneTasks.size,
      accuracy,
      activeTask,
      taskStrip,
      lastGain,
      finishedAt
    };
  });

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    // Both finished: who finished earlier wins
    if (a.finishedAt && b.finishedAt) return a.finishedAt - b.finishedAt;
    if (a.finishedAt) return -1;
    if (b.finishedAt) return 1;
    if (b.firstTries !== a.firstTries) return b.firstTries - a.firstTries;
    return a.alias.localeCompare(b.alias);
  });

  const events = recent.map((a) => ({
    id: a.id,
    at: a.createdAt,
    alias: a.user.alias,
    taskId: a.question.taskId,
    questionOrder: a.question.order,
    isCorrect: a.isCorrect,
    pointsAwarded: a.pointsAwarded,
    attemptNumber: a.attemptNumber
  }));

  // KPIs
  const totalPlayers = rows.length;
  const avgProgress = totalPlayers
    ? Math.round((rows.reduce((s, r) => s + r.tasksDone, 0) / (totalPlayers * taskIds.length)) * 100)
    : 0;
  const totalAttempts = rows.reduce((s, r) => s + (r.accuracy ? r.solved / (r.accuracy / 100) : 0), 0);
  const totalFirstTries = rows.reduce((s, r) => s + r.firstTries, 0);
  const totalSolved = rows.reduce((s, r) => s + r.solved, 0);
  const leader = rows[0] ?? null;
  const second = rows[1] ?? null;
  const leaderLead = leader && second ? leader.points - second.points : leader ? leader.points : 0;

  return NextResponse.json({
    rows,
    events,
    taskCount: taskIds.length,
    kpi: {
      players: totalPlayers,
      avgProgress,
      firstTries: totalFirstTries,
      solved: totalSolved,
      totalAttempts: Math.round(totalAttempts),
      leader: leader ? { alias: leader.alias, points: leader.points, lead: leaderLead } : null
    }
  });
}

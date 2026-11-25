import { prisma } from "./db";

export async function getScoreboard() {
  const players = await prisma.user.findMany({
    where: { role: "PLAYER" },
    select: {
      id: true,
      alias: true,
      attempts: {
        select: { pointsAwarded: true, isCorrect: true, questionId: true }
      },
      progress: { select: { taskId: true } }
    }
  });

  const rows = players.map((p) => {
    const points = p.attempts.reduce((a, b) => a + b.pointsAwarded, 0);
    const solved = new Set(p.attempts.filter((a) => a.isCorrect).map((a) => a.questionId)).size;
    const tries = p.attempts.length;
    const firstTries = p.attempts.filter((a) => a.isCorrect && a.pointsAwarded === 10).length;
    const accuracy = tries ? Math.round((solved / tries) * 100) : 0;
    return {
      id: p.id,
      alias: p.alias,
      points,
      solved,
      firstTries,
      tasks: p.progress.length,
      accuracy
    };
  });

  rows.sort((a, b) => b.points - a.points || b.firstTries - a.firstTries || a.alias.localeCompare(b.alias));
  return rows;
}

export async function getUserState(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      attempts: true,
      progress: true
    }
  });
  if (!user) return null;

  const tasks = await prisma.task.findMany({
    orderBy: { id: "asc" },
    include: { questions: { orderBy: { order: "asc" } } }
  });

  const completedTaskIds = new Set(user.progress.map((p) => p.taskId));
  const attemptsByQ = new Map<number, typeof user.attempts>();
  for (const a of user.attempts) {
    const arr = attemptsByQ.get(a.questionId) ?? [];
    arr.push(a);
    attemptsByQ.set(a.questionId, arr);
  }

  const taskStates = tasks.map((t, idx) => {
    const prevDone = idx === 0 || completedTaskIds.has(tasks[idx - 1].id);
    const unlocked = idx === 0 || prevDone;
    const done = completedTaskIds.has(t.id);
    const questions = t.questions.map((q) => {
      const atts = attemptsByQ.get(q.id) ?? [];
      const solved = atts.some((a) => a.isCorrect);
      const points = atts.reduce((s, a) => s + a.pointsAwarded, 0);
      return {
        id: q.id,
        prompt: q.prompt,
        options: JSON.parse(q.options) as { key: string; label: string }[],
        attempts: atts.length,
        solved,
        points,
        chosen: atts.map((a) => a.chosenKey),
        rationale: solved ? q.rationale : null,
        correctKey: solved ? q.correctKey : null
      };
    });
    return {
      id: t.id,
      title: t.title,
      moment: t.moment,
      severity: t.severity,
      summary: t.summary,
      unlocked,
      done,
      questions
    };
  });

  const totalPoints = user.attempts.reduce((s, a) => s + a.pointsAwarded, 0);
  const activeTask = taskStates.find((t) => t.unlocked && !t.done) || null;

  return {
    user: { id: user.id, alias: user.alias, role: user.role, points: totalPoints },
    tasks: taskStates,
    activeTaskId: activeTask?.id ?? null,
    allDone: taskStates.every((t) => t.done)
  };
}

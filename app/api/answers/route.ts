import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pointsFor } from "@/lib/scoring";
import { z } from "zod";

const Body = z.object({
  questionId: z.number().int(),
  chosenKey: z.string().min(1).max(4)
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "PLAYER") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const { questionId, chosenKey } = parsed.data;

  const q = await prisma.question.findUnique({ where: { id: questionId } });
  if (!q) return NextResponse.json({ error: "question not found" }, { status: 404 });

  // Check task unlocked for this user
  const previousTasks = await prisma.task.findMany({
    where: { id: { lt: q.taskId } },
    select: { id: true }
  });
  if (previousTasks.length) {
    const doneCount = await prisma.taskProgress.count({
      where: { userId: session.user.id, taskId: { in: previousTasks.map((t) => t.id) } }
    });
    if (doneCount < previousTasks.length) {
      return NextResponse.json({ error: "task locked" }, { status: 403 });
    }
  }

  const existing = await prisma.attempt.findMany({
    where: { userId: session.user.id, questionId },
    orderBy: { createdAt: "asc" }
  });
  if (existing.some((a) => a.isCorrect)) {
    return NextResponse.json({ error: "already solved" }, { status: 409 });
  }

  const attemptNumber = existing.length + 1;
  const isCorrect = chosenKey === q.correctKey;
  const pointsAwarded = isCorrect ? pointsFor(attemptNumber) : 0;

  await prisma.attempt.create({
    data: {
      userId: session.user.id,
      questionId,
      chosenKey,
      isCorrect,
      pointsAwarded,
      attemptNumber
    }
  });

  // If correct, check whether the full task is completed
  if (isCorrect) {
    const taskQuestions = await prisma.question.findMany({
      where: { taskId: q.taskId },
      select: { id: true }
    });
    const solvedQs = await prisma.attempt.findMany({
      where: {
        userId: session.user.id,
        isCorrect: true,
        questionId: { in: taskQuestions.map((x) => x.id) }
      },
      select: { questionId: true },
      distinct: ["questionId"]
    });
    if (solvedQs.length === taskQuestions.length) {
      await prisma.taskProgress.upsert({
        where: { userId_taskId: { userId: session.user.id, taskId: q.taskId } },
        update: {},
        create: { userId: session.user.id, taskId: q.taskId }
      });
    }
  }

  return NextResponse.json({
    isCorrect,
    pointsAwarded,
    attemptNumber,
    correctKey: isCorrect ? q.correctKey : null,
    rationale: isCorrect ? q.rationale : null
  });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const s = await getServerSession(authOptions);
  if (!s?.user || s.user.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await prisma.attempt.deleteMany({});
  await prisma.taskProgress.deleteMany({});
  return NextResponse.json({ ok: true });
}

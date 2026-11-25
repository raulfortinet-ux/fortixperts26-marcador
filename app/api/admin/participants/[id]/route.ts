import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  if (!s?.user || s.user.role !== "ADMIN") return null;
  return s;
}

function genPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await prisma.user.delete({ where: { id: params.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { action?: string; password?: string };
  const { action } = body;

  if (action === "reset") {
    await prisma.attempt.deleteMany({ where: { userId: params.id } });
    await prisma.taskProgress.deleteMany({ where: { userId: params.id } });
    return NextResponse.json({ ok: true });
  }

  if (action === "resetPassword") {
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user || user.role !== "PLAYER") {
      return NextResponse.json({ error: "no encontrado" }, { status: 404 });
    }
    const password = body.password && body.password.length >= 4 ? body.password : genPassword();
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: params.id }, data: { passwordHash } });
    return NextResponse.json({ ok: true, alias: user.alias, password });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  if (!s?.user || s.user.role !== "ADMIN") return null;
  return s;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const users = await prisma.user.findMany({
    where: { role: "PLAYER" },
    orderBy: { createdAt: "asc" },
    select: { id: true, alias: true, createdAt: true }
  });
  return NextResponse.json({ users });
}

const CreateBody = z.object({
  alias: z.string().trim().min(2).max(30),
  password: z.string().min(4).max(60).optional()
});

function genPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const parsed = CreateBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const alias = parsed.data.alias;
  const password = parsed.data.password && parsed.data.password.length >= 4 ? parsed.data.password : genPassword();
  const exists = await prisma.user.findUnique({ where: { alias } });
  if (exists) return NextResponse.json({ error: "alias ya existe" }, { status: 409 });
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { alias, passwordHash: hash, role: "PLAYER" },
    select: { id: true, alias: true }
  });
  return NextResponse.json({ user, password });
}

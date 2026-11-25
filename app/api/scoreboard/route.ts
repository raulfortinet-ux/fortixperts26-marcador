import { NextResponse } from "next/server";
import { getScoreboard } from "@/lib/state";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await getScoreboard();
  return NextResponse.json({ rows });
}

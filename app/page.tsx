import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const s = await getServerSession(authOptions);
  if (!s?.user) redirect("/login");
  if (s.user.role === "ADMIN") redirect("/admin");
  redirect("/board");
}

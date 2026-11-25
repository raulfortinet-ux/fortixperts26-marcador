import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TASKS } from "../lib/questions-data";

const prisma = new PrismaClient();

async function main() {
  const adminAlias = process.env.ADMIN_ALIAS || "admin";
  const adminPwd = process.env.ADMIN_PASSWORD || "admin123";

  const hash = await bcrypt.hash(adminPwd, 10);
  await prisma.user.upsert({
    where: { alias: adminAlias },
    update: { passwordHash: hash, role: "ADMIN" },
    create: { alias: adminAlias, passwordHash: hash, role: "ADMIN" }
  });
  console.log(`✓ Admin listo: ${adminAlias} / ${adminPwd}`);

  for (const t of TASKS) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: { title: t.title, moment: t.moment, severity: t.severity, summary: t.summary },
      create: { id: t.id, title: t.title, moment: t.moment, severity: t.severity, summary: t.summary }
    });
  }

  // Replace questions (idempotent)
  await prisma.question.deleteMany({});
  let order = 0;
  for (const t of TASKS) {
    order = 0;
    for (const q of t.questions) {
      order += 1;
      await prisma.question.create({
        data: {
          taskId: t.id,
          order,
          prompt: q.prompt,
          options: JSON.stringify(q.options),
          correctKey: q.correctKey,
          rationale: q.rationale
        }
      });
    }
  }
  const count = await prisma.question.count();
  console.log(`✓ ${TASKS.length} tareas y ${count} preguntas cargadas`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

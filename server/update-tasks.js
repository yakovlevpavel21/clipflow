// server/update-tasks.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function update() {
  console.log('Начинаю обновление приоритетов...');
  const tasks = await prisma.task.findMany();

  for (const t of tasks) {
    let p = 20;
    if (t.needsFixing) p = 10;
    else if (t.status === 'AWAITING_REACTION') p = 20;
    else if (t.status === 'IN_PROGRESS') p = 30;
    else if (t.status === 'REACTION_UPLOADED') p = 40;
    else if (t.status === 'PUBLISHED') p = 50;

    await prisma.task.update({
      where: { id: t.id },
      data: { sortPriority: p }
    });
  }
  console.log('Готово! Все задачи обновлены.');
}

update().catch(console.error).finally(() => prisma.$disconnect());
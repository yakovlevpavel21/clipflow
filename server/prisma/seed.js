const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Удаляем старые данные (опционально, если хочешь полную очистку)
  // await prisma.task.deleteMany();
  // await prisma.channel.deleteMany();

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: 'admin', // Дефолтный пароль
      role: 'ADMIN'
    },
    create: {
      username: 'admin',
      password: 'admin',
      role: 'ADMIN'
    }
  });

  console.log('✅ База данных инициализирована!');
  console.log('Данные для входа: admin / admin');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
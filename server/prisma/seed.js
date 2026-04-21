const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin', 10);
  
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword, // Теперь тут хеш
      role: 'ADMIN',
    },
  });
  console.log('Seed completed: Admin created');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
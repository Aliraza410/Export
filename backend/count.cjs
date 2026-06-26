const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
  console.log("USER COUNT:", count);
  console.log(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.document.findMany().then(docs => console.log("DOCS:", docs)).catch(console.error).finally(() => prisma.$disconnect());

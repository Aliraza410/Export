import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@fyp.com' } });
  const allExports = await prisma.exportRequest.findMany({ where: { userId: admin.id } });
  const activeExportsCount = await prisma.exportRequest.count({ where: { userId: admin.id, status: { in: ["Active", "Pending"] } } });
  
  console.log("Admin Exports Count:", activeExportsCount);
  console.log("Admin All Exports:");
  allExports.forEach(e => console.log(`- ID: ${e.id}, Status: "${e.status}"`));
  
  const activeExportDetails = allExports.find(exp => exp.status === "Active" || exp.status === "Pending") || null;
  console.log("Found detail:", activeExportDetails ? activeExportDetails.id : null);
}

test()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

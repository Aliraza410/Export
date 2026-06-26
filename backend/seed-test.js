import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@fyp.com' } });
  if (!admin) return console.log("Admin not found");

  await prisma.exportRequest.create({
    data: {
      userId: admin.id,
      product: "Rice",
      destination: "UAE",
      qty: 1000,
      totalCost: 150000,
      status: "Active"
    }
  });
  
  await prisma.registrationProgress.create({
    data: {
      userId: admin.id,
      type: "guidance",
      steps: {
        "Company Registration": true,
        "NTN & STRN Registration": true,
        "PSW Registration": true
      }
    }
  });
  console.log("Seeded data for admin.");
}

seed()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

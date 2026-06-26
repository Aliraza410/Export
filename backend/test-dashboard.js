import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  // get any user
  const user = await prisma.user.findFirst();
  if (!user) return console.log("No users found");

  const userId = user.id;
  console.log(`Testing with user ${user.email}`);

  try {
    const [activeExports, documentsReady, allExports, recentDocs, progress] = await Promise.all([
      prisma.exportRequest.count({ where: { userId, status: { in: ["Active", "Pending"] } } }),
      prisma.document.count({ where: { userId, status: { in: ["Ready", "Completed", "Done"] } } }),
      prisma.exportRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.document.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 4 }),
      prisma.registrationProgress.findUnique({ where: { userId_type: { userId, type: 'guidance' } } })
    ]);
    const activeExportDetails = allExports.find(exp => exp.status === "Active" || exp.status === "Pending") || null;
    const uniqueCountries = [...new Set(allExports.map(exp => exp.destination).filter(Boolean))];
    const countriesReached = uniqueCountries.length;
    const exportValue = allExports.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const pendingDocs = await prisma.document.count({ where: { userId, status: "Pending" } });

    console.log("JSON RESPONSE:");
    console.log(JSON.stringify({
      activeExports,
      documentsReady,
      pendingDocs,
      exportValue: `PKR ${exportValue.toLocaleString()}`,
      countriesReached,
      uniqueCountriesPreview: uniqueCountries.slice(0, 3).join(', '),
      recentDocs,
      progress: progress ? progress.steps : {},
      activeExportDetails
    }, null, 2));
  } catch (err) {
    console.error("Error running query:", err);
  }
}

test()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

import { PrismaClient } from '@prisma/client';
import { seedOperationalData } from './operational-seed.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🔒 Initiating safe reset for designated demo tenant...');

  const demoTenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { code: 'demo-school' },
        { slug: 'demo-school' },
        { name: { contains: 'Demo', mode: 'insensitive' } },
      ],
    },
  });

  if (!demoTenant) {
    throw new Error('No designated demo tenant found in database. Aborting reset to prevent touching production data.');
  }

  console.log(`Found demo tenant: "${demoTenant.name}" (ID: ${demoTenant.id}, Code: ${demoTenant.code})`);
  await seedOperationalData(prisma, demoTenant.id);
  console.log('✅ Demo tenant operational data reset successfully.');
}

main()
  .catch((err) => {
    console.error('❌ Demo reset failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

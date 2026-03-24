import { prisma } from '@/lib/prisma';

async function clearMockData() {
  console.log('🗑 Clearing WorkLogs...');
  await prisma.workLog.deleteMany();
  console.log('✅ WorkLogs cleared.');
}

clearMockData()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

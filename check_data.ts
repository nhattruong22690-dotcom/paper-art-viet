import { prisma } from '@/lib/prisma';

async function checkPartners() {
  const partners = await prisma.partner.findMany();
  console.log('Partners:', JSON.stringify(partners, null, 2));
  
  const workLogs = await prisma.workLog.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log('Recent WorkLogs:', JSON.stringify(workLogs, null, 2));
}

checkPartners()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

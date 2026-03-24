import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCodes() {
  console.log('--- Direct Prisma Query ---');
  const customers = await prisma.customer.findMany({
    take: 5,
    select: {
      id: true,
      name: true,
      customerCode: true,
    }
  });
  console.log('Prisma Output:', customers);

  console.log('\n--- Raw SQL Query ---');
  const rawQuery = await prisma.$queryRaw`SELECT id, name, customer_code FROM customers LIMIT 5`;
  console.log('Raw Output:', rawQuery);

  await prisma.$disconnect();
}

checkCodes().catch(console.error);

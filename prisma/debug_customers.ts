import { prisma } from '../src/lib/prisma';

async function check() {
  try {
    // 1. Check raw data from Prisma
    const customersPrisma = await prisma.customer.findMany({ take: 5 });
    console.log('--- Prisma Objects (First 5) ---');
    console.log(JSON.stringify(customersPrisma, null, 2));

    // 2. Check Raw SQL to see actual column names and values
    const rawData = await prisma.$queryRaw`SELECT * FROM customers LIMIT 5`;
    console.log('\n--- Raw SQL Results (First 5) ---');
    console.log(JSON.stringify(rawData, null, 2));

  } catch (error) {
    console.error('Error during check:', error);
  } finally {
    process.exit(0);
  }
}

check();

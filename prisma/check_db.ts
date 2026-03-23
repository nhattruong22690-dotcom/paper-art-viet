import { prisma } from '../src/lib/prisma';

async function check() {
  const customers = await prisma.customer.findMany({ take: 5 });
  console.log('--- DB Entry Sample ---');
  console.log(JSON.stringify(customers, null, 2));
  process.exit(0);
}

check();

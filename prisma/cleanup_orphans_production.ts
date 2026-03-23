import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking for orphaned Production Orders ---');
  
  const orphans = await prisma.productionOrder.findMany({
    where: { orderId: null } as any
  });

  console.log(`Found ${orphans.length} orphaned production orders.`);

  if (orphans.length > 0) {
    const deleted = await prisma.productionOrder.deleteMany({
      where: { orderId: null } as any
    });
    console.log(`Deleted ${deleted.count} orphaned production orders.`);
  }

  console.log('--- Done ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

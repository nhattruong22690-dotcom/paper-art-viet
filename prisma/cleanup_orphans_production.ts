import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking for orphaned Production Orders ---');
  
  const orphans = await prisma.productionOrder.findMany({
    where: { orderId: null }
  });

  console.log(`Found ${orphans.length} orphaned production orders.`);

  if (orphans.length > 0) {
    // Option: Create a dummy order or delete them.
    // Given this is a new system, deleting them is safer to enforce the new rule.
    const deleted = await prisma.productionOrder.deleteMany({
      where: { orderId: null }
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

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const keys = Object.keys(prisma);
  console.log("Prisma keys:", keys.filter(k => !k.startsWith('$')));
}

main().catch(console.error).finally(() => prisma.$disconnect());

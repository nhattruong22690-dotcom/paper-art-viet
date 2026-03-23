import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // @ts-ignore
  const dmmf = prisma._dmmf;
  const orderItemModel = dmmf.modelMap.OrderItem;
  console.log("OrderItem Fields:", orderItemModel.fields.map((f: any) => f.name));
}

main().catch(console.error).finally(() => prisma.$disconnect());

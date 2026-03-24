import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Kiểm tra xem cột đã tồn tại chưa
    // 2. Thêm cột unit_price GENERATED
    await prisma.$executeRawUnsafe(`
      ALTER TABLE materials 
      DROP COLUMN IF EXISTS unit_price;
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE materials 
      ADD COLUMN unit_price DECIMAL GENERATED ALWAYS AS (purchase_price / NULLIF(purchase_quantity, 0)) STORED;
    `);
    
    console.log('Successfully added unit_price generated column.');
  } catch (err) {
    console.error('Error applying custom migration:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL
});

async function main() {
  try {
    console.log('--- Applying Custom Migration ---');
    
    // Check if column exists
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'unit_price') THEN
          ALTER TABLE materials DROP COLUMN unit_price;
        END IF;
      END
      $$;
    `);
    
    // Add column unit_price GENERATED
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

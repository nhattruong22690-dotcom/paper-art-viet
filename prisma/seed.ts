import { prisma } from '../src/lib/prisma';

const customers = [
  { customerCode: 'GS', name: 'Gift Shop Oakland', phone: '+1 510 123 4567', address: 'Oakland, CA, USA' },
  { customerCode: 'AMZ', name: 'Amazon US Distribution', phone: '+1 800 AMZ 999', address: 'Seattle, WA, USA' },
  { customerCode: 'LS', name: 'Liberty Stationery', phone: '+44 20 7123 4567', address: 'London, UK' },
  { customerCode: 'PAV', name: 'Paper Art Việt HQ', phone: '+84 28 3715 0000', address: 'Ho Chi Minh City, VN' },
];

async function main() {
  console.log('🔄 Starting seed...');
  for (const c of customers) {
    const customer = await prisma.customer.upsert({
      where: { customerCode: c.customerCode || '' }, // Ensure unique constraint match
      update: c,
      create: c,
    });
    console.log(`✅ Created/Updated customer: ${customer.name} (${customer.customerCode})`);
  }
  console.log('🏁 Seed finished.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

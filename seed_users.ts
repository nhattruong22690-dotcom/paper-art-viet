import { prisma } from '@/lib/prisma';

async function seedUsers() {
  console.log('🌱 Seeding Users...');
  const users = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Nguyễn Văn A', role: 'worker' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Trần Thị B', role: 'worker' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Lê Văn C', role: 'worker' },
    { id: '44444444-4444-4444-4444-444444444444', name: 'Phạm Thị D', role: 'worker' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: u,
      create: u,
    });
  }
  console.log('✅ Users seeded.');
}

seedUsers()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

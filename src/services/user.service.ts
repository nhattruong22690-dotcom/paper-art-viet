'use server';

import { prisma } from '@/lib/prisma';

/**
 * Lấy danh sách nhân viên xưởng (workers).
 */
export async function getWorkers() {
  const users = await prisma.user.findMany({
    where: { 
      role: 'worker',
      active: true
    },
    orderBy: { name: 'asc' }
  });
  
  return JSON.parse(JSON.stringify(users)) as any[];
}

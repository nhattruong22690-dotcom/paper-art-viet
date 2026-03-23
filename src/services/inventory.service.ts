'use server';

import { prisma } from '@/lib/prisma';

export async function getInventoryStatus() {
  const inventory = await prisma.inventoryLocation.findMany({
    include: {
      partner: true, // Lấy thông tin đối tác nếu đang gia công ngoài
    },
    orderBy: { lastUpdated: 'desc' },
  });

  // Map lại kết quả để UI hiển thị dễ dàng
  return inventory.map((item) => {
    // Nếu có mã currentLocationId, tức là đang ở xưởng ngoài
    const isOutsourced = !!item.currentLocationId;
    return {
      ...item,
      locationStatus: isOutsourced 
        ? `Gia công ngoài (Xưởng: ${item.partner?.name || 'Không xác định'})` 
        : 'Kho nội bộ',
    };
  });
}

/**
 * Gửi vật tư đi gia công ngoài
 */
export async function sendToOutsource(itemId: string, partnerId: string) {
  return await prisma.inventoryLocation.update({
    where: { id: itemId },
    data: {
      currentLocationId: partnerId,
      lastUpdated: new Date(),
    },
  });
}

/**
 * Hoàn thành gia công, chuyển hàng về kho nội bộ
 */
export async function completeOutsource(itemId: string) {
  return await prisma.inventoryLocation.update({
    where: { id: itemId },
    data: {
      currentLocationId: null, // Về kho nội bộ
      isReadyForAssembly: true, // Sẵn sàng lắp ráp
      lastUpdated: new Date(),
    },
  });
}

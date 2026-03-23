'use server';

import { prisma } from '@/lib/prisma';

/**
 * Sinh mã thùng theo định dạng: XINH-YYYYMMDD-00X
 */
export async function generatePackageCode() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].split('-').join(''); // 20260322
  const prefix = `XINH-${dateStr}`;

  // Đếm xem trong hôm nay đã có bao nhiêu thùng được tạo với prefix này
  const countToday = await prisma.package.count({
    where: {
      packageCode: {
        startsWith: prefix,
      },
    },
  });

  const nextIndex = (countToday + 1).toString().padStart(3, '0');
  return `${prefix}-${nextIndex}`;
}

/**
 * Tạo một Thùng hàng (Package) từ các sản phẩm đã hoàn thành trong Sản xuất
 */
export async function createPackageFromProduction(
  orderId: string, 
  items: { productionOrderId: string; productId: string; quantity: number }[]
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Sinh mã thùng mới
    const packageCode = await generatePackageCode();

    // 2. Tạo record Package
    const newPackage = await tx.package.create({
      data: {
        orderId,
        packageCode,
        status: 'packing',
      },
    });

    // 3. Tạo Packing List Details và Cập nhật Production Orders
    for (const item of items) {
      // Lưu chi tiết đóng gói
      await tx.packingListDetail.create({
        data: {
          packageId: newPackage.id,
          productId: item.productId,
          quantity: item.quantity,
        },
      });

      // Cập nhật trạng thái sản xuất (Ví dụ: Trừ bớt số lượng chờ đóng gói nếu có logic đó)
      // Ở đây ta giả định việc đóng gói hoàn tất một phần công việc
    }

    return await tx.package.findUnique({
      where: { id: newPackage.id },
      include: {
        packingListDetails: {
          include: { product: true },
        },
        order: {
          include: { customer: true },
        },
      },
    });
  });
}

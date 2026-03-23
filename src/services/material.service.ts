'use server';

import { prisma } from '@/lib/prisma';
import { Material, MaterialTransaction, Prisma } from '@prisma/client';

/**
 * Lấy danh sách vật tư kèm tìm kiếm và lọc.
 */
export async function getMaterials(params: {
  search?: string;
  type?: string;
}) {
  const { search, type } = params;
  const where: Prisma.MaterialWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (type) {
    where.type = type;
  }

  const result = await prisma.material.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  // Convert to numbers and apply smart price logic for all consumers
  const mapped = result.map(m => {
    const minStock = Number(m.minStock || 0);
    const stockQuantity = Number(m.stockQuantity || 0);
    let refPrice = Number(m.referencePrice || 0);
    const purchasePrice = Number(m.purchasePrice || 0);
    const purchaseQuantity = Number(m.purchaseQuantity || 0);
    const unitPrice = Number(m.unitPrice || 0);

    // Fallback: Nếu referencePrice = 0, thử tính từ purchasePrice/purchaseQuantity
    if (refPrice === 0 && purchasePrice > 0 && purchaseQuantity > 0) {
      refPrice = purchasePrice / purchaseQuantity;
    }

    return {
      ...m,
      minStock,
      stockQuantity,
      referencePrice: refPrice,
      purchasePrice: m.purchasePrice ? purchasePrice : null,
      purchaseQuantity: m.purchaseQuantity ? purchaseQuantity : null,
      unitPrice: m.unitPrice ? unitPrice : null
    };
  });

  return JSON.parse(JSON.stringify(mapped)) as any;
}

/**
 * Thêm hoặc cập nhật thông tin vật tư.
 */
export async function upsertMaterial(data: Partial<Material>) {
  let result;
  if (data.id) {
    result = await prisma.material.update({
      where: { id: data.id },
      data,
    });
  } else {
    result = await prisma.material.create({
      data: data as Prisma.MaterialCreateInput,
    });
  }
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

/**
 * Lấy thống kê tồn kho (Cards).
 */
export async function getInventoryStats() {
  const materials = await prisma.material.findMany();
  
  const totalTypes = materials.length;
  const lowStockCount = materials.filter(m => Number(m.stockQuantity) < Number(m.minStock)).length;
  const totalValue = materials.reduce((acc, m) => acc + (Number(m.stockQuantity) * Number(m.referencePrice)), 0);

  return {
    totalTypes,
    lowStockCount,
    totalValue,
  };
}

/**
 * Xử lý nhập kho vật tư hàng loạt theo Lô (Batch).
 */
export async function createMaterialBatchInward(data: {
  partnerId: string;
  items: {
    materialId: string;
    sku: string;
    quantity: number; // Tổng số lượng đơn vị
    price: number; // Đơn giá mỗi đơn vị (giá thực tế)
    location?: string;
    note?: string;
    poItemId?: string; // Liên kết tới PO Item nếu có
  }[];
}) {
  const result = await prisma.$transaction(async (tx) => {
    const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const transactions = [];

    for (const item of data.items) {
      // 1. Tạo Mã Lô: [SKU]-[YYYYMMDD]-[STT]
      // Lấy số thứ tự lô trong ngày của vật tư này
      const batchCount = await tx.materialBatch.count({
        where: {
          materialId: item.materialId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          }
        }
      });
      const stt = (batchCount + 1).toString().padStart(3, '0');
      const batchCode = `${item.sku}-${todayStr}-${stt}`;

      // 2. Liên kết tới PO Item nếu có
      if (item.poItemId) {
        // Cập nhật số lượng đã nhận trong PO Item
        const poItem = await tx.purchaseOrderItem.update({
          where: { id: item.poItemId },
          data: {
            quantityReceived: {
              increment: item.quantity
            }
          },
          include: {
            purchaseOrder: {
              include: {
                items: true
              }
            }
          }
        });

        // Kiểm tra trạng thái toàn bộ PO
        const allItems = poItem.purchaseOrder.items;
        const totalOrdered = allItems.reduce((acc: number, i: any) => acc + Number(i.quantityOrdered), 0);
        const totalReceived = allItems.reduce((acc: number, i: any) => acc + Number(i.quantityReceived), 0);

        let newStatus = 'partially_received';
        if (totalReceived >= totalOrdered) {
          newStatus = 'completed';
        }

        await tx.purchaseOrder.update({
          where: { id: poItem.purchaseOrderId },
          data: { status: newStatus }
        });
      }

      // 3. Tạo lô hàng (MaterialBatch)
      const batch = await tx.materialBatch.create({
        data: {
          batchCode,
          materialId: item.materialId,
          purchasePrice: item.price,
          initialQuantity: item.quantity,
          remainQuantity: item.quantity,
          location: item.location,
          sourcePoItemId: item.poItemId, // Trace back to PO
        }
      });

      // 4. Tạo bản ghi Transaction
      const trans = await tx.materialTransaction.create({
        data: {
          materialId: item.materialId,
          partnerId: data.partnerId,
          batchId: batch.id,
          type: 'inward',
          quantity: item.quantity,
          price: item.price,
          note: item.note || `Nhập lô mới: ${batchCode}`,
        },
      });
      transactions.push(trans);

      // 4. Cập nhật tồn kho tổng của Material
      await tx.material.update({
        where: { id: item.materialId },
        data: {
          stockQuantity: { increment: item.quantity },
          referencePrice: item.price
        },
      });
    }

    return transactions;
  });
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

/**
 * Lấy danh sách lô hàng còn tồn của 1 vật tư (FIFO).
 */
export async function getMaterialBatches(materialId: string) {
  const result = await prisma.materialBatch.findMany({
    where: { 
      materialId,
      remainQuantity: { gt: 0 }
    },
    orderBy: { createdAt: 'asc' }, // FIFO
  });
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

/**
 * Lấy lịch sử giao dịch của 1 vật tư.
 */
export async function getMaterialHistory(materialId: string) {
  const result = await prisma.materialTransaction.findMany({
    where: { materialId },
    include: { partner: true },
    orderBy: { createdAt: 'desc' },
  });
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

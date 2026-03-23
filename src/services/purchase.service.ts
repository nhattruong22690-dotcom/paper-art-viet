'use server';

import { prisma } from '@/lib/prisma';
import { PurchaseOrder, PurchaseOrderItem, Prisma } from '@prisma/client';

/**
 * Lấy danh sách Đơn mua hàng (PO).
 */
export async function getPurchaseOrders(params: {
  search?: string;
  status?: string;
  supplierId?: string;
}) {
  const { search, status, supplierId } = params;
  const where: Prisma.PurchaseOrderWhereInput = {};

  if (search) {
    where.poNumber = { contains: search, mode: 'insensitive' };
  }

  if (status) {
    where.status = status;
  }

  if (supplierId) {
    where.supplierId = supplierId;
  }

  const result = await prisma.purchaseOrder.findMany({
    where,
    include: {
      supplier: true,
      _count: {
        select: { items: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  return JSON.parse(JSON.stringify(result)) as typeof result;
}

/**
 * Lấy chi tiết một PO kèm danh sách sản phẩm.
 */
export async function getPOWithItems(id: string) {
  const result = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: {
          material: true
        }
      }
    }
  });

  if (!result) return null;
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

/**
 * Tạo mới Đơn mua hàng (Thường ở trạng thái 'draft').
 */
export async function createPurchaseOrder(data: {
  supplierId: string;
  expectedDeliveryDate?: string;
  notes?: string;
  items: {
    materialId: string;
    quantityOrdered: number;
    expectedPrice: number;
  }[];
}) {
  // Sinh số PO tự động: PO-YYYYMMDD-XXXX
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const count = await prisma.purchaseOrder.count({
    where: {
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });
  const poNumber = `PO-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

  const totalAmount = data.items.reduce((acc, item) => 
    acc + (item.quantityOrdered * item.expectedPrice), 0);

  const result = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: data.supplierId,
      expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
      notes: data.notes,
      totalAmount,
      status: 'draft',
      items: {
        create: data.items.map(item => ({
          materialId: item.materialId,
          quantityOrdered: item.quantityOrdered,
          expectedPrice: item.expectedPrice,
          totalExpected: item.quantityOrdered * item.expectedPrice
        }))
      }
    },
    include: {
      items: true
    }
  });

  return JSON.parse(JSON.stringify(result)) as typeof result;
}

/**
 * Cập nhật trạng thái Đơn mua hàng.
 */
export async function updatePOStatus(id: string, status: string) {
  const result = await prisma.purchaseOrder.update({
    where: { id },
    data: { status }
  });
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

/**
 * Lấy danh sách Nhà cung cấp (Partners where isSupplier = true).
 */
export async function getSuppliers() {
  const result = await prisma.partner.findMany({
    where: { isSupplier: true },
    orderBy: { name: 'asc' }
  });
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

/**
 * Cập nhật một Partner thành Nhà cung cấp.
 */
export async function setAsSupplier(id: string, category?: string) {
  const result = await prisma.partner.update({
    where: { id },
    data: { 
      isSupplier: true,
      partnerCategory: category 
    }
  });
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

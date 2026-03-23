'use server';

import { prisma } from '@/lib/prisma';

export async function getFinishedProductionItems() {
  const items = await prisma.productionOrder.findMany({
    where: {
      quantityCompleted: { gt: 0 },
      // currentStatus: 'completed' // Optionally filter by status
    },
    include: {
      product: true,
      order: {
        include: {
          customer: true
        }
      }
    }
  });

  return items.map(po => ({
    id: po.id,
    productName: po.product?.name || 'Sản phẩm',
    sku: po.product?.sku || 'N/A',
    quantityCompleted: po.quantityCompleted || 0,
    quantityPacked: 0, // In a real app, we'd sum up PackingListDetail for this PO
    customerName: po.order?.customer?.name || 'Khách lẻ'
  }));
}

export async function createPackage(data: {
  orderId?: string;
  items: { productId: string; quantity: number }[];
}) {
  const packageCode = `XINH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  return await prisma.package.create({
    data: {
      packageCode,
      orderId: data.orderId,
      status: 'packing',
      packingListDetails: {
        create: data.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      }
    },
    include: {
      packingListDetails: {
        include: {
          product: true
        }
      },
      order: {
        include: {
          customer: true
        }
      }
    }
  });
}

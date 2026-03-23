'use server';

import { prisma } from '@/lib/prisma';

export async function getDashboardStats() {
  const [
    orderCount,
    totalRevenueResult,
    completedPO,
    lowStockMaterials
  ] = await Promise.all([
    // 1. Đơn hàng mới (trong 30 ngày qua)
    prisma.order.count({
      where: {
        orderDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    // 2. Lợi nhuận gộp dự tính (Tổng doanh thu - Tổng COGS của tất cả đơn hàng)
    prisma.orderItem.aggregate({
      _sum: {
        price: true,
        cogsAtOrder: true,
      }
    }),
    // 3. Lệnh sản xuất đã hoàn thành
    prisma.productionOrder.count({
      where: { currentStatus: 'completed' }
    }),
    // 4. Cảnh báo chậm (Lệnh sản xuất quá hạn)
    prisma.productionOrder.count({
      where: {
        currentStatus: { not: 'completed' },
        deadlineProduction: { lt: new Date() }
      }
    })
  ]);

  const totalRevenue = Number(totalRevenueResult._sum.price || 0);
  const totalCOGS = Number(totalRevenueResult._sum.cogsAtOrder || 0);

  return {
    newOrders: orderCount,
    grossProfit: totalRevenue - totalCOGS,
    completedTasks: completedPO,
    overdueAlerts: lowStockMaterials
  };
}

export async function getRecentProductionProgress() {
  const recentPOs = await prisma.productionOrder.findMany({
    take: 5,
    include: {
      product: true,
    },
    orderBy: { deadlineProduction: 'desc' }
  });

  return recentPOs.map(po => ({
    sku: po.product?.sku || 'N/A',
    title: po.product?.name || 'Sản phẩm mới',
    progress: po.currentStatus === 'completed' ? 100 : po.currentStatus === 'in_progress' ? 50 : 0,
    status: po.currentStatus || 'pending'
  }));
}

export async function getUpcomingDeliveries() {
  const upcomingOrders = await prisma.order.findMany({
    take: 5,
    where: {
      status: { not: 'completed' }
    },
    include: {
      customer: true,
      orderItems: true
    },
    orderBy: { deadlineDelivery: 'asc' }
  });

  return upcomingOrders.map(order => ({
    id: order.id.slice(-8).toUpperCase(),
    customer: order.customer?.name || 'Khách lẻ',
    items: `${order.orderItems.reduce((acc, i) => acc + (i.quantity || 0), 0)} pcs`,
    date: order.deadlineDelivery ? new Date(order.deadlineDelivery).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : 'N/A'
  }));
}

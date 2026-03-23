'use server';

import { prisma } from '@/lib/prisma';

export async function getProductionOrdersWithDeadline() {
  const productionOrders = await prisma.productionOrder.findMany({
    include: {
      product: true,
      order: true,
    },
    orderBy: { deadlineProduction: 'asc' }, // Xếp deadline sắp tới lên trước
  });

  const now = new Date();

  // Map trả về kèm UI Computed Status để cảnh báo Deadline
  return productionOrders.map((po) => {
    // Logic: Nếu ngày hôm nay hoặc ngay lúc query > deadlineProduction
    const isOverdue = po.deadlineProduction ? now > po.deadlineProduction : false;
    
    return {
      ...po,
      isOverdue, // UI Computed Status trả lại Frontend
      deadlineStatus: isOverdue ? 'Quá hạn' : 'Đúng tiến độ',
    };
  });
}

export async function getWorkLogs(params: { date?: string; skip?: number; take?: number }) {
  const { date, skip = 0, take = 20 } = params;
  
  const where: any = {};
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    where.createdAt = {
      gte: startOfDay,
      lte: endOfDay
    };
  }

  return await prisma.workLog.findMany({
    where,
    skip,
    take,
    include: {
      productionOrder: {
        include: {
          product: true
        }
      },
      user: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getWorkerPerformance() {
  const users = await prisma.user.findMany({
    where: { role: 'worker', active: true },
    include: {
      workLogs: {
        include: {
          productionOrder: true
        }
      }
    }
  });

  return users.map(user => {
    const totalQty = user.workLogs.reduce((sum, log) => sum + (log.quantityProduced || 0), 0);
    const techErrors = user.workLogs.reduce((sum, log) => sum + (log.technicalErrorCount || 0), 0);
    const matErrors = user.workLogs.reduce((sum, log) => sum + (log.materialErrorCount || 0), 0);
    
    // Simple KPI: (Produced - TechErrors) / Total (if any produced)
    const kpi = totalQty > 0 ? Math.round(((totalQty - techErrors) / totalQty) * 100) : 0;

    return {
      id: user.id.slice(-6).toUpperCase(),
      name: user.name,
      group: 'Tổ Sản Xuất',
      totalQty,
      kpi,
      techErrors,
      matErrors,
      trend: [80, 85, 82, 88, 90, 87, 89]
    };
  });
}
export async function updateProductionOrder(id: string, data: any) {
  const currentPO = await prisma.productionOrder.findUnique({
    where: { id },
    include: { workLogs: true }
  });

  if (!currentPO) throw new Error("Production Order not found");

  // Ràng buộc: Không cho phép đổi orderId nếu đã có Work Log
  if (data.orderId && data.orderId !== currentPO.orderId) {
    if (currentPO.workLogs.length > 0) {
      throw new Error("Không thể thay đổi Đơn hàng liên kết khi lệnh sản xuất đã bắt đầu có ghi chép sản lượng (Work Log).");
    }
  }

  return await prisma.productionOrder.update({
    where: { id },
    data
  });
}

/**
 * Chia nhỏ Lệnh sản xuất cho một sản phẩm trong đơn hàng.
 * @param orderId ID Đơn hàng tổng
 * @param productId ID Sản phẩm cụ thể
 * @param allocations Danh sách phân bổ { assignedTo, type, quantity }
 */
export async function splitProductionOrders(
  orderId: string, 
  productId: string, 
  allocations: { assignedTo: string; type: 'internal' | 'outsourced'; quantity: number }[]
) {
  // 1. Kiểm tra xem có lệnh nào của sản phẩm này đã có Work Log chưa
  const existingPOs = await prisma.productionOrder.findMany({
    where: { orderId, productId },
    include: { workLogs: true }
  });

  const hasLogs = existingPOs.some(po => po.workLogs.length > 0);
  if (hasLogs) {
    throw new Error("Không thể chia lại lệnh sản xuất khi đã có ghi chép sản lượng (Work Log).");
  }

  // 2. Thực hiện xóa và tạo mới trong Transaction
  return await prisma.$transaction(async (tx) => {
    // Tìm deadline của đơn hàng để kế thừa (optional)
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { deadlineDelivery: true }
    });

    // Xóa các lệnh cũ của sản phẩm này trong đơn này
    await tx.productionOrder.deleteMany({
      where: { orderId, productId }
    });

    // Tạo các lệnh mới dựa trên phân bổ
    const created = await Promise.all(allocations.map(alloc => 
      tx.productionOrder.create({
        data: {
          orderId,
          productId,
          quantityTarget: alloc.quantity,
          quantityCompleted: 0,
          allocationType: alloc.type,
          assignedTo: alloc.assignedTo,
          // Legacy field backup
          outsourcedName: alloc.type === 'outsourced' ? alloc.assignedTo : null,
          currentStatus: alloc.type === 'internal' ? 'pending' : 'outsourced',
          deadlineProduction: order?.deadlineDelivery || new Date()
        } as any
      })
    ));

    return created;
  });
}

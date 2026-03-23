'use server';

import { prisma } from '@/lib/prisma';

/**
 * Bắt đầu một phiên làm việc mới cho công nhân.
 */
export async function startWorkSession(data: {
  productionOrderId: string;
  userId: string;
  staffName?: string;
}) {
  return await prisma.workLog.create({
    data: {
      productionOrderId: data.productionOrderId,
      userId: data.userId,
      staffName: data.staffName,
      status: 'processing',
      startTime: new Date(),
    },
  });
}

/**
 * Kết thúc phiên làm việc và cập nhật toàn bộ hệ thống (Log, Pipeline, Kho).
 * Sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu.
 */
export async function submitWorkSession(data: {
  workLogId: string;
  quantityProduced: number;
  technicalErrorCount: number;
  materialErrorCount: number;
  errorNote?: string;
  evidenceImageUrl?: string;
  note?: string;
}) {
  const totalProduced = data.quantityProduced;
  const totalWaste = data.technicalErrorCount + data.materialErrorCount;
  const totalConsumed = totalProduced + totalWaste;

  return await prisma.$transaction(async (tx) => {
    // 1. Cập nhật Nhật ký công việc (Work Log)
    const workLog = await tx.workLog.update({
      where: { id: data.workLogId },
      data: {
        endTime: new Date(),
        quantityProduced: data.quantityProduced,
        technicalErrorCount: data.technicalErrorCount,
        materialErrorCount: data.materialErrorCount,
        errorNote: data.errorNote,
        evidenceImageUrl: data.evidenceImageUrl,
        note: data.note,
        status: 'completed',
      },
      include: {
        productionOrder: {
          include: {
            product: true
          }
        }
      }
    });

    // 2. Cập nhật tiến độ Lệnh sản xuất (Production Order)
    const updatedPO = await tx.productionOrder.update({
      where: { id: workLog.productionOrderId },
      data: {
        quantityCompleted: {
          increment: data.quantityProduced
        }
      }
    });

    // Trigger 3 & 4: Tự động chuyển trạng thái Task dựa trên sản lượng
    let newTaskStatus = updatedPO.currentStatus;
    const currentCompleted = updatedPO.quantityCompleted ?? 0;
    const currentTarget = updatedPO.quantityTarget ?? 0;

    // Nếu có sản lượng báo cáo > 0, chuyển sang 'in_progress'
    if (currentCompleted > 0 && updatedPO.currentStatus !== 'completed') {
      newTaskStatus = 'in_progress';
    }
    // Nếu đạt 100% sản lượng, chuyển sang 'completed'
    if (currentTarget > 0 && currentCompleted >= currentTarget) {
      newTaskStatus = 'completed';
    }

    if (newTaskStatus !== updatedPO.currentStatus) {
      await tx.productionOrder.update({
        where: { id: updatedPO.id },
        data: { currentStatus: newTaskStatus || 'pending' }
      });

      // Trigger cascading: Nếu task hoàn thành, kiểm tra toàn bộ đơn hàng
      if (newTaskStatus === 'completed') {
        const allTasks = await tx.productionOrder.findMany({
          where: { orderId: updatedPO.orderId }
        });
        const allDone = allTasks.every(t => t.currentStatus === 'completed');
        if (allDone) {
          await tx.order.update({
            where: { id: updatedPO.orderId },
            data: { status: 'packing' }
          });
        }
      }
    }

    // 3. Cập nhật Kho vật tư (Inventory)
    // Giả định: Mỗi sản phẩm tiêu thụ 1 đơn vị vật tư chính trong inventory_locations
    // Trong thực tế, cần mapping qua bảng ProductionMaterialEstimate
    if (workLog.productionOrder.product?.name) {
      const material = await tx.inventoryLocation.findFirst({
        where: { 
          itemName: {
            contains: workLog.productionOrder.product.name, // Tìm vật tư liên quan
            mode: 'insensitive'
          }
        }
      });

      if (material) {
        await tx.inventoryLocation.update({
          where: { id: material.id },
          data: {
            quantity: {
              decrement: totalConsumed
            },
            lastUpdated: new Date()
          }
        });
      }
    }

    return workLog;
  });
}

/**
 * Lấy lịch sử 10 phiên làm việc gần nhất của một nhân viên.
 */
export async function getPersonalWorkHistory(userId: string) {
  return await prisma.workLog.findMany({
    where: { userId },
    take: 10,
    orderBy: { startTime: 'desc' },
    include: {
      productionOrder: {
        include: {
          product: true
        }
      }
    }
  });
}
/**
 * Tạo nhiều nhật ký công việc cùng lúc (Dành cho Trưởng nhóm).
 * Đồng bộ hóa tiến độ Sản xuất và Kho.
 */
export async function createBatchWorkLogs(
  logs: {
    productionOrderId: string;
    userId: string;
    staffName?: string;
    quantityProduced: number;
    technicalErrorCount: number;
    materialErrorCount: number;
    errorNote?: string;
    note?: string;
    startTime?: Date;
    endTime?: Date;
  }[],
  batchesUsed: {
    batchId: string;
    materialId: string;
    quantity: number;
  }[]
) {
  return await prisma.$transaction(async (tx) => {
    const results = [];

    // 1. Create logs and collect workLog IDs
    for (const log of logs) {
      const newLog = await tx.workLog.create({
        data: {
          productionOrderId: log.productionOrderId,
          userId: log.userId,
          staffName: log.staffName,
          quantityProduced: log.quantityProduced,
          technicalErrorCount: log.technicalErrorCount,
          materialErrorCount: log.materialErrorCount,
          errorNote: log.errorNote,
          note: log.note,
          status: 'completed',
          startTime: log.startTime || new Date(),
          endTime: log.endTime || new Date(),
        }
      });

      // 2. Update Production Order progress
      const updatedPO = await tx.productionOrder.update({
        where: { id: log.productionOrderId },
        data: {
          quantityCompleted: {
            increment: log.quantityProduced
          }
        }
      });

      // Trigger 3 & 4 for Batch Logs
      let newTaskStatus = updatedPO.currentStatus;
      const currentCompleted = updatedPO.quantityCompleted ?? 0;
      const currentTarget = updatedPO.quantityTarget ?? 0;

      if (currentCompleted > 0 && updatedPO.currentStatus !== 'completed') {
        newTaskStatus = 'in_progress';
      }
      if (currentTarget > 0 && currentCompleted >= currentTarget) {
        newTaskStatus = 'completed';
      }

      if (newTaskStatus !== updatedPO.currentStatus) {
        await tx.productionOrder.update({
          where: { id: updatedPO.id },
          data: { currentStatus: newTaskStatus || 'pending' }
        });

        if (newTaskStatus === 'completed') {
          const allTasks = await tx.productionOrder.findMany({
            where: { orderId: updatedPO.orderId }
          });
          const allDone = allTasks.every(t => t.currentStatus === 'completed');
          if (allDone) {
            await tx.order.update({
              where: { id: updatedPO.orderId },
              data: { status: 'packing' }
            });
          }
        }
      }

      results.push(newLog);
    }

    // 3. Process Batch Consumption (one set of batches shared for this production run)
    // We link these consumption transactions to the FIRST log in the batch for traceability
    const primaryWorkLogId = results[0].id;

    for (const consumption of batchesUsed) {
      // Deduct from Batch
      await tx.materialBatch.update({
        where: { id: consumption.batchId },
        data: {
          remainQuantity: {
            decrement: consumption.quantity
          }
        }
      });

      // Deduct from Material total
      await tx.material.update({
        where: { id: consumption.materialId },
        data: {
          stockQuantity: {
            decrement: consumption.quantity
          }
        }
      });

      // Log Transaction
      await tx.materialTransaction.create({
        data: {
          materialId: consumption.materialId,
          batchId: consumption.batchId,
          quantity: consumption.quantity,
          type: 'production_usage',
          workLogId: primaryWorkLogId,
          note: `Tiêu thụ sản xuất - PO: ${logs[0].productionOrderId}`
        }
      });
    }

    return results;
  });
}

export async function getProductionOrderProfit(orderId: string) {
  const order = await prisma.productionOrder.findUnique({
    where: { id: orderId },
    include: {
      workLogs: {
        include: {
          materialTransactions: true
        }
      }
    }
  });

  if (!order) throw new Error("Order not found");

  const contractPrice = Number(order.contractPrice || 0);
  const totalQuantity = order.quantityTarget || 0;
  const totalRevenue = contractPrice * totalQuantity;

  let totalActualCOGS = 0;
  (order as any).workLogs.forEach((log: any) => {
    log.materialTransactions.forEach((tx: any) => {
      totalActualCOGS += Number(tx.quantity) * Number(tx.price || 0);
    });
  });

  const profit = totalRevenue - totalActualCOGS;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  return {
    contractPrice,
    totalRevenue,
    totalActualCOGS,
    profit,
    margin,
    isLowMargin: margin < 20 // 20% Threshold
  };
}

/**
 * Lấy BOM cho một sản phẩm của PO để hiển thị gợi ý nhập lô.
 */
export async function getPOMaterialNeeds(productionOrderId: string) {
  const po = await prisma.productionOrder.findUnique({
    where: { id: productionOrderId },
    include: {
      product: {
        include: {
          bomItems: {
            include: {
              material: true
            }
          }
        }
      }
    }
  });

  return po?.product?.bomItems || [];
}

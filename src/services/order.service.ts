'use server';

/* 
  Service for Order Management & Production Trigger 
*/
import { prisma } from '@/lib/prisma';


/**
 * Tính toán giá vốn (COGS) dự kiến cho một sản phẩm dựa trên BOM hiện tại.
 */
export async function calculateProductCOGS(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      bomItems: {
        include: {
          material: true
        }
      }
    }
  });

  if (!product) return 0;

  // Sử dụng referencePrice hoặc purchasePrice từ Material
  const totalCOGS = product.bomItems.reduce((acc, item) => {
    // Ưu tiên đơn giá mua mới nhất, nếu không có dùng giá tham chiếu
    const rawPrice = item.material?.unitPrice || item.material?.referencePrice || 0;
    let price = Number(rawPrice);
    
    // Nếu giá vẫn bằng 0, tính thử từ giá nhập / số lượng nhập
    if (price === 0 && item.material?.purchasePrice && item.material?.purchaseQuantity) {
      const pPrice = Number(item.material.purchasePrice);
      const pQty = Number(item.material.purchaseQuantity);
      if (pQty > 0) price = pPrice / pQty;
    }

    const quantity = Number(item.quantity || 0);
    return acc + (price * quantity);
  }, 0);

  return totalCOGS;
}

/**
 * Tạo Đơn hàng mới và Tự động tách thành các Lệnh sản xuất (Tasks).
 */
export async function createSalesOrder(data: {
  customerId?: string;
  deadlineDelivery: Date;
  items: {
    productId: string;
    quantity: number;
    dealPrice: number;
    cogsAtOrder: number;
    bomSnapshot?: any;
    note?: string;
    allocations: {
      type: 'internal' | 'outsourced';
      outsourcedName?: string;
      quantity: number;
    }[];
  }[]
}) {
  return await prisma.$transaction(async (tx) => {
    // 0. Tính toán Mã Hợp đồng mới (Nếu chưa có)
    const lastOrder = await tx.order.findFirst({
      orderBy: { orderDate: 'desc' }
    });
    let nextCode = "PAV-HĐ001";
    if ((lastOrder as any)?.contractCode) {
      const match = (lastOrder as any).contractCode.match(/\d+/);
      if (match) {
        const num = parseInt(match[0]) + 1;
        nextCode = `PAV-HĐ${num.toString().padStart(3, '0')}`;
      }
    }

    // 1. Tạo Đơn hàng (Order)
    const order = await tx.order.create({
      data: {
        customer: data.customerId ? { connect: { id: data.customerId } } : undefined,
        contractCode: nextCode,
        deadlineDelivery: data.deadlineDelivery,
        status: 'new', // Trigger 1: Ngay khi nhấn 'Lưu', thẻ Đơn hàng chuyển sang cột Đã lên đơn
        orderItems: {
          create: data.items.map(item => ({
            product: (item.productId && item.productId.trim()) ? { connect: { id: item.productId } } : undefined,
            quantity: item.quantity,
            price: item.dealPrice,
            cogsAtOrder: item.cogsAtOrder,
            bomSnapshot: item.bomSnapshot as any,
            note: item.note
          }))
        }
      } as any
    });

    // 2. Không còn tự động tạo các Lệnh sản xuất (Tasks) tại đây. 
    // Việc phân bổ sẽ được thực hiện sau tại trang Chi tiết đơn hàng.

    return { order };
  });
}

/**
 * Lấy danh sách toàn bộ đơn hàng.
 */
export async function getOrders() {
  const result = await prisma.order.findMany({
    include: {
      customer: true,
      orderItems: {
        include: {
          product: true
        }
      },
      productionOrders: true,
      packages: true
    },
    orderBy: { orderDate: 'desc' }
  });
  
  // Calculate aggregate progress for each order
  const enhanced = result.map(order => {
    const totalTarget = order.productionOrders.reduce((acc, po) => acc + (po.quantityTarget || 0), 0);
    const totalCompleted = order.productionOrders.reduce((acc, po) => acc + (po.quantityCompleted || 0), 0);
    const progress = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
    
    return {
      ...order,
      overallProgress: progress
    };
  });

  return JSON.parse(JSON.stringify(enhanced)) as any;
}

/**
 * Lấy danh sách toàn bộ lệnh sản xuất (Production Orders).
 */
export async function getProductionOrders() {
  const result = await prisma.productionOrder.findMany({
    include: {
      product: true,
      order: {
        include: {
          customer: true
        }
      }
    },
    orderBy: { deadlineProduction: 'asc' }
  });
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

/**
 * Lấy chi tiết một đơn hàng theo ID.
 */
export async function getOrderById(id: string) {
  const result = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      orderItems: {
        include: {
          product: true
        }
      },
      productionOrders: {
        include: {
          product: true
        }
      },
      packages: {
        include: {
          packingListDetails: {
            include: {
              product: true
            }
          }
        }
      }
    }
  });
  return JSON.parse(JSON.stringify(result));
}

/**
 * Cập nhật thông tin đơn hàng (Status, Deadline, Notes...)
 */
export async function updateOrder(id: string, data: any) {
  const { orderItems, ...updateData } = data;
  
  return await prisma.order.update({
    where: { id },
    data: updateData,
    include: {
      customer: true,
      orderItems: true
    }
  });
}

/**
 * Xóa đơn hàng (Cần xóa các ràng buộc nếu cần)
 */
export async function deleteOrder(id: string) {
  // Check count of linked production orders first for frontend warning
  const poCount = await prisma.productionOrder.count({ where: { orderId: id } });
  
  return await prisma.$transaction(async (tx) => {
    // Delete linked records (Cascading delete in business logic)
    await tx.productionOrder.deleteMany({ where: { orderId: id } });
    await tx.orderItem.deleteMany({ where: { orderId: id } });
    const order = await tx.order.delete({
      where: { id }
    });
    return { ...order, deletedPOCount: poCount };
  });
}

/**
 * Thêm một Lệnh sản xuất thủ công cho một Đơn hàng hiện có.
 */
export async function addProductionOrderToOrder(orderId: string, productId: string, quantity: number) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  return await prisma.productionOrder.create({
    data: {
      orderId: orderId,
      productId: productId,
      quantityTarget: quantity,
      currentStatus: 'pending',
      deadlineProduction: order.deadlineDelivery || new Date()
    }
  });
}

'use server';

import { prisma } from '@/lib/prisma';

/**
 * Lấy danh sách sản phẩm mặc định của một khách hàng
 * Dùng để tự động điền vào Form Đơn hàng khi chọn Customer
 */
export async function getCustomerDefaultProducts(customerId: string) {
  return await prisma.customerDefaultProduct.findMany({
    where: { customerId },
    include: {
      product: true, // Bao gồm thông tin chi tiết sản phẩm (SKU, Name, Price...)
    },
  });
}

/**
 * Lấy danh sách toàn bộ khách hàng cho Dropdown chọn trong Form
 */
export async function getAllCustomers() {
  return await prisma.customer.findMany({
    orderBy: { name: 'asc' },
  });
}

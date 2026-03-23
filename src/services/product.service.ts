'use server';

import { prisma } from '@/lib/prisma';
import { Product, Prisma } from '@prisma/client';

/**
 * Lấy toàn bộ danh sách sản phẩm.
 */
export async function getAllProducts() {
  const products = await prisma.product.findMany({
    include: {
      bomItems: {
        include: {
          material: true
        }
      }
    },
    orderBy: { name: 'asc' },
  });

  // Normalize materials in BOM
  const mapped = products.map(p => ({
    ...p,
    bomItems: p.bomItems.map(bi => {
      let refPrice = Number(bi.material.referencePrice || 0);
      if (refPrice === 0 && bi.material.purchasePrice && bi.material.purchaseQuantity && Number(bi.material.purchaseQuantity) > 0) {
        refPrice = Number(bi.material.purchasePrice) / Number(bi.material.purchaseQuantity);
      }
      return {
        ...bi,
        material: {
          ...bi.material,
          referencePrice: refPrice,
          unitPrice: Number(bi.material.unitPrice || 0)
        }
      };
    })
  }));

  return JSON.parse(JSON.stringify(mapped)) as any;
}

/**
 * Lấy chi tiết sản phẩm kèm BOM.
 */
export async function getProductDetail(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      bomItems: {
        include: {
          material: true
        }
      }
    }
  });

  if (!product) return null;

  // Normalize materials in BOM and product prices
  const mapped = {
    ...product,
    basePrice: Number(product.basePrice || 0),
    wholesalePrice: Number(product.wholesalePrice || 0),
    exportPrice: Number(product.exportPrice || 0),
    bomItems: product.bomItems.map(bi => {
      let refPrice = Number(bi.material.referencePrice || 0);
      if (refPrice === 0 && bi.material.purchasePrice && bi.material.purchaseQuantity && Number(bi.material.purchaseQuantity) > 0) {
        refPrice = Number(bi.material.purchasePrice) / Number(bi.material.purchaseQuantity);
      }
      return {
        ...bi,
        material: {
          ...bi.material,
          referencePrice: refPrice,
          unitPrice: Number(bi.material.unitPrice || 0)
        }
      };
    })
  };

  return JSON.parse(JSON.stringify(mapped)) as any;
}

/**
 * Tính toán lại giá vốn từ BOM và cập nhật vào bảng products.
 */
export async function recalculateProductCostPrice(productId: string) {
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

  if (!product) return null;

  let totalCost = 0;
  product.bomItems.forEach(item => {
    let price = Number(item.material.unitPrice || item.material.referencePrice || 0);
    
    // Fallback to purchase history if price is 0
    if (price === 0 && item.material.purchasePrice && item.material.purchaseQuantity && Number(item.material.purchaseQuantity) > 0) {
      price = Number(item.material.purchasePrice) / Number(item.material.purchaseQuantity);
    }
    
    totalCost += price * Number(item.quantity);
  });

  const oldPrice = Number((product as any).costPrice || 0);
  
  // Use raw query to bypass client-side validation if client is out of sync
  await prisma.$executeRaw`UPDATE products SET cost_price = ${totalCost} WHERE id = ${productId}::uuid`;

  const updatedProduct = await prisma.product.findUnique({
    where: { id: productId }
  });

  return {
    oldPrice,
    newPrice: totalCost,
    product: updatedProduct
  };
}

/**
 * Cập nhật BOM cho sản phẩm.
 */
export async function updateProductBOM(
  productId: string, 
  items: { materialId: string, quantity: number }[]
) {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Xóa BOM cũ
    await tx.bOMItem.deleteMany({
      where: { productId }
    });

    // 2. Thêm BOM mới
    if (items.length > 0) {
      await tx.bOMItem.createMany({
        data: items.map(item => ({
          productId,
          materialId: item.materialId,
          quantity: item.quantity
        }))
      });
    }

    return await tx.product.findUnique({
      where: { id: productId }
    });
  });

  // 3. Tự động tính lại giá vốn
  await recalculateProductCostPrice(productId);

  return JSON.parse(JSON.stringify(result)) as any;
}

/**
 * Cập nhật cấu hình COGS của sản phẩm.
 */
export async function updateProductCOGS(
  productId: string, 
  cogsConfig: any
) {
  const result = await prisma.product.update({
    where: { id: productId },
    data: { cogsConfig: cogsConfig ? (cogsConfig as any) : Prisma.JsonNull }
  });
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

/**
 * Thêm hoặc cập nhật sản phẩm.
 */
export async function upsertProduct(data: Partial<Product>) {
  const { id, ...updateData } = data;
  
  // Extract price fields to update via raw SQL to bypass client sync issues
  const priceFields: any = {};
  if ('basePrice' in updateData) priceFields.base_price = updateData.basePrice;
  if ('wholesalePrice' in updateData) priceFields.wholesale_price = updateData.wholesalePrice;
  if ('exportPrice' in updateData) priceFields.export_price = updateData.exportPrice;
  if ('costPrice' in updateData) priceFields.cost_price = updateData.costPrice;

  // Remove them from the standard prisma update to avoid validation errors
  const standardFields = { ...updateData };
  delete (standardFields as any).basePrice;
  delete (standardFields as any).wholesalePrice;
  delete (standardFields as any).exportPrice;
  delete (standardFields as any).costPrice;

  let result;
  if (id) {
    // 1. Update standard fields
    if (Object.keys(standardFields).length > 0) {
      await prisma.product.update({
        where: { id },
        data: standardFields as any,
      });
    }

    // 2. Update price fields via raw SQL
    for (const [key, value] of Object.entries(priceFields)) {
      await prisma.$executeRawUnsafe(`UPDATE products SET ${key} = $1 WHERE id = $2::uuid`, value, id);
    }

    result = await prisma.product.findUnique({ where: { id } });
  } else {
    // For creation, we still try standard create but might need to handle it differently 
    // if creation is also blocked. But usually creation is safer or rare in existing items.
    result = await prisma.product.create({
      data: updateData as any,
    });
  }
  return JSON.parse(JSON.stringify(result)) as any;
}

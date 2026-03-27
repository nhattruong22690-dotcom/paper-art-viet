import { supabaseAdmin as supabase } from '@/lib/supabase';

/**
 * Lấy danh sách sản phẩm mặc định của một khách hàng
 * Dùng để tự động điền vào Form Đơn hàng khi chọn Customer
 */
export async function getCustomerDefaultProducts(customerId: string) {
  const { data, error } = await supabase
    .from('CustomerDefaultProduct')
    .select(`
      *,
      product:products(*)
    `)
    .eq('customer_id', customerId);

  if (error) throw error;

  // Transform snake_case from DB to camelCase for Application
  return (data || []).map(row => ({
    id: row.id,
    customerId: row.customer_id,
    productId: row.product_id,
    defaultQuantity: row.default_quantity,
    product: row.product ? {
      id: row.product.id,
      sku: row.product.code,
      name: row.product.name,
      basePrice: row.product.base_price,
      costPrice: row.product.cost_price,
      wholesalePrice: row.product.wholesale_price,
      exportPrice: row.product.export_price
    } : null
  }));
}

/**
 * Lấy danh sách toàn bộ khách hàng cho Dropdown chọn trong Form
 */
export async function getAllCustomers() {
  const { data, error } = await supabase
    .from('Customer')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    customerCode: row.customer_code,
    notes: row.notes,
    customerGroup: row.customer_group
  }));
}

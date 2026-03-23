import { supabaseAdmin as supabase } from '@/lib/supabase';

/**
 * Sinh mã thùng theo định dạng: XINH-YYYYMMDD-00X
 */
export async function generatePackageCode() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].split('-').join(''); // 20260322
  const prefix = `XINH-${dateStr}`;

  // Đếm xem trong hôm nay đã có bao nhiêu thùng được tạo với prefix này
  const { count, error } = await supabase
    .from('Package')
    .select('*', { count: 'exact', head: true })
    .ilike('package_code', `${prefix}%`);

  if (error) throw error;

  const nextIndex = ((count || 0) + 1).toString().padStart(3, '0');
  return `${prefix}-${nextIndex}`;
}

/**
 * Tạo một Thùng hàng (Package) từ các sản phẩm đã hoàn thành trong Sản xuất
 */
export async function createPackageFromProduction(
  orderId: string, 
  items: { productionOrderId: string; productId: string; quantity: number }[]
) {
  // 1. Sinh mã thùng mới
  const packageCode = await generatePackageCode();

  // 2. Tạo record Package
  const { data: newPackage, error: pkgError } = await supabase
    .from('Package')
    .insert({
      order_id: orderId,
      package_code: packageCode,
      status: 'packing',
    })
    .select()
    .single();

  if (pkgError) throw pkgError;

  // 3. Tạo Packing List Details
  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from('PackingListDetail')
      .insert(items.map(item => ({
        package_id: newPackage.id,
        product_id: item.productId,
        quantity: item.quantity,
      })));
    
    if (itemsError) throw itemsError;
  }

  // 4. Lấy lại full thông tin để trả về
  const { data: finalPkg, error: finalError } = await supabase
    .from('Package')
    .select(`
      *,
      packingListDetails:PackingListDetail(
        *,
        product:Product(*)
      ),
      order:Order(
        *,
        customer:Customer(*)
      )
    `)
    .eq('id', newPackage.id)
    .single();

  if (finalError) throw finalError;

  return {
    ...finalPkg,
    packageCode: finalPkg.package_code,
    orderId: finalPkg.order_id,
    packingListDetails: (finalPkg.packingListDetails || []).map((pd: any) => ({
      ...pd,
      packageId: pd.package_id,
      productId: pd.product_id
    }))
  };
}

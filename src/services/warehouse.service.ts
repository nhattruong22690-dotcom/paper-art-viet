import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function getFinishedProductionItems() {
  const { data: items, error } = await supabase
    .from('ProductionOrder')
    .select(`
      *,
      product:Product(*),
      order:Order(
        *,
        customer:Customer(*)
      )
    `)
    .gt('quantity_completed', 0);

  if (error) throw error;

  return (items || []).map(po => ({
    id: po.id,
    productName: po.product?.name || 'Sản phẩm',
    sku: po.product?.sku || 'N/A',
    quantityCompleted: po.quantity_completed || 0,
    quantityPacked: 0, // In a real app, we'd sum up PackingListDetail for this PO
    customerName: po.order?.customer?.name || 'Khách lẻ'
  }));
}

export async function createPackage(data: {
  orderId?: string;
  items: { productId: string; quantity: number }[];
}) {
  const packageCode = `XINH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  const { data: pkg, error: pkgError } = await supabase
    .from('Package')
    .insert({
      package_code: packageCode,
      order_id: data.orderId,
      status: 'packing',
    })
    .select(`
      *,
      order:Order(
        *,
        customer:Customer(*)
      )
    `)
    .single();

  if (pkgError) throw pkgError;

  if (data.items.length > 0) {
    const { error: itemsError } = await supabase
      .from('PackingListDetail')
      .insert(data.items.map(item => ({
        package_id: pkg.id,
        product_id: item.productId,
        quantity: item.quantity
      })));
    
    if (itemsError) throw itemsError;
  }

  // Fetch with full details for response
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
    .eq('id', pkg.id)
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

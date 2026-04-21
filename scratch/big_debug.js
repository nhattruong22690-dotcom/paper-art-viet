const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bcgfjhjlmjnvswpnxpvh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjZ2ZqaGpsbWpudnN3cG54cHZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMzNDM4NywiZXhwIjoyMDg5OTEwMzg3fQ.I95Nu8b19e60VLodc5xrDgNNyz0fWT05QMUS4zewgEs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDebug() {
  const contractCode = 'OIITFCTG015';
  
  const { data: order } = await supabase.from('Order').select('id').eq('contract_code', contractCode).single();
  if (!order) return;
  
  const { data: items } = await supabase
    .from('OrderItem')
    .select('id, product_id, quantity, products(name, code)')
    .eq('order_id', order.id);
    
  console.log(`Order: ${contractCode}`);
  
  for (const item of items || []) {
    console.log(`\nProduct: ${item.products?.name} (${item.products?.code}) [ID: ${item.product_id}]`);
    
    const { data: boms } = await supabase
      .from('bom')
      .select('id, is_active')
      .eq('product_id', item.product_id)
      .eq('is_active', true);
      
    if (!boms || boms.length === 0) {
      console.log(' - No active BOM found.');
      continue;
    }
    
    for (const bom of boms) {
      const { data: materials } = await supabase
        .from('bom_materials')
        .select('*, materials(name, code)')
        .eq('bom_id', bom.id);
        
      console.log(` - Active BOM ${bom.id}:`);
      materials?.forEach(m => {
        console.log(`   * ${m.materials?.code || '---'}: ${m.materials?.name || '---'} (Qty: ${m.qty})`);
      });
    }
  }
}

runDebug();

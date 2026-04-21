const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bcgfjhjlmjnvswpnxpvh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjZ2ZqaGpsbWpudnN3cG54cHZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMzNDM4NywiZXhwIjoyMDg5OTEwMzg3fQ.I95Nu8b19e60VLodc5xrDgNNyz0fWT05QMUS4zewgEs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findOrder() {
  const pId = 'c8b3d50a-968f-46c9-9024-1b05dc8b16ae'; // MN006
  
  const { data: items, error } = await supabase
    .from('OrderItem')
    .select('order_id, quantity, product_id')
    .eq('product_id', pId);
    
  if (error) {
    console.error('Error finding order items:', error);
    return;
  }
  
  if (!items || items.length === 0) {
    console.log('No order items found for MN006');
    return;
  }
  
  console.log(`Found ${items.length} orders containing MN006.`);
  
  for (const item of items) {
      const { data: order } = await supabase.from('Order').select('contract_code').eq('id', item.order_id).single();
      console.log(`Order ID: ${item.order_id}, Contract Code: ${order?.contract_code}, Qty: ${item.quantity}`);
      
      // Check other items in the same order
      const { data: otherItems } = await supabase.from('OrderItem').select('product_id, products(name, code)').eq('order_id', item.order_id);
      console.log('Other items in this order:');
      otherItems.forEach(oi => {
          console.log(`  - ${oi.products?.name} (${oi.products?.code})`);
      });
  }
}

findOrder();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bcgfjhjlmjnvswpnxpvh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjZ2ZqaGpsbWpudnN3cG54cHZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMzNDM4NywiZXhwIjoyMDg5OTEwMzg3fQ.I95Nu8b19e60VLodc5xrDgNNyz0fWT05QMUS4zewgEs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  const sku = 'MN006';
  
  // 1. Find product
  const { data: products, error: pError } = await supabase
    .from('products')
    .select('id, name, code')
    .eq('code', sku); // MN006 might be in 'code' or 'sku' column
    
  if (pError) {
    console.error('Product Error:', pError);
    return;
  }
  
  console.log('Product Search (code=MN006):', JSON.stringify(products, null, 2));
  
  // Check sku column too
  const { data: productsBySku } = await supabase.from('products').select('id, name, code, sku').eq('sku', sku);
  console.log('Product Search (sku=MN006):', JSON.stringify(productsBySku, null, 2));

  const allFound = [...(products || []), ...(productsBySku || [])];
  if (allFound.length === 0) {
      console.log('No product found with code/sku MN006');
      return;
  }
  
  const pId = allFound[0].id;
  
  // 2. Find all BOMs for this product
  const { data: boms, error: bError } = await supabase
    .from('bom')
    .select('id, is_active, version, created_at')
    .eq('product_id', pId);
    
  if (bError) {
    console.error('BOM Error:', bError);
    return;
  }
  
  console.log(`Found ${boms.length} BOMs for MN006:`);
  console.log(JSON.stringify(boms, null, 2));
  
  // 3. Check materials for the active BOM(s)
  for (const bom of boms) {
    const { data: materials, error: mError } = await supabase
      .from('bom_materials')
      .select('*, materials(name, code, unit)')
      .eq('bom_id', bom.id);
      
    console.log(`\nMaterials for BOM ${bom.id} (Active: ${bom.is_active}):`);
    console.log(`Count: ${materials ? materials.length : 0}`);
    if (materials && materials.length > 0) {
        materials.forEach(m => {
            console.log(` - ${m.materials.code}: ${m.materials.name} (${m.qty} ${m.materials.unit})`);
        });
    }
  }
}

debug();

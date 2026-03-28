import { supabaseAdmin as supabase } from './src/lib/supabase';

async function inspect() {
  const { data, error } = await supabase.from('ProductionOrder').select('*').limit(1);
  if (error) {
    console.error('Error fetching ProductionOrder:', error);
  } else if (data && data.length > 0) {
    console.log('ProductionOrder row example:', data[0]);
    console.log('Columns:', Object.keys(data[0]));
  } else {
    console.log('No rows found in ProductionOrder.');
  }
}

inspect();

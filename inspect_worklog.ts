import { supabaseAdmin as supabase } from './src/lib/supabase';

async function inspect() {
  const { data, error } = await supabase.from('WorkLog').select('*').limit(1);
  if (error) {
    console.error('Error fetching WorkLog:', error);
  } else if (data && data.length > 0) {
    console.log('WorkLog row example:', data[0]);
    console.log('Columns:', Object.keys(data[0]));
  } else {
    // If no data, try to look at table columns information if available
    console.log('No rows found in WorkLog. Trying to get columns via query...');
  }
}

inspect();

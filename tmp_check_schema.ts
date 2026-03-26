import { supabaseAdmin } from './src/lib/supabase';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function checkSchema() {
  console.log('Checking "users" table schema...');
  const { data, error } = await supabaseAdmin.from('users').select('*').limit(1);
  if (error) {
    console.error('Error fetching from users:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Fields in users table:', Object.keys(data[0]));
  } else {
    console.log('Table "users" is empty.');
    // Check if "User" exists
    const { data: data2, error: error2 } = await supabaseAdmin.from('User').select('*').limit(1);
    if (!error2 && data2 && data2.length > 0) {
      console.log('Fields in "User" table:', Object.keys(data2[0]));
    } else {
       console.log('Neither "users" nor "User" has data or exists.');
    }
  }
}

checkSchema();

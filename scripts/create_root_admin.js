const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manual .env parsing
let envContent = '';
try {
  envContent += fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8') + '\n';
} catch (e) {}
try {
  envContent += fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
} catch (e) {}

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  console.log('Creating Root Admin...');
  
  const adminId = '00000000-0000-0000-0000-000000000000';
  
  // 1. Insert Employee
  const { error: empError } = await supabase.from('Employees').upsert({
    id: adminId,
    employee_code: 'PAV-ADMIN',
    full_name: 'ADMINISTRATOR',
    department: 'Hội đồng Quản trị',
    position: 'Tổng Giám Đốc',
    status: 'active',
    salary_type: 'monthly',
    base_salary: 0
  }, { onConflict: 'id' });

  if (empError) {
    console.error('Error inserting employee:', empError);
    return;
  }
  console.log('Employee record created/verified.');

  // 2. Insert User (mapping to correct columns found)
  // Use 'account' for username and 'password_hash' for password
  const { error: userError } = await supabase.from('users').upsert({
    id: adminId, 
    employee_id: adminId,
    account: 'admin',
    password_hash: 'admin2206@',
    role: 'Admin',
    is_active: true
  }, { onConflict: 'id' });

  if (userError) {
    console.error('Error inserting user:', userError);
    return;
  }
  console.log('Admin user record created/verified.');
  console.log('--- CREDENTIALS ---');
  console.log('Username: admin');
  console.log('Password: admin2206@');
  console.log('-------------------');
}

createAdmin();

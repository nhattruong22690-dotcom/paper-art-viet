import { supabaseAdmin as supabase } from '@/lib/supabase';

/**
 * Organizational Management (Departments & Positions)
 */
export async function getHRDepartments() {
  const { data, error } = await supabase.from('hr_departments').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function createHRDepartment(name: string) {
  const { data, error } = await supabase.from('hr_departments').insert({ name }).select().single();
  if (error) throw error;
  return data;
}

export async function updateHRDepartment(id: string, name: string) {
  const { data, error } = await supabase.from('hr_departments').update({ name }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteHRDepartment(id: string) {
  const { error } = await supabase.from('hr_departments').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getHRPositions() {
  const { data, error } = await supabase.from('hr_positions').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function createHRPosition(name: string) {
  const { data, error } = await supabase.from('hr_positions').insert({ name }).select().single();
  if (error) throw error;
  return data;
}

export async function updateHRPosition(id: string, name: string) {
  const { data, error } = await supabase.from('hr_positions').update({ name }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteHRPosition(id: string) {
  const { error } = await supabase.from('hr_positions').delete().eq('id', id);
  if (error) throw error;
  return true;
}

/**
 * Auto-generation of Employee Code (NV + 3 digits)
 */
export async function getNextEmployeeCode() {
  const { data, error } = await supabase
    .from('Employees')
    .select('employee_code')
    .ilike('employee_code', 'NV%')
    .order('employee_code', { ascending: false })
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) return 'NV001';

  const lastCode = data[0].employee_code;
  const lastNum = parseInt(lastCode.replace('NV', ''), 10);
  
  if (isNaN(lastNum)) return 'NV001';

  const nextNum = lastNum + 1;
  return `NV${nextNum.toString().padStart(3, '0')}`;
}

/**
 * Lấy danh sách toàn bộ nhân viên từ bảng Employees, kèm theo trạng thái tài khoản.
 */
export async function getEmployees() {
  const { data, error } = await supabase
    .from('Employees')
    .select(`
      *,
      users(id, account, role, is_active)
    `)
    .order('full_name', { ascending: true });

  if (error) throw error;
  
  return (data || []).map(emp => ({
    id: emp.id,
    employeeCode: emp.employee_code,
    name: emp.full_name,
    phone: emp.phone,
    email: emp.email,
    idCard: emp.id_card,
    address: emp.address,
    department: emp.department,
    position: emp.position,
    status: emp.status,
    joinDate: emp.join_date,
    salaryType: emp.salary_type,
    baseSalary: Number(emp.base_salary || 0),
    hasAccount: emp.users && emp.users.length > 0,
    account: emp.users?.[0] || null
  }));
}

/**
 * Lấy chi tiết một nhân viên và tài khoản liên kết.
 */
export async function getEmployeeById(id: string) {
  const { data, error } = await supabase
    .from('Employees')
    .select(`
      *,
      users(id, account, role, is_active)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  
  return {
    ...data,
    employeeCode: data.employee_code,
    name: data.full_name,
    idCard: data.id_card,
    joinDate: data.join_date,
    salaryType: data.salary_type,
    baseSalary: Number(data.base_salary || 0),
    hasAccount: data.users && data.users.length > 0,
    account: data.users?.[0] || null
  };
}

/**
 * Thống kê nhanh về nhân sự cho HR Dashboard.
 */
export async function getEmployeeStats() {
  const { data, error } = await supabase
    .from('Employees')
    .select('id, department, status');

  if (error) throw error;
  
  const total = data.length;
  const active = data.filter(e => e.status === 'active').length;
  const byDept: Record<string, number> = {};
  
  data.forEach(e => {
    byDept[e.department] = (byDept[e.department] || 0) + 1;
  });

  return { total, active, inactive: total - active, byDept };
}

/**
 * Thêm một nhân viên mới.
 */
export async function createEmployee(data: any) {
  let finalCode = data.employeeCode;
  if (!finalCode) {
    finalCode = await getNextEmployeeCode();
  }

  const dbData: any = {
    full_name: data.name,
    employee_code: finalCode,
    id_card: data.idCard,
    phone: data.phone,
    email: data.email,
    address: data.address,
    department: data.department,
    position: data.position,
    status: data.status || 'active',
    join_date: data.joinDate,
    salary_type: data.salaryType,
    base_salary: data.baseSalary
  };
  
  const { data: newEmp, error } = await supabase
    .from('Employees')
    .insert(dbData)
    .select()
    .single();

  if (error) throw error;
  return newEmp;
}

/**
 * Cập nhật thông tin nhân viên + Ghi log lịch sử nếu có thay đổi quan trọng.
 */
export async function updateEmployee(id: string, data: any) {
  // Lấy dữ liệu cũ để so sánh
  const oldData = await getEmployeeById(id);
  
  const dbData: any = {};
  if (data.name) dbData.full_name = data.name;
  if (data.employeeCode) dbData.employee_code = data.employeeCode;
  if (data.idCard) dbData.id_card = data.idCard;
  if (data.phone) dbData.phone = data.phone;
  if (data.email) dbData.email = data.email;
  if (data.address) dbData.address = data.address;
  if (data.department) dbData.department = data.department;
  if (data.position) dbData.position = data.position;
  if (data.status) dbData.status = data.status;
  if (data.joinDate) dbData.join_date = data.joinDate;
  if (data.salaryType) dbData.salary_type = data.salaryType;
  if (data.baseSalary !== undefined) dbData.base_salary = data.baseSalary;

  const { data: updated, error } = await supabase
    .from('Employees')
    .update(dbData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Ghi log nếu thay đổi lương hoặc bộ phận
  if (data.baseSalary !== undefined && Number(data.baseSalary) !== Number(oldData.baseSalary)) {
    await logJobHistory(id, {
      change_type: 'salary_change',
      old_value: oldData.baseSalary.toString(),
      new_value: data.baseSalary.toString(),
      reason: data.reason || 'Cập nhật định kỳ'
    });
  }

  if (data.department && data.department !== oldData.department) {
    await logJobHistory(id, {
      change_type: 'dept_change',
      old_value: oldData.department,
      new_value: data.department,
      reason: data.reason || 'Điều động công tác'
    });
  }

  return updated;
}

/**
 * Xóa nhân viên và tài khoản liên kết.
 */
export async function deleteEmployee(id: string) {
  // 1. Xóa tài khoản trước (Hoặc DB cascade)
  await supabase.from('users').delete().eq('employee_id', id);
  
  // 2. Xóa hồ sơ
  const { error } = await supabase
    .from('Employees')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Lịch sử công việc.
 */
export async function logJobHistory(employeeId: string, log: any) {
  const { error } = await supabase
    .from('job_history')
    .insert({
      employee_id: employeeId,
      ...log
    });
  if (error) console.error('Failed to log history:', error);
}

export async function getJobHistory(employeeId: string) {
  const { data, error } = await supabase
    .from('job_history')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Quản lý tài khoản (users).
 */
/**
 * Quản lý tài khoản (users).
 * Phiên bản mới hỗ trợ đồng bộ Auth và sử dụng cột 'account'.
 */
export async function grantUserAccount(employeeId: string, email: string, role: string) {
  // 1. Tạo tài khoản đăng nhập trong Supabase Auth (Nếu chưa có)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: 'PaperArt@2025', // Mật khẩu tạm thời
    email_confirm: true,
    user_metadata: { employee_id: employeeId },
    app_metadata: { role: role.toLowerCase(), permissions: {} }
  });

  // Nếu lỗi do User đã tồn tại cũng không sao, chúng ta sẽ lấy ID cũ
  let userId = authData?.user?.id;
  if (authError) {
    console.warn('Auth user might already exist or error:', authError.message);
    // Thử tìm user xem có không để lấy ID
    const { data: usersFound } = await supabase.auth.admin.listUsers();
    const existing = usersFound?.users.find(u => u.email === email);
    if (existing) userId = existing.id;
    else throw authError;
  }

  // 2. Chèn vào bảng public.users (Đã đổi tên sang account)
  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: userId, // Dùng đúng ID từ Auth
      employee_id: employeeId,
      account: email, // Cột đã đổi tên
      role: role.toLowerCase(),
      is_active: true
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Database Error in grantUserAccount:', error.message);
    throw error;
  }
  return data;
}

export async function updateUserSettings(userId: string, settings: any) {
  const { data, error } = await supabase
    .from('users')
    .update(settings)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  return updateUserSettings(userId, { is_active: isActive });
}

export async function resetUserPassword(userId: string, newPassword: string) {
  return updateUserSettings(userId, { password_hash: newPassword }); // Trực tiếp lưu cho demo, sẽ băm sau
}

export async function updateUserRole(userId: string, role: string) {
  return updateUserSettings(userId, { role: role });
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*, Employees(full_name, employee_code, department)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Lấy danh sách công nhân (workers) đang hoạt động để phục vụ Ghi nhận sản xuất.
 */
export async function getProductionWorkers() {
  const { data, error } = await supabase
    .from('Employees')
    .select('id, full_name, employee_code, department, position')
    .eq('status', 'active')
    .or('department.eq.SX,position.eq.Sản xuất')
    .order('full_name', { ascending: true });

  if (error) throw error;
  
  return (data || []).map(emp => ({
    id: emp.id,
    name: emp.full_name,
    code: emp.employee_code,
    department: emp.department,
    position: emp.position
  }));
}

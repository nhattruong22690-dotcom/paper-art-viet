-- ==========================================================
-- SUPABASE RPC & GLOBAL PERMISSION HELPER
-- ==========================================================

-- 1. Hàm quản lý quyền hạn (RPC) - Chạy với quyền SECURITY DEFINER để can thiệp vào auth.users
CREATE OR REPLACE FUNCTION manage_user_permissions(
  target_user_id UUID, 
  new_role TEXT, 
  new_permissions TEXT[]
)
RETURNS VOID AS $$
BEGIN
  -- Cập nhật app_metadata của User trong bảng auth.users
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || 
    jsonb_build_object('role', new_role, 'permissions', new_permissions)
  WHERE id = target_user_id;

  -- Cập nhật vào bảng users (profile) nếu có
  UPDATE public.users
  SET role = new_role
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Hàm Helper kiểm tra quyền toàn cục (Global Helper)
-- Sử dụng trong các RLS Policies sau này
CREATE OR REPLACE FUNCTION check_access(perm_required TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_perms TEXT[];
  user_role TEXT;
BEGIN
  -- Lấy role và danh sách quyền từ JWT
  user_role := auth.jwt() -> 'app_metadata' ->> 'role';
  user_perms := ARRAY(SELECT jsonb_array_elements_text(auth.jwt() -> 'app_metadata' -> 'permissions'));

  -- Nếu là Admin, mặc nhiên có tất cả các quyền
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Kiểm tra xem quyền yêu cầu có trong mảng permissions không
  RETURN perm_required = ANY(user_perms);
END;
$$ LANGUAGE plpgsql STABLE;

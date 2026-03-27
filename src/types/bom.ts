export interface Material {
  id: string;
  type: string;          // Loại vật tư
  specification: string; // Thông số kỹ thuật
  unit: string;          // Đơn vị
  price: number;         // Giá
  supplier?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
  created_at?: string;
}

export interface BOM {
  id: string;
  product_id: string;
  version: number;
  is_active: boolean;
  note: string;
  created_at?: string;
  product?: Product;
}

export interface BOMMaterial {
  id: string;
  bom_id: string;
  material_id: string;
  qty: number;
  scrap_rate: number;
  material?: Material;
}

export interface Operation {
  id: string;
  type: string;          // Loại công đoạn/gia công
  specification: string; // Thông số kỹ thuật
  unit: string;          // Đơn vị
  price: number;         // Giá
  supplier?: string;
  created_at?: string;
}

export interface BOMOperation {
  id: string;
  bom_id: string;
  operation_id: string;
  sequence: number;
  operation?: Operation;
}

export interface BOMCostSnapshot {
  id: string;
  bom_id: string;
  material_cost: number;
  operation_cost: number;
  total_cost: number;
  created_at: string;
}

export interface BOMWithDetails extends BOM {
  bom_materials: BOMMaterial[];
  bom_operations: BOMOperation[];
}

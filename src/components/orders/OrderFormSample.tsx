"use client";

import React, { useState, useEffect } from "react";
import { getCustomerDefaultProducts, getAllCustomers } from "@/services/customer.service";
import { getAllProducts } from "@/services/product.service";

/**
 * COMPONENT MẪU: FORM TẠO ĐƠN HÀNG (ORDER FORM)
 * Logic:
 * 1. Chọn Customer -> Tự động load Default Products vào Table.
 * 2. Cho phép sửa Số lượng, Xóa bớt.
 * 3. Nút "+" để thêm sản phẩm thủ công từ Library.
 * 4. Tự động đánh dấu is_custom_added = true cho hàng thêm thủ công.
 */

interface OrderItem {
  id?: string; // Tạm thời để quản lý UI
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  isCustomAdded: boolean;
}

export default function OrderForm() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Load danh sách ban đầu
  useEffect(() => {
    const loadData = async () => {
      const custs = await getAllCustomers();
      const prods = await getAllProducts();
      setCustomers(custs);
      setAllProducts(prods);
    };
    loadData();
  }, []);

  // Xử lý khi chọn Khách hàng
  const handleCustomerChange = async (customerId: string) => {
    setSelectedCustomerId(customerId);
    
    if (!customerId) {
      setItems([]);
      return;
    }

    // Gọi Service lấy sản phẩm mặc định
    const defaults = await getCustomerDefaultProducts(customerId);
    
    const mappedDefaults: OrderItem[] = defaults.map((d: any) => ({
      productId: d.productId,
      sku: d.product?.sku || 'N/A',
      name: d.product?.name || 'Sản phẩm',
      quantity: d.defaultQuantity || 1,
      isCustomAdded: false,
    }));

    setItems(mappedDefaults);
  };

  // Thêm sản phẩm thủ công
  const addProductManually = (product: any) => {
    const newItem: OrderItem = {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      quantity: 1,
      isCustomAdded: true, // Tự động đánh dấu là hàng thêm ngoài mặc định
    };
    setItems([...items, newItem]);
    setIsAdding(false);
  };

  // Xóa sản phẩm
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Cập nhật số lượng
  const updateQuantity = (index: number, qty: number) => {
    const newItems = [...items];
    newItems[index].quantity = qty;
    setItems(newItems);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
        Tạo Đơn Hàng Mới
      </h1>

      {/* CHỌN KHÁCH HÀNG */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-slate-400 mb-2">Khách hàng</label>
        <select 
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          value={selectedCustomerId}
          onChange={(e) => handleCustomerChange(e.target.value)}
        >
          <option value="">-- Chọn khách hàng --</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <p className="mt-2 text-xs text-slate-500 italic">* Hệ thống sẽ tự nạp danh sách sản phẩm mặc định khi bạn chọn khách hàng.</p>
      </div>

      {/* BẢNG SẢN PHẨM TRONG ĐƠN */}
      <div className="bg-slate-800 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-700 text-slate-300 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">SKU / Tên sản phẩm</th>
              <th className="px-6 py-4">Số lượng</th>
              <th className="px-6 py-4 text-center">Loại</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-750 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.sku}</div>
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="number" 
                    className="w-20 bg-slate-900 border border-slate-600 rounded p-1 text-center"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  {item.isCustomAdded ? (
                    <span className="px-2 py-1 text-[10px] bg-amber-500/20 text-amber-500 rounded-full border border-amber-500/30">
                      THÊM TAY
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-[10px] bg-emerald-500/20 text-emerald-500 rounded-full border border-emerald-500/30">
                      MẶC ĐỊNH
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => removeItem(index)}
                    className="text-rose-500 hover:text-rose-400 font-bold"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500 italic">
                  Chưa có sản phẩm nào được chọn (hoặc KH chưa có sản phẩm mẫu).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* NÚT THÊM MỚI TÙY CHỈNH */}
      <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-700">
        <span className="text-sm text-slate-400">Bạn muốn thêm sản phẩm khác?</span>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg active:scale-95"
        >
          <span className="text-lg">+</span> Thêm sản phẩm thủ công
        </button>
      </div>

      {/* FOOTER ACTION */}
      <div className="mt-10 flex gap-4">
        <button className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-all">
          LƯU NHÁP
        </button>
        <button className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-bold shadow-xl shadow-blue-900/40 transition-all">
          XÁC NHẬN ĐƠN HÀNG
        </button>
      </div>

      {/* MODAL CHỌN SẢN PHẨM */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Tất cả sản phẩm</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {allProducts.map(p => (
                <div 
                  key={p.id}
                  onClick={() => addProductManually(p)}
                  className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-all border border-slate-700"
                >
                  {p.name} ({p.sku})
                </div>
              ))}
              {allProducts.length === 0 && (
                <p className="text-center text-slate-500 py-4">Chưa có sản phẩm nào trong kho.</p>
              )}
            </div>
            <button 
              onClick={() => setIsAdding(false)}
              className="mt-6 w-full py-2 text-slate-400 hover:text-white transition-all"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

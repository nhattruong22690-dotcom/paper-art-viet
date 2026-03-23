"use client";

import React from "react";
// Giả định thư viện qrcode.react đã được cài đặt (npm install qrcode.react)
// import { QRCodeSVG } from 'qrcode.react';

/**
 * COMPONENT MẪU: NHÃN DÁN THÙNG (PRINT LABEL)
 * Thiết kế tối giản, trắng đen, tối ưu cho máy in tem nhiệt/laser tại kho.
 * Sử dụng CSS Print để khi nhấn Ctrl+P chỉ in vùng nhãn.
 */

interface PrintLabelProps {
  packageData: {
    packageCode: string;
    customerName: string;
    items: { name: string; sku: string; quantity: number }[];
  } | null;
  onBack: () => void;
}

export default function PrintLabel({ packageData, onBack }: PrintLabelProps) {
  if (!packageData) return null;

  return (
    <div className="min-h-screen bg-white p-4 sm:p-10 flex flex-col items-center">
      
      {/* Nút điều khiển (Sẽ ẩn khi in) */}
      <div className="print:hidden w-full max-w-md mb-8 flex gap-4">
        <button 
          onClick={onBack}
          className="flex-1 py-3 border border-slate-300 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-all"
        >
          ← Quay lại
        </button>
        <button 
          onClick={() => window.print()}
          className="flex-1 py-3 bg-black text-white rounded-lg font-bold shadow-lg hover:bg-slate-800 transition-all"
        >
          🖨️ IN NHÃN NGAY
        </button>
      </div>

      {/* VÙNG IN NHÃN (LABEL AREA) */}
      <div className="w-[100mm] min-h-[150mm] border-[2px] border-black p-6 flex flex-col font-sans text-black bg-white">
        
        {/* Header: Company Logo/Name Placeholder */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-black uppercase tracking-widest text-black">PAPER ART VIET</h1>
          <p className="text-[10px] italic">Premium Handmade Paper Products</p>
        </div>

        {/* QR CODE & PACKAGE CODE */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 bg-slate-100 flex items-center justify-center border border-slate-300 mb-2">
            {/* <QRCodeSVG value={packageData.packageCode} size={110} /> */}
            <div className="text-[10px] text-center px-4">[QR CODE: {packageData.packageCode}]</div>
          </div>
          <div className="text-xl font-mono font-black border-2 border-black px-4 py-1">
            {packageData.packageCode}
          </div>
        </div>

        {/* CUSTOMER INFO */}
        <div className="mb-6">
          <div className="text-[10px] font-bold uppercase text-slate-600">Khách hàng / Customer:</div>
          <div className="text-lg font-bold truncate border-b border-black pb-1 uppercase italic">
            {packageData.customerName}
          </div>
        </div>

        {/* ITEM LIST */}
        <div className="flex-1">
          <div className="text-[10px] font-bold uppercase text-slate-600 mb-2">Danh sách sản phẩm / Packing List:</div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-[1.5px] border-black font-bold text-[11px]">
                <th className="pb-1">Mô tả / Description</th>
                <th className="pb-1 text-right">SL / Qty</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {packageData.items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="py-2 pr-2">
                    <div className="font-bold uppercase leading-tight">{item.name}</div>
                    <div className="text-[9px] font-mono">{item.sku}</div>
                  </td>
                  <td className="py-2 text-right font-black text-sm align-top">
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="mt-8 pt-4 border-t-2 border-dashed border-black flex justify-between items-end italic">
          <div className="text-[8px]">
            Ngày in: {new Date().toLocaleDateString('vi-VN')} <br />
            Phần mềm quản lý xưởng XINH
          </div>
          <div className="text-[10px] font-bold">TRÂN TRỌNG / THANK YOU!</div>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          body { padding: 0; margin: 0; }
          .min-h-screen { background: white !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}

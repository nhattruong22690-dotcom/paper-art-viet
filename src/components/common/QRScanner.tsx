"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, RefreshCw } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  title?: string;
}

export default function QRScanner({ onScan, onClose, title = "Quét mã QR" }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Tự động khởi chạy scanner khi component mount
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
        onClose();
      },
      (errorMessage) => {
        // Redundant noise usually, but can be logged
        // console.warn(errorMessage);
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600">
                 <Camera size={20} />
              </div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight italic">
                 {title}
              </h2>
           </div>
           
           <button onClick={onClose} className="p-2.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-400 transition-all">
              <X size={20} />
           </button>
        </div>

        {/* Scanner Body */}
        <div className="p-6 flex flex-col items-center justify-center">
           <div id="qr-reader" className="w-full max-w-[350px] overflow-hidden rounded-2xl border-4 border-primary-100 shadow-inner bg-black aspect-square" />
           
           <div className="mt-6 text-center">
              <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Hướng dẫn</p>
              <p className="text-xs text-gray-600 font-bold max-w-[250px]">
                Đưa mã QR của vật tư hoặc lệnh sản xuất vào giữa khung hình để quét tự động.
              </p>
           </div>
           
           {error && (
             <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 text-[10px] text-red-600 font-bold flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin" />
                Lỗi camera: {error}
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-50 bg-gray-50/30 flex justify-center">
           <button 
             onClick={onClose}
             className="px-10 py-3.5 bg-gray-200 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-300 transition-all"
           >
              Đóng lại
           </button>
        </div>
      </div>
    </div>
  );
}

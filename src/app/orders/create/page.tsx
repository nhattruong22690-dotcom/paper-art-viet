"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import CreateSalesOrder from '@/components/orders/CreateSalesOrder';

export default function CreateOrderPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <CreateSalesOrder 
        isOpen={true} 
        onClose={() => router.push('/orders')} 
        onSuccess={() => router.push('/orders')} 
      />
    </div>
  );
}

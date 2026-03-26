"use client";

import React, { useState } from 'react';
import PurchaseOrderList from './PurchaseOrderList';
import PurchaseOrderForm from './PurchaseOrderForm';

export default function PurchaseManagement() {
  const [view, setView] = useState<'list' | 'create'>('list');

  if (view === 'create') {
    return (
      <PurchaseOrderForm 
        onBack={() => setView('list')} 
        onSuccess={() => setView('list')}
      />
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <PurchaseOrderList 
        onAddNew={() => setView('create')}
      />
    </div>
  );
}

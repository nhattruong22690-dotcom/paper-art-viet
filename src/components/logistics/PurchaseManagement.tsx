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
    <PurchaseOrderList 
      onAddNew={() => setView('create')}
    />
  );
}

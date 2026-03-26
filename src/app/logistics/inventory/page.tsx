import InventoryDashboard from '@/components/logistics/InventoryDashboard';

export default function InventoryPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <InventoryDashboard />
      </div>
    </div>
  );
}

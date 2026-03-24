import InventoryDashboard from '@/components/logistics/InventoryDashboard';

export const metadata = {
  title: 'Tồn kho thực tế | Paper Art Việt',
  description: 'Quản lý tồn kho vật tư và phụ kiện',
};

export default function InventoryPage() {
  return (
    <div className="p-8">
      <InventoryDashboard />
    </div>
  );
}

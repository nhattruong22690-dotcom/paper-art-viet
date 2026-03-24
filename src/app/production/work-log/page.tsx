import ProductionLogs from '@/components/production/ProductionLogs';

export const metadata = {
  title: 'Logs XS | Paper Art Việt',
  description: 'Lịch sử sản xuất vận hành hàng ngày',
};

export default function WorkLogPage() {
  return (
    <div className="p-8">
      <ProductionLogs />
    </div>
  );
}

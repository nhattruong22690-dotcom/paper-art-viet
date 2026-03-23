import MaterialInwardForm from '@/components/logistics/MaterialInwardForm';

export const metadata = {
  title: 'Nhập kho vật tư | Paper Art Việt',
  description: 'Ghi nhận vật tư mới nhập xưởng',
};

export default function InwardPage() {
  return (
    <div className="p-8 text-gray-800">
      <MaterialInwardForm />
    </div>
  );
}

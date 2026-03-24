import MaterialMasterList from '@/components/logistics/MaterialMasterList';

export const metadata = {
  title: 'Danh mục vật tư | Paper Art Việt',
  description: 'Từ điển nguyên vật liệu xưởng Paper Art',
};

export default function MaterialsPage() {
  return (
    <div className="p-8">
      <MaterialMasterList />
    </div>
  );
}

import ProductMaster from '@/components/production/ProductMaster';

export const metadata = {
  title: 'Danh mục sản phẩm | Paper Art Việt',
  description: 'Quản lý Master List & Định mức nguyên vật liệu (BOM)',
};

export default function ProductsPage() {
  return (
    <div className="p-8">
      <ProductMaster />
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { formatNumber } from '@/utils/format';
import { X, Trash2, Edit3, Edit, Save, Calendar, User, FileText, CheckCircle2, ChevronRight, ChevronDown, Plus, Factory, Zap, Briefcase, UserCheck, History, RotateCcw, Activity, Layers, RefreshCw, AlertTriangle, Package, Globe, Search, Download, PackageCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { getMilestoneTemplate } from '@/services/systemConfig.service';
import { getAllMaterials } from '@/services/material.service';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import ProductionOrderDetailModal from '@/components/production/ProductionOrderDetailModal';
import SplitProductionModal from './SplitProductionModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatMoney(amount: number, currency: string = 'VND') {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

interface OrderDetailsPanelProps {
  orderId: string | null;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

export default function OrderDetailsPanel({ orderId, onClose, onUpdate, onDelete }: OrderDetailsPanelProps) {
  const { showToast, showModal, confirm: customConfirm } = useNotification();
  const { profile } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [activeItemForSplit, setActiveItemForSplit] = useState<any>(null);
  const [selectedProductionOrder, setSelectedProductionOrder] = useState<any | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [expandedSnapshotItems, setExpandedSnapshotItems] = useState<Record<string, boolean>>({});
  const [isProductionCollapsed, setIsProductionCollapsed] = useState(false);
  const [isMilestonesCollapsed, setIsMilestonesCollapsed] = useState(true);
  const [isMaterialsCollapsed, setIsMaterialsCollapsed] = useState(true);
  const [activeBOMs, setActiveBOMs] = useState<Record<string, any[]>>({});
  const [isLoadingBOMs, setIsLoadingBOMs] = useState(false);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);

  // BOM Editing States
  const [editingBomProductId, setEditingBomProductId] = useState<string | null>(null);
  const [tempBOMs, setTempBOMs] = useState<Record<string, any[]>>({});
  const [allMaterialsMaster, setAllMaterialsMaster] = useState<any[]>([]);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [materialSearchText, setMaterialSearchText] = useState('');

  const toggleSnapshot = (itemId: string) => {
    setExpandedSnapshotItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  useEffect(() => {
    // Luôn tắt chế độ chỉnh sửa khi đơn hàng thay đổi hoặc bảng bị đóng
    setIsEditing(false);
    if (orderId) {
      document.body.style.overflow = 'hidden';
      fetchOrder();
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [orderId]);

  useEffect(() => {
    if (isEditing && allProducts.length === 0) {
      fetch('/api/products')
        .then(res => res.json())
        .then(data => setAllProducts(data))
        .catch(err => console.error('Error fetching products:', err));
    }
  }, [isEditing]);
  useEffect(() => {
    if (orderId && allMaterialsMaster.length === 0) {
      getAllMaterials()
        .then(data => setAllMaterialsMaster(data || []))
        .catch(err => console.error('Error fetching materials:', err));
    }
  }, [orderId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_production': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'packing': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'shipping': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'archived': return 'bg-gray-800 text-white border-black shadow-sm';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const fetchOrder = async () => {
    setLoading(true);
    setOrder(null);
    setFetchError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();

      if (data.error) {
        setFetchError(data.error);
        return;
      }

      setOrder(data);
      // Initialize editData without relational objects that shouldn't be in update payload
      const { id: order_id, customer, productionOrders, packages, overallProgress, ...rest } = data;
      setEditData(rest);

      // Initial fetch for active BOMs
      fetchActiveBOMs(data.orderItems || []);
    } catch (error: any) {
      console.error('Fetch error:', error);
      setFetchError(error.message || 'Lỗi không xác định khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 5) FETCH ACTIVE BOMS (ALWAYS OVERRIDING SNAPSHOT)
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchActiveBOMs = async (items: any[], force: boolean = false) => {
    // Collect all valid product IDs in this order
    const productIdsToFetch = Array.from(new Set(items
      .map((item: any) => item.productId)
      .filter(pId => pId && (force || !activeBOMs[pId])))); // fetch missing or force refresh

    if (productIdsToFetch.length === 0) return;

    try {
      setIsLoadingBOMs(true);
      const res = await fetch('/api/bom/active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds: productIdsToFetch })
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch BOMs: ${res.statusText}`);
      }

      const bomData = await res.json();

      if (bomData && Array.isArray(bomData)) {
        const newMappedBOMs: Record<string, any[]> = {};

        // Trải đều để đảm bảo TẤT CẢ các productIds được đánh dấu là "đã fetch" kể cả khi bằng rỗng (ngăn infinite fetch)
        productIdsToFetch.forEach((pId: string) => {
          newMappedBOMs[pId] = [];
        });

        bomData.forEach((selectedBOM: any) => {
          const pId = selectedBOM.product_id;
          newMappedBOMs[pId] = (selectedBOM.bom_materials || []).map((bm: any) => ({
            material_sku: bm.materials?.code || '---',
            material_name: bm.materials?.name || '---',
            specification: bm.materials?.specification || '',
            qty: Number(bm.qty) || 0,
            unit: bm.materials?.unit || ''
          }));
        });
        setActiveBOMs(prev => ({ ...prev, ...newMappedBOMs }));
      }
    } catch (err) {
      console.error('Error in fetchActiveBOMs:', err);
    } finally {
      setIsLoadingBOMs(false);
    }
  };

  // Auto-fetch active BOMs when items change
  useEffect(() => {
    const itemsSource = isEditing ? editData.orderItems : order?.orderItems;
    if (itemsSource && itemsSource.length > 0) {
      fetchActiveBOMs(itemsSource);
    }
  }, [editData?.orderItems, order?.orderItems, isEditing]);

  const handleSave = async () => {
    try {
      const changes = generateDiffLog(order, editData);

      const payload: any = {
        ...editData,
        estimated_stages: editData.estimatedStages, // Map back to snake_case
        currency: editData.currency || 'VND'
      };

      if (changes.length > 0) {
        const timestamp = new Intl.DateTimeFormat('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).format(new Date());

        payload.newLog = {
          person: profile?.name || 'Quản trị viên',
          time: timestamp,
          message: changes.join('; ')
        };
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
      }

      setIsEditing(false);
      showToast('success', 'Đã lưu thay đổi đơn hàng');
      onUpdate();
      fetchOrder();
    } catch (error) {
      console.error('Update error:', error);
      showToast('error', 'Lỗi khi cập nhật đơn hàng');
    }
  };

  const generateDiffLog = (oldData: any, newData: any) => {
    const changes: string[] = [];

    if (oldData.status !== newData.status) {
      const statusMap: any = { new: 'Mới', in_production: 'Sản xuất', packing: 'Đóng gói', shipping: 'Giao hàng', completed: 'Hoàn tất' };
      changes.push(`Trạng thái: ${statusMap[oldData.status] || oldData.status} -> ${statusMap[newData.status] || newData.status}`);
    }

    if (oldData.currency !== newData.currency) {
      changes.push(`Tiền tệ: ${oldData.currency || 'VND'} -> ${newData.currency}`);
    }

    const oldDeadline = oldData.deadlineDelivery?.slice(0, 10);
    const newDeadline = newData.deadlineDelivery?.slice(0, 10);
    if (oldDeadline !== newDeadline) {
      changes.push(`Hạn giao: ${oldDeadline || '---'} -> ${newDeadline}`);
    }

    if (oldData.notes !== newData.notes) {
      changes.push(`Ghi chú đã thay đổi`);
    }

    // Comparing items
    const oldItems = oldData.orderItems || [];
    const newItems = newData.orderItems || [];

    newItems.forEach((ni: any) => {
      const oi = oldItems.find((i: any) => i.id === ni.id);
      if (!oi) {
        changes.push(`Thêm SP: ${ni.product?.name || 'Sản phẩm mới'} (${ni.quantity})`);
      } else {
        if (oi.quantity !== ni.quantity) {
          changes.push(`SL [${ni.product?.name || '?'}]: ${oi.quantity} -> ${ni.quantity}`);
        }
        if (Number(oi.price) !== Number(ni.price)) {
          changes.push(`Giá [${ni.product?.name || '?'}]: ${formatMoney(Number(oi.price), oldData.currency)} -> ${formatMoney(Number(ni.price), newData.currency)}`);
        }
      }
    });

    oldItems.forEach((oi: any) => {
      if (!newItems.find((ni: any) => ni.id === oi.id)) {
        changes.push(`Xóa SP: ${oi.product?.name}`);
      }
    });

    return changes;
  };

  const toggleMilestone = async (milestoneId: string) => {
    const updatedStages = (order.estimatedStages || []).map((m: any) => {
      if (m.id !== milestoneId) return m;

      let nextStatus = m.status || 'pending';
      let isCompleted = m.isCompleted;
      let completedAt = m.completedAt;

      // Logic chuyển đổi trạng thái: Chờ xử lý -> Đang thực hiện -> Hoàn thành -> Chờ xử lý
      if (isCompleted) {
        nextStatus = 'pending';
        isCompleted = false;
        completedAt = null;
      } else if (nextStatus === 'pending') {
        nextStatus = 'in_progress';
      } else if (nextStatus === 'in_progress') {
        nextStatus = 'completed';
        isCompleted = true;
        completedAt = new Date().toISOString().split('T')[0];
      }

      return { ...m, status: nextStatus, isCompleted, completedAt };
    });

    // Cập nhật UI ngay lập tức
    setOrder({ ...order, estimatedStages: updatedStages });
    setEditData({ ...editData, estimatedStages: updatedStages });

    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimated_stages: updatedStages }),
      });
      onUpdate();
    } catch (error) {
      console.error('Toggle milestone error:', error);
      showToast('error', 'Không thể cập nhật trạng thái công đoạn');
    }
  };

  const getMilestoneStatus = (m: any) => {
    // Nếu không có thời hạn thì để trống theo yêu cầu
    if (!m.deadline) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(m.deadline);
    const completedAt = m.completedAt ? new Date(m.completedAt) : null;

    // Nếu đã xong nhưng ngày HT thực tế trễ hơn thời hạn -> Trễ
    if (m.isCompleted && completedAt && completedAt > deadline) {
      return 'late';
    }

    // Nếu đã xong và đúng hạn -> Hoàn thành
    if (m.isCompleted) return 'completed';

    // Nếu chưa xong nhưng đã quá ngày hiện tại -> Trễ
    if (deadline < today) return 'late';

    return m.status || 'pending';
  };

  const getStatusConfig = (status: string | null) => {
    if (!status) return null;
    switch (status) {
      case 'late': return { label: 'TRỄ HẠN', bg: 'bg-[#FEE2E2]' };
      case 'completed': return { label: 'HOÀN THÀNH', bg: 'bg-[#D1FAE5]' };
      case 'in_progress': return { label: 'ĐANG LÀM', bg: 'bg-[#D8B4FE]' };
      default: return { label: 'CHỜ XỬ LÝ', bg: 'bg-[#FEF3C7]' };
    }
  };

  const handleUpdateProductionOrder = async (id: string, updates: any) => {
    try {
      const res = await fetch('/api/production/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      if (res.ok) {
        showToast('success', 'Đã cập nhật lệnh sản xuất thành công');
        onUpdate();
        // Cập nhật state local nếu cần
        if (selectedProductionOrder && selectedProductionOrder.id === id) {
          setSelectedProductionOrder({ ...selectedProductionOrder, ...updates });
        }
      }
    } catch (err) {
      console.error("Failed to update production order:", err);
      showToast('error', 'Cập nhật thất bại');
    }
  };

  const handleDeleteProductionOrder = async (id: string) => {
    if (!await customConfirm("BẠN CÓ CHẮC CHẮN MUỐN XÓA LỆNH NÀY?\n\nToàn bộ ghi nhận sản lượng (Work Logs) liên quan sẽ bị xóa vĩnh viễn và số liệu hoàn thành sẽ quay về 0.")) return;

    try {
      const res = await fetch(`/api/production/orders?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Đã xóa lệnh sản xuất thành công');
        setSelectedProductionOrder(null);
        onUpdate();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Xóa thất bại');
      }
    } catch (err: any) {
      console.error("Failed to delete production order:", err);
      showToast('error', `Không thể xóa: ${err.message}`);
    }
  };

  const handleStatusChangeProductionOrder = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/production/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        onUpdate();
        if (selectedProductionOrder && selectedProductionOrder.id === id) {
          setSelectedProductionOrder({ ...selectedProductionOrder, status: newStatus as any });
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDelete = async () => {
    const poCount = order.productionOrders?.length || 0;
    const message = poCount > 0
      ? `Đơn hàng này đang có ${poCount} Lệnh sản xuất đang chạy. Bạn có muốn xóa đơn hàng và HỦY toàn bộ các lệnh liên quan không?`
      : 'Bạn có chắc chắn muốn xóa đơn hàng này?';

    if (await customConfirm(message)) {
      try {
        await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
        showToast('success', 'Đã xóa đơn hàng thành công');
        onDelete();
      } catch (error) {
        showModal('error', 'Lỗi khi xóa đơn hàng', String(error));
        console.error('Delete error:', error);
      }
    }
  };

  const handleArchive = async () => {
    if (!order) return;
    
    // Kiểm tra xem tất cả các lệnh sản xuất đã hoàn thành chưa
    const unfinishedPOs = order.productionOrders?.filter((po: any) => po.currentStatus !== 'Completed' && po.currentStatus !== 'Archived') || [];
    const isUnfinished = unfinishedPOs.length > 0;
    
    let message = "XÁC NHẬN HOÀN TẤT & LƯU TRỮ\n\nĐơn hàng này sẽ được chuyển vào 'KHO LƯU TRỮ' và không còn xuất hiện ở danh sách đang làm việc nữa. Bạn có chắc chắn muốn hoàn tất?";
    
    if (isUnfinished) {
      message = "⚠️ CẢNH BÁO: ĐƠN HÀNG CHƯA HOÀN THÀNH\n\nĐơn hàng này vẫn còn " + unfinishedPOs.length + " lệnh sản xuất đang chạy (chưa Hoàn tất). Việc lưu trữ sẽ làm các lệnh này biến mất khỏi màn hình điều phối chính. Bạn có chắc chắn muốn tiếp tục lưu trữ không?";
    }

    if (await customConfirm(message)) {
      try {
        const res = await fetch(`/api/orders/${order.id}/archive`, { method: 'POST' });
        if (!res.ok) throw new Error('Cập nhật thất bại');
        
        showToast('success', 'Đã lưu trữ đơn hàng thành công');
        onUpdate();
        onClose();
      } catch (error) {
        showModal('error', 'Lỗi khi lưu trữ đơn hàng', String(error));
        console.error('Archive error:', error);
      }
    }
  };

  const loadDefaultMilestones = async () => {
    try {
      const template = await getMilestoneTemplate();
      if (!template || !Array.isArray(template) || template.length === 0) {
        showToast('error', 'Chưa có cấu hình thời hạn mặc định trong Cài đặt');
        return;
      }

      const newMilestones = template.map(item => ({
        id: item.id || Math.random().toString(36).substr(2, 9),
        label: item.label,
        deadline: '',
        isCompleted: false
      }));

      setEditData({ ...editData, estimatedStages: newMilestones });
      showToast('success', `Đã tải ${newMilestones.length} công đoạn mặc định`);
    } catch (err) {
      console.error(err);
      showToast('error', 'Lỗi khi tải dữ liệu mặc định');
    }
  };

  const getItemProgress = (productId: string, orderItemQuantity: number, orderItemId?: string) => {
    const itemPOs = order.productionOrders?.filter((po: any) => {
      // Ưu tiên lọc theo order_item_id nếu có
      if (orderItemId && (po.orderItemId || po.order_item_id)) {
        return (po.orderItemId || po.order_item_id) === orderItemId;
      }
      // Fallback về productId (cho các đơn cũ chưa có order_item_id)
      return po.productId === productId;
    }) || [];
    
    const totalAllocated = itemPOs.reduce((acc: number, po: any) => acc + (po.quantityTarget || 0), 0);
    const totalDone = itemPOs.reduce((acc: number, po: any) => acc + (po.quantityCompleted || 0), 0);
    const remaining = Math.max(0, orderItemQuantity - totalAllocated);
    const percent = orderItemQuantity > 0 ? Math.round((totalDone / orderItemQuantity) * 100) : 0;
    
    const isSurplus = totalAllocated > orderItemQuantity || totalDone > orderItemQuantity;
    
    return { percent, totalDone, totalAllocated, remaining, pos: itemPOs, isSurplus };
  };

  const handleEditBOM = (productId: string, orderItemId: string) => {
    // Tìm snapshot hiện tại của item
    const item = order?.orderItems?.find((i: any) => i.id === orderItemId);
    const currentSnapshot = item?.bomSnapshot || [];
    const masterBom = activeBOMs[productId] || [];

    // Ưu tiên snapshot, nếu không có mới lấy master
    const initialBOM = currentSnapshot.length > 0 ? currentSnapshot : masterBom;

    setEditingBomProductId(productId);
    // Deep copy to avoid direct state mutation
    setTempBOMs({ [productId]: JSON.parse(JSON.stringify(initialBOM)) });
    setIsAddingMaterial(false);
  };

  const handleCancelBOM = () => {
    setEditingBomProductId(null);
    setTempBOMs({});
    setIsAddingMaterial(false);
  };

  const handleDeleteBOMMaterial = (productId: string, index: number) => {
    const current = [...(tempBOMs[productId] || [])];
    current.splice(index, 1);
    setTempBOMs({ ...tempBOMs, [productId]: current });
  };

  const handleBOMQtyChange = (productId: string, index: number, val: number) => {
    const current = [...(tempBOMs[productId] || [])];
    current[index] = { ...current[index], unit_qty: val, total_qty: val * (order.orderItems?.find((i: any) => i.productId === productId)?.quantity || 1) };
    setTempBOMs({ ...tempBOMs, [productId]: current });
  };

  const handleAddBOMMaterial = (productId: string, mat: any) => {
    const current = [...(tempBOMs[productId] || [])];

    // Kiểm tra trùng SKU
    const isDuplicate = current.some((m: any) => (m.sku || m.material_sku) === mat.code);
    if (isDuplicate) {
      showToast('error', `Vật tư ${mat.code} đã có trong danh sách`);
      return;
    }

    current.push({
      sku: mat.code,
      name: mat.name,
      specification: mat.specification || '',
      unit: mat.unit || '',
      unit_qty: 1,
      total_qty: order.orderItems?.find((i: any) => i.productId === productId)?.quantity || 1,
      isInvalid: false
    });
    setTempBOMs({ ...tempBOMs, [productId]: current });
    setIsAddingMaterial(false);
  };

  const handleSaveBOM = async (productId: string, orderItemId: string, manualMaterials?: any[]) => {
    if (!orderId) return;
    setIsSavingSnapshot(true);
    try {
      const bomData = manualMaterials || tempBOMs[productId] || [];
      const snapshots = [{
        orderItemId,
        snapshot: {
          bom_data: bomData.map((m: any) => ({
            material_sku: m.sku || m.material_sku,
            material_name: m.name || m.material_name,
            specification: m.specification || '',
            qty: Number(m.unit_qty || m.qty) || 0,
            unit: m.unit || ''
          })),
          saved_at: new Date().toISOString()
        }
      }];

      const res = await fetch(`/api/orders/${orderId}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshots })
      });

      if (!res.ok) throw new Error('Failed to update product BOM snapshot');

      showToast('success', 'Đã lưu cấu hình vật tư chi tiết');

      // Update local activeBOMs
      setActiveBOMs(prev => ({
        ...prev,
        [productId]: snapshots[0].snapshot.bom_data
      }));

      setEditingBomProductId(null);
      setTempBOMs({});
      fetchOrder(); // refresh mismatch data
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Lỗi: ' + err.message);
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  const aggregatedMaterials = useMemo(() => {
    const itemsSource = isEditing ? editData.orderItems : order?.orderItems;
    if (!itemsSource) return { groups: [], grandTotals: [], hasWarnings: false, hasInvalid: false };

    const groups: any[] = [];
    const totalsMap: Record<string, any> = {};
    let hasWarnings = false;
    let hasInvalid = false;

    itemsSource.forEach((item: any) => {
      // Ưu tiên bản sửa nháp (tempBOMs) > Snapshot (đã lưu) > Master (activeBOMs - mới nhất)
      const isCurrentlyEditing = editingBomProductId === item.productId;
      const snapshotBom = item.bomSnapshot || [];
      const masterBom = activeBOMs[item.productId] || [];

      let bomToUse: any[] = [];
      let sourceTag: 'draft' | 'snapshot' | 'master' = 'master';

      if (isCurrentlyEditing) {
        bomToUse = tempBOMs[item.productId] || [];
        sourceTag = 'draft';
      } else if (snapshotBom.length > 0) {
        bomToUse = snapshotBom;
        sourceTag = 'snapshot';
      } else {
        bomToUse = masterBom;
        sourceTag = 'master';
      }

      // Kiểm tra sự khác biệt so với Master để hiện cảnh báo
      const isMismatch = snapshotBom.length > 0 && masterBom.length > 0 && JSON.stringify(snapshotBom) !== JSON.stringify(masterBom);
      const isMissing = snapshotBom.length === 0 && masterBom.length > 0;

      if (isMismatch || isMissing) hasWarnings = true;

      const productMats = bomToUse.map((m: any) => {
        const itemQty = Number(item.quantity) || 0;
        const sku = m.sku || m.material_sku;
        const name = m.name || m.material_name;
        const isInvalidMat = !sku || sku === '---' || !name || name === '---';
        if (isInvalidMat) {
          hasInvalid = true;
          hasWarnings = true;
        }
        return {
          sku: sku,
          name: name,
          specification: m.specification,
          unit_qty: Number(m.unit_qty || m.qty) || 0,
          total_qty: (Number(m.unit_qty || m.qty) || 0) * itemQty,
          unit: m.unit,
          isInvalid: isInvalidMat
        };
      });

      groups.push({
        productId: item.productId,
        orderItemId: item.id,
        productName: item.product?.name || '---',
        productSku: item.product?.sku || '---',
        materials: productMats,
        isMismatch,
        isMissing,
        isEditing: isCurrentlyEditing,
        sourceTag
      });

      productMats.forEach((m: any) => {
        if (!totalsMap[m.sku]) {
          totalsMap[m.sku] = { name: m.name, specification: m.specification, qty: 0, unit: m.unit, isInvalid: m.isInvalid };
        }
        totalsMap[m.sku].qty += m.total_qty;
        if (m.isInvalid) totalsMap[m.sku].isInvalid = true;
      });
    });

    const grandTotals = Object.entries(totalsMap).map(([sku, data]: [string, any]) => ({
      sku,
      ...data
    })).sort((a, b) => a.sku.localeCompare(b.sku));

    return { groups, grandTotals, hasWarnings, hasInvalid };
  }, [order, isEditing, editData.orderItems, activeBOMs, editingBomProductId, tempBOMs]);

  // ─────────────────────────────────────────────────────────────────────────────
  // EXPORT: Phiếu Yêu Cầu Đặt Hàng
  // ─────────────────────────────────────────────────────────────────────────────
  const handleExportPurchaseRequest = () => {
    const totals = aggregatedMaterials.grandTotals;
    if (!totals || totals.length === 0) {
      showToast('error', 'Không có dữ liệu vật tư để xuất phiếu');
      return;
    }

    const orderCode = order?.contractCode || (orderId ? orderId.slice(-6).toUpperCase() : '---');
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    const requesterName = profile?.full_name || '';

    // Build worksheet data matching the template
    const wsData: any[][] = [
      // Row 1: Company header
      ['ĐỊA ĐIỂM KINH DOANH CÔNG TY TNHH PAPER ART VIỆT', '', '', '', '', ''],
      // Row 2: Address + Title
      ['E6 KDC Tân Tiến, phường Tân Thới Hiệp, Quận 12', '', 'PHIẾU YÊU CẦU ĐẶT HÀNG', '', '', ''],
      // Row 3: empty
      ['', '', '', '', '', ''],
      // Row 4: *Note
      ['*Note :', '', '', '', '', ''],
      // Row 5: Order info
      ['ĐƠN HÀNG', '', orderCode, '', 'Ngày', dateStr],
      // Row 6: Processing unit
      ['ĐƠN VỊ GIA CÔNG', '', '', '', '', ''],
      // Row 7: empty separator
      ['', '', '', '', '', ''],
      // Row 8: Table header
      ['STT', 'TÊN SẢN PHẨM', 'LOẠI GIẤY', 'KHỔ GIẤY', 'SỐ LƯỢNG', 'GHI CHÚ'],
    ];

    // Row 9+: Data rows
    totals.forEach((t: any, idx: number) => {
      wsData.push([
        idx + 1,
        t.name || '---',
        t.specification || '',
        '',
        t.qty || 0,
        ''
      ]);
    });

    // Pad empty rows to reach at least 12 data rows (like the template)
    const minRows = 12;
    const currentDataRows = totals.length;
    for (let i = currentDataRows; i < minRows; i++) {
      wsData.push(['', '', '', '', '', '']);
    }

    // Empty separator rows
    wsData.push(['', '', '', '', '', '']);
    wsData.push(['', '', '', '', '', '']);

    // Signature row
    wsData.push(['', 'Quản lý xác nhận', '', '', 'Bộ phận yêu cầu', '']);
    wsData.push(['', '', '', '', '', '']);
    wsData.push(['', '', '', '', '', '']);
    wsData.push(['', '', '', '', requesterName, '']);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths matching template
    ws['!cols'] = [
      { wch: 6 },   // A: STT
      { wch: 30 },  // B: TÊN SẢN PHẨM
      { wch: 28 },  // C: LOẠI GIẤY
      { wch: 14 },  // D: KHỔ GIẤY
      { wch: 14 },  // E: SỐ LƯỢNG
      { wch: 16 },  // F: GHI CHÚ
    ];

    // Merge cells for header
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },  // Company name
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },  // Address
      { s: { r: 1, c: 2 }, e: { r: 1, c: 4 } },  // Title
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Phiếu Đặt Hàng');
    XLSX.writeFile(wb, `Phieu_Dat_Hang_${orderCode}_${today.toISOString().split('T')[0]}.xlsx`);
    showToast('success', 'Đã xuất Phiếu Yêu Cầu Đặt Hàng');
  };

  return (
    <div className={`fixed inset-0 z-50 transition-opacity flex items-center justify-end ${orderId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .fluid-modal-container {
          width: 55vw !important;
          height: 95vh !important;
          max-height: 95vh !important;
          left: calc(280px + (100vw - 280px - 55vw) / 2) !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          right: auto !important;
          bottom: auto !important;
          position: fixed !important;
        }
        .fluid-text-xs { font-size: clamp(8px, 0.75vw, 12px) !important; }
        .fluid-text-sm { font-size: clamp(10px, 0.9vw, 14px) !important; }
        .fluid-text-base { font-size: clamp(12px, 1.1vw, 16px) !important; }
        .fluid-text-lg { font-size: clamp(14px, 1.3vw, 20px) !important; }
        .fluid-text-xl { font-size: clamp(18px, 1.6vw, 28px) !important; }
        .fluid-icon-sm { width: clamp(10px, 0.8vw, 14px) !important; height: clamp(10px, 0.8vw, 14px) !important; }
        .fluid-icon-md { width: clamp(14px, 1.2vw, 20px) !important; height: clamp(14px, 1.2vw, 20px) !important; }
        .fluid-icon-lg { width: clamp(18px, 1.5vw, 26px) !important; height: clamp(18px, 1.5vw, 26px) !important; }
      `}} />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />

      <div className={`
        fluid-modal-container
        bg-white shadow-2xl transition-all duration-500 transform 
        rounded-2xl border-[0.5px] border-black/15 overflow-hidden flex flex-col
        ${orderId ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
      `}>
        {loading ? (
          <div className="h-full flex items-center justify-center p-20 text-xs font-black uppercase tracking-widest text-gray-400 animate-pulse">
            Đang tải dữ liệu chi tiết...
          </div>
        ) : fetchError ? (
          <div className="h-full flex flex-col items-center justify-center p-10 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
              <X size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Không thể tải dữ liệu</h3>
            <p className="text-sm text-gray-500 max-w-xs mb-8">
              Đã xảy ra lỗi khi truy vấn thông tin đơn hàng từ máy chủ.
              <br />
              <span className="text-[10px] uppercase font-bold text-red-400 mt-2 block">Lỗi: {fetchError}</span>
            </p>
            <button
              onClick={fetchOrder}
              className="px-6 py-3 bg-foreground text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-primary transition-all"
            >
              Thử lại
            </button>
          </div>
        ) : order && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-white shrink-0">
              <div>
                <h2 className="fluid-text-lg font-bold text-foreground flex items-center gap-2">
                  <span className="bg-primary text-white px-2 py-0.5 rounded fluid-text-xs">#{order.contractCode || (orderId ? orderId.slice(-6).toUpperCase() : '---')}</span>
                  Chi tiết đơn hàng
                </h2>
                <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                  <p className="fluid-text-xs text-muted-foreground uppercase font-bold tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-100 shrink-0">Trạng thái: {order.status}</p>
                  <p className="fluid-text-xs text-primary uppercase font-bold tracking-widest bg-primary/5 px-2 py-0.5 rounded border border-primary/10 shrink-0">{order.currency || 'VND'}</p>
                  {order.contractCode && (
                    <p className="fluid-text-xs text-primary font-bold tracking-widest truncate">Số hợp đồng: {order.contractCode}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && order.status !== 'archived' && (
                  <>
                    <button
                      onClick={handleArchive}
                      className="flex items-center gap-2 px-3 py-1.5 bg-neo-yellow/10 text-amber-700 border border-amber-500/20 rounded-lg hover:bg-neo-yellow/20 transition-all font-bold fluid-text-xs uppercase tracking-widest"
                      title="Hoàn tất & Lưu trữ"
                    >
                      <PackageCheck className="fluid-icon-sm" /> Lưu trữ
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-neo-purple/10 text-primary border border-primary/20 rounded-lg hover:bg-neo-purple/20 transition-all font-bold fluid-text-xs uppercase tracking-widest"
                    >
                      <Edit3 className="fluid-icon-sm" /> Chỉnh sửa
                    </button>
                  </>
                )}
                <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 className="fluid-icon-md" />
                </button>
                <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all">
                  <X className="fluid-icon-lg" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="fluid-text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-1.5">
                      <User className="fluid-icon-sm" /> Khách hàng
                    </label>
                    <p className="fluid-text-sm font-bold text-foreground">{order.customer?.name || 'Vãng lai'}</p>
                  </div>
                  <div>
                    <div className="flex flex-col">
                      <span className="fluid-text-xs font-black text-black/40 uppercase tracking-widest leading-none mb-1">Hạn Giao Hàng</span>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editData.deadlineDelivery?.slice(0, 10)}
                          onChange={(e) => setEditData({ ...editData, deadlineDelivery: e.target.value })}
                          className="fluid-text-xs font-black px-2 py-1 rounded-md border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="fluid-icon-sm text-black/40" />
                          <span className="fluid-text-xs font-black text-black italic">
                            {order.deadlineDelivery ? new Date(order.deadlineDelivery).toLocaleDateString('vi-VN') : '---'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="fluid-text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-1.5">
                      <FileText className="fluid-icon-sm" /> Số hợp đồng
                    </label>
                    <p className="fluid-text-sm font-bold text-primary italic underline-offset-4 decoration-primary/30">
                      {order.contractCode || '---'}
                    </p>
                  </div>
                  <div>
                    <div className="flex flex-col">
                      <span className="fluid-text-xs font-black text-black/40 uppercase tracking-widest leading-none mb-1">Tiền tệ</span>
                      {isEditing ? (
                        <select
                          value={editData.currency || 'VND'}
                          onChange={(e) => setEditData({ ...editData, currency: e.target.value })}
                          className="fluid-text-xs font-black px-2 py-1 rounded-md border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold uppercase tracking-widest"
                        >
                          <option value="VND">VND</option>
                          <option value="USD">USD</option>
                        </select>
                      ) : (
                        <span className="fluid-text-sm font-bold text-foreground">{order.currency || 'VND'}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-col">
                      <span className="fluid-text-xs font-black text-black/40 uppercase tracking-widest leading-none mb-1">Trạng thái</span>
                      {isEditing ? (
                        <select
                          value={editData.status}
                          onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                          className="fluid-text-xs font-black px-2 py-1 rounded-md border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold uppercase tracking-widest"
                        >
                          <option value="new">Mới lên đơn</option>
                          <option value="in_production">Sản xuất</option>
                          <option value="packing">Đóng gói</option>
                          <option value="shipping">Giao hàng</option>
                          <option value="completed">Hoàn tất</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "fluid-text-xs font-black px-2 py-1 rounded border border-gray-200 uppercase tracking-widest",
                            getStatusColor(order.status)
                          )}>
                            {order.status === 'new' ? (
                              (() => {
                                const orderDate = new Date(order.createdAt || order.created_at);
                                const diffDays = (new Date().getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
                                return diffDays > 7 ? 'CHỜ XỬ LÝ' : 'Mới';
                              })()
                            ) :
                              order.status === 'in_production' ? 'Sản xuất' :
                                order.status === 'packing' ? 'Đóng gói' :
                                  order.status === 'shipping' ? 'Giao hàng' :
                                    order.status === 'completed' ? 'Hoàn tất' : 
                                      order.status === 'archived' ? 'Đã lưu trữ' : order.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-l-[0.5px] border-primary pl-3">
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => setIsProductionCollapsed(!isProductionCollapsed)}
                  >
                    <h3 className="fluid-text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Factory className={cn("fluid-icon-sm transition-transform duration-300", isProductionCollapsed && "rotate-12")} />
                      Mục sản xuất
                      <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full fluid-text-xs font-black border border-primary/10">
                        {(isEditing ? editData.orderItems : order.orderItems || []).length} sản phẩm
                      </span>
                    </h3>
                    <div className={cn(
                      "p-1.5 rounded-lg bg-gray-100/80 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-sm",
                      isProductionCollapsed ? "rotate-0" : "rotate-180"
                    )}>
                      <ChevronDown className="fluid-icon-sm" />
                    </div>
                  </div>
                  {isEditing && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newItems = [
                            ...(editData.orderItems || []),
                            { id: 'new-' + Math.random().toString(36).substr(2, 9), productId: '', quantity: 1, price: 0, product: { name: 'Sản phẩm mới...', sku: 'NEW' } }
                          ];
                          setEditData({ ...editData, orderItems: newItems });
                        }}
                        className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all shadow-sm"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                      <button
                        onClick={async () => {
                          if (await customConfirm('Bạn có chắc muốn xóa tất cả sản phẩm trong danh sách chỉnh sửa?')) {
                            setEditData({ ...editData, orderItems: [] });
                          }
                        }}
                        className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all shadow-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {!isProductionCollapsed && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {(isEditing ? editData.orderItems : order.orderItems || []).map((item: any) => {
                      const stats = getItemProgress(item.productId, item.quantity, item.id);
                      const isNewItem = String(item.id).startsWith('new-');
                      return (
                        <div key={item.id} className={cn(
                          "bg-white border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all divide-y divide-border border-l-8",
                          stats.totalDone >= item.quantity 
                            ? (stats.isSurplus ? "border-l-indigo-500" : "border-l-emerald-500")
                            : stats.totalDone > 0 ? "border-l-amber-500" : "border-l-slate-200"
                        )}>

                          {/* Main Item Info */}
                          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-primary/5 rounded border border-primary/10 flex items-center justify-center text-primary font-bold fluid-text-xs uppercase">
                                {item.product?.sku?.slice(-4) || 'NEW'}
                              </div>
                              <div>
                                <h4 className="fluid-text-sm font-bold text-foreground">
                                  {isEditing ? (
                                    <select
                                      className="bg-gray-50 border border-border rounded px-2 py-1 fluid-text-xs font-bold w-full max-w-[200px]"
                                      value={item.productId}
                                      onChange={(e) => {
                                        const selectedProd = allProducts.find(p => p.id === e.target.value);
                                        const newItems = editData.orderItems.map((oi: any) =>
                                          oi.id === item.id ? {
                                            ...oi,
                                            productId: e.target.value,
                                            product: { ...oi.product, name: selectedProd?.name || '---', sku: selectedProd?.code || '---' },
                                            price: selectedProd?.basePrice || oi.price,
                                            cogsAtOrder: selectedProd?.costPrice || oi.cogsAtOrder
                                          } : oi
                                        );
                                        setEditData({ ...editData, orderItems: newItems });
                                      }}
                                    >
                                      <option value="">-- Chọn sản phẩm --</option>
                                      {allProducts.map(p => (
                                        <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    item.product?.name
                                  )}
                                </h4>
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2">
                                  <div className="flex flex-col">
                                    <span className="fluid-text-xs text-muted-foreground font-bold uppercase tracking-widest">S.Lượng</span>
                                    <span className="fluid-text-xs font-bold text-foreground">{item.quantity} {item.product?.unit || 'Cái'}</span>
                                  </div>
                                  <div className="w-px h-6 bg-gray-100 hidden md:block" />
                                  <div className="flex flex-col">
                                    <span className="fluid-text-xs text-muted-foreground font-bold uppercase tracking-widest">Giá vốn (Chốt)</span>
                                    <span className="fluid-text-xs font-bold text-amber-600">{formatMoney(item.cogsAtOrder || 0, order.currency)}</span>
                                  </div>
                                  <div className="w-px h-6 bg-gray-100 hidden md:block" />
                                  <div className="flex flex-col">
                                    <span className="fluid-text-xs text-muted-foreground font-bold uppercase tracking-widest">Giá Deal</span>
                                    <span className="fluid-text-xs font-bold text-primary">{formatMoney(item.price || 0, order.currency)}</span>
                                  </div>
                                  <div className="w-px h-6 bg-gray-100 hidden md:block" />
                                  <div className="flex flex-col">
                                    <span className="fluid-text-xs text-muted-foreground font-bold uppercase tracking-widest">TG Sản xuất</span>
                                    <span className="fluid-text-xs font-bold text-foreground">{item.productionTimeStd || 0} Phút</span>
                                  </div>
                                  <div className="w-px h-6 bg-gray-100 hidden md:block" />
                                  <div className="flex flex-col">
                                    <span className="fluid-text-xs text-muted-foreground font-bold uppercase tracking-widest">Thành tiền</span>
                                    <span className="fluid-text-xs font-black text-foreground">{formatMoney(item.price * item.quantity, order.currency)}</span>
                                  </div>
                                </div>

                                {!isEditing && (
                                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dashed border-gray-100">
                                    <div className="flex flex-col">
                                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Đã phân bổ</span>
                                      <span className="text-[11px] font-bold text-green-600">{isNewItem ? '---' : stats.totalAllocated}</span>
                                    </div>
                                    <div className="w-px h-6 bg-gray-100" />
                                    <div className="flex flex-col">
                                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Đã xong</span>
                                      <span className="text-[11px] font-bold text-blue-600">{isNewItem ? '---' : stats.totalDone}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {isEditing ? (
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[8px] text-muted-foreground font-bold uppercase">SL</span>
                                    <input
                                      type="number"
                                      className="w-16 bg-gray-50 border border-border rounded p-1 text-[11px] font-bold text-right"
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value);
                                        const newItems = editData.orderItems.map((oi: any) =>
                                          oi.id === item.id ? { ...oi, quantity: isNaN(value) ? 0 : value } : oi
                                        );
                                        setEditData({ ...editData, orderItems: newItems });
                                      }}
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[8px] text-muted-foreground font-bold uppercase">Giá vốn</span>
                                    <input
                                      type="number"
                                      step="any"
                                      className="w-24 bg-gray-50 border border-border rounded p-1 text-[11px] font-bold text-right text-amber-600/60 italic"
                                      value={item.cogsAtOrder}
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value);
                                        const newItems = editData.orderItems.map((oi: any) =>
                                          oi.id === item.id ? { ...oi, cogsAtOrder: isNaN(value) ? 0 : value } : oi
                                        );
                                        setEditData({ ...editData, orderItems: newItems });
                                      }}
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[8px] text-muted-foreground font-bold uppercase">Giá Deal</span>
                                    <input
                                      type="number"
                                      className="w-24 bg-gray-50 border border-border rounded p-1 text-[11px] font-bold text-right"
                                      value={item.price}
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value);
                                        const newItems = editData.orderItems.map((oi: any) =>
                                          oi.id === item.id ? { ...oi, price: isNaN(value) ? 0 : value } : oi
                                        );
                                        setEditData({ ...editData, orderItems: newItems });
                                      }}
                                    />
                                  </div>
                                  <button
                                    onClick={() => {
                                      const newItems = editData.orderItems.filter((oi: any) => oi.id !== item.id);
                                      setEditData({ ...editData, orderItems: newItems });
                                    }}
                                    className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all border border-red-100 mt-3"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Tiến độ</p>
                                    <div className="flex items-center gap-1.5 justify-end">
                                       <p className={cn(
                                         "text-sm font-black italic",
                                         stats.totalDone >= item.quantity 
                                           ? (stats.isSurplus ? "text-indigo-600" : "text-emerald-600")
                                           : stats.totalDone > 0 ? "text-amber-600" : "text-slate-400"
                                       )}>
                                         {stats.totalDone} / {item.quantity}
                                       </p>
                                       <span className={cn(
                                         "text-[10px] font-bold",
                                         stats.percent >= 100 ? "text-green-500" : "text-primary"
                                       )}>
                                         ({stats.percent}%)
                                       </span>
                                     </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setActiveItemForSplit({
                                        ...item,
                                        deadlineDelivery: order.deadlineDelivery,
                                        productionOrders: stats.pos
                                      });
                                      setIsSplitModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-foreground text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all shadow-sm"
                                  >
                                    <Zap size={14} className="text-amber-400" /> Phân bổ
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Snapshot Details Section */}
                          {!isEditing && item.snapshot && (
                            <div className="px-5 py-3 bg-gray-50/50">
                              <div className="flex flex-col gap-3">
                                {item.snapshot && (
                                  <div className="border-b border-gray-200 pb-3 mb-1">
                                    <button
                                      onClick={() => toggleSnapshot(item.id)}
                                      className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-all"
                                    >
                                      {expandedSnapshotItems[item.id] ? <Activity size={12} /> : <FileText size={12} />}
                                      {expandedSnapshotItems[item.id] ? 'Ẩn định mức snapshot' : 'Xem định mức & công đoạn đã chốt'}
                                    </button>

                                    {expandedSnapshotItems[item.id] && (
                                      <div className="mt-3 p-4 bg-white border border-primary/20 rounded-xl shadow-inner animate-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          {/* BOM Snapshot */}
                                          <div className="space-y-3">
                                            <h5 className="text-[10px] font-black text-foreground flex items-center gap-2 uppercase tracking-tight">
                                              <Layers size={12} /> Định mức vật tư (BOM)
                                            </h5>
                                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                              {item.snapshot.bom_data?.length > 0 ? (
                                                item.snapshot.bom_data.map((m: any, idx: number) => (
                                                  <div key={idx} className="flex justify-between items-center text-[11px] p-2 bg-gray-50 rounded border border-gray-100">
                                                    <span className="font-bold text-gray-600">[{m.material_sku}] {m.material_name}</span>
                                                    <span className="font-black text-primary">{m.qty} {m.unit}</span>
                                                  </div>
                                                ))
                                              ) : <p className="text-[10px] italic text-muted-foreground">Không có dữ liệu BOM</p>}
                                            </div>
                                          </div>

                                          {/* Operations Snapshot */}
                                          <div className="space-y-3">
                                            <h5 className="text-[10px] font-black text-foreground flex items-center gap-2 uppercase tracking-tight">
                                              <Zap size={12} /> Công đoạn sản xuất
                                            </h5>
                                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                              {item.snapshot.operations_data?.length > 0 ? (
                                                item.snapshot.operations_data.map((o: any, idx: number) => (
                                                  <div key={idx} className="flex justify-between items-center text-[11px] p-2 bg-gray-50 rounded border border-gray-100">
                                                    <span className="font-bold text-gray-600 italic">#{o.sequence} {o.name}</span>
                                                    <span className="font-black text-emerald-600">{(o.price || 0).toLocaleString('vi-VN')} đ</span>
                                                  </div>
                                                ))
                                              ) : <p className="text-[10px] italic text-muted-foreground">Không có dữ liệu công đoạn</p>}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Financial & Production Snapshot */}
                                        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                                          <div className="flex flex-col">
                                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Giá vốn (Chốt)</span>
                                            <span className="text-[11px] font-bold text-amber-600">{formatMoney(item.snapshot.prices?.cost || 0, order.currency)}</span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Giá Niêm yết</span>
                                            <span className="text-[11px] font-bold text-foreground">{formatMoney(item.snapshot.prices?.base || 0, order.currency)}</span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">TG Sản xuất (Std)</span>
                                            <span className="text-[11px] font-bold text-foreground">{(item.snapshot.production_time_std || 0)} Phút</span>
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Giá Deal chốt</span>
                                            <span className="text-[11px] font-bold text-primary font-black">{formatMoney(item.price || 0, order.currency)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Production Orders Grid */}
                                {stats.pos.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {stats.pos.map((po: any) => (
                                      <div 
                                        key={po.id} 
                                        onClick={() => setSelectedProductionOrder({
                                          ...po,
                                          title: item.product?.name || 'Sản phẩm',
                                          customer: order.customer?.name || 'Khách lẻ',
                                          dueDate: order.deadline_delivery ? new Date(order.deadline_delivery).toLocaleDateString('vi-VN') : '---',
                                          contractCode: order.contract_code,
                                          sku: item.product?.sku || 'N/A',
                                          status: po.currentStatus,
                                          progress: po.progress !== undefined ? po.progress : (po.quantityTarget > 0 ? Math.round((po.quantityCompleted / po.quantityTarget) * 100) : 0)
                                        })}
                                        className="bg-white p-3 rounded border border-border flex items-center justify-between shadow-sm hover:shadow-md hover:border-primary/30 cursor-pointer transition-all group"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={`w-7 h-7 rounded flex items-center justify-center text-[9px] font-bold uppercase transition-transform group-hover:scale-110 ${po.allocationType === 'internal' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                            }`}>
                                            {po.allocationType === 'internal' ? 'X' : 'GC'}
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <p className="text-[10px] font-bold text-foreground uppercase">
                                                {po.workshop?.name || po.outsourcer?.name || po.assignedTo || 'Chưa gán'}
                                              </p>
                                              <span className="text-[8px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-black border border-gray-200 uppercase tracking-tighter">
                                                {po.productionCode}
                                              </span>
                                            </div>
                                            <p className="text-[9px] text-muted-foreground font-bold tracking-tight">
                                              HT: {po.quantityCompleted || 0} / {po.quantityTarget}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className={cn(
                                            "text-[10px] font-bold",
                                            po.currentStatus === 'completed' ? 'text-green-600' : 'text-primary'
                                          )}>
                                            {Math.round((po.quantityCompleted / po.quantityTarget) * 100)}%
                                          </span>
                                          <div className="w-12 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                            <div
                                              className={cn(
                                                "h-full transition-all duration-500",
                                                po.currentStatus === 'completed' ? 'bg-green-500' : 'bg-primary'
                                              )}
                                              style={{ width: `${Math.min(100, (po.quantityCompleted / po.quantityTarget) * 100)}%` }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-2 opacity-50">
                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest italic">Sản phẩm này chưa gán lệnh sản xuất</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION: MATERIAL REQUIREMENTS SUMMARY */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-l-[0.5px] border-amber-500 pl-3">
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => setIsMaterialsCollapsed(!isMaterialsCollapsed)}
                  >
                    <h3 className="fluid-text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Layers className={cn("fluid-icon-sm transition-transform duration-300", isMaterialsCollapsed && "rotate-12")} />
                      Tổng hợp Nguyên vật liệu cần sản xuất
                      <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full fluid-text-xs font-black border border-amber-200">
                        {aggregatedMaterials.grandTotals.length} loại vật tư
                      </span>
                    </h3>
                    <div className={cn(
                      "p-1.5 rounded-lg bg-gray-100/80 text-gray-500 group-hover:bg-amber-100 group-hover:text-amber-700 transition-all shadow-sm",
                      isMaterialsCollapsed ? "rotate-0" : "rotate-180"
                    )}>
                      <ChevronDown className="fluid-icon-sm" strokeWidth={3} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const items = isEditing ? editData.orderItems : order?.orderItems;
                        if (items) fetchActiveBOMs(items, true);
                      }}
                      disabled={isLoadingBOMs}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border rounded-lg fluid-text-xs font-bold hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                    >
                      <RefreshCw className={cn("fluid-icon-xs", isLoadingBOMs && "animate-spin")} />
                      Lấy dữ liệu BOM
                    </button>

                    {isLoadingBOMs && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg fluid-text-xs font-black uppercase text-amber-600 animate-pulse">
                        Đang đồng bộ...
                      </div>
                    )}
                  </div>
                </div>

                {!isMaterialsCollapsed && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Warning Banner */}
                    {aggregatedMaterials.hasInvalid && (
                      <div className="bg-red-50 border border-red-500 rounded-xl p-4 flex items-start gap-4 shadow-sm animate-pulse mb-3">
                        <div className="bg-red-500 text-white p-2 rounded-lg shrink-0 shadow-lg shadow-red-500/20">
                          <AlertTriangle className="fluid-icon-md" />
                        </div>
                        <div className="flex-1">
                          <h4 className="fluid-text-xs font-black uppercase tracking-widest text-red-800 mb-1 leading-none">Cảnh báo: Lỗi định mức vật tư</h4>
                          <p className="fluid-text-xs text-red-700 leading-relaxed font-black">
                            Phát hiện vật tư trong đơn hàng không tồn tại trong danh mục hệ thống hoặc dữ liệu bị thiếu (Mã/Tên).
                            Vui lòng kiểm tra các mục đánh dấu đỏ để tránh sai sót trong sản xuất.
                          </p>
                        </div>
                      </div>
                    )}

                    {aggregatedMaterials.hasWarnings && !aggregatedMaterials.hasInvalid && (
                      <div className="bg-amber-50 border border-amber-500 rounded-xl p-4 flex items-start gap-4 shadow-sm">
                        <div className="bg-amber-500 text-white p-2 rounded-lg shrink-0">
                          <AlertTriangle className="fluid-icon-md" />
                        </div>
                        <div className="flex-1">
                          <h4 className="fluid-text-xs font-black uppercase tracking-widest text-amber-800 mb-1">Dữ liệu chưa được lưu trong cơ sở dữ liệu (Snapshot)</h4>
                          <p className="fluid-text-xs text-amber-700 leading-relaxed font-bold">
                            Một số sản phẩm trong đơn hàng này chưa được chốt định mức vật tư.
                            Số lượng hiển thị bên dưới là dựa trên **định mức hiện tại** của sản phẩm và có thể thay đổi nếu bạn cập nhật BOM sản phẩm.
                            Hãy chủ động chốt (Snapshot) để cố định dữ liệu cho đơn hàng này.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Detail Items Grouped by Product */}
                    <div className="space-y-6">
                      {aggregatedMaterials.groups.length > 0 ? aggregatedMaterials.groups.map((group, idx) => (
                        <div key={idx} className="bg-white border-[0.5px] border-black/10 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
                          <div className="px-5 py-3 bg-gray-50/50 border-b border-black/15 flex items-center justify-between">
                            <h4 className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white border border-black/15 rounded-lg flex items-center justify-center text-primary shadow-sm font-black fluid-text-xs">
                                {idx + 1}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="fluid-text-xs font-bold text-muted-foreground uppercase leading-none">[{group.productSku}]</span>
                                  {group.sourceTag === 'snapshot' && (
                                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full fluid-text-[8px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1 shrink-0">
                                      <Save size={8} /> Theo Đơn
                                    </span>
                                  )}
                                  {group.sourceTag === 'draft' && (
                                    <span className="px-1.5 py-0.5 bg-neo-purple/10 text-primary rounded-full fluid-text-[8px] font-black uppercase tracking-widest border border-primary/20 flex items-center gap-1 shrink-0 animate-pulse">
                                      <Edit size={8} /> Phác thảo
                                    </span>
                                  )}
                                  {group.sourceTag === 'master' && (
                                    <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded-full fluid-text-[8px] font-black uppercase tracking-widest border border-gray-100 flex items-center gap-1 shrink-0">
                                      <Globe size={8} /> Mặc định
                                    </span>
                                  )}
                                </div>
                                <span className="fluid-text-sm font-black text-foreground">{group.productName}</span>
                              </div>
                            </h4>
                            <div className="flex items-center gap-2">
                              {group.isEditing ? (
                                <>
                                  <button
                                    onClick={handleCancelBOM}
                                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md fluid-text-xs font-bold hover:bg-gray-200 transition-all uppercase tracking-widest border border-gray-200"
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    onClick={() => handleSaveBOM(group.productId, group.orderItemId)}
                                    disabled={isSavingSnapshot}
                                    className="px-3 py-1 bg-primary text-white rounded-md fluid-text-xs font-bold hover:bg-primary-hover transition-all uppercase tracking-widest shadow-sm flex items-center gap-1.5"
                                  >
                                    <Save size={12} /> Lưu SP
                                  </button>
                                </>
                              ) : (
                                <>
                                  {(group.isMismatch || group.isMissing) && (
                                    <div className="flex items-center gap-2 px-2 py-1 bg-amber-50 rounded-full border border-amber-100">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                      <span className="fluid-text-xs text-amber-700 font-bold uppercase tracking-tighter">
                                        {group.isMissing ? "Chưa Snapshot" : "BOM Thay đổi"}
                                      </span>
                                    </div>
                                  )}
                                  {(group.isMismatch || group.isMissing) && (
                                    <button
                                      onClick={() => {
                                        // Lưu nhanh Master BOM thành Snapshot
                                        const masterBom = activeBOMs[group.productId] || [];
                                        handleSaveBOM(group.productId, group.orderItemId, masterBom);
                                      }}
                                      disabled={isSavingSnapshot}
                                      className="p-1 px-2.5 bg-amber-500 text-white border border-amber-600 rounded-md hover:bg-amber-600 transition-all font-bold fluid-text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-1.5"
                                    >
                                      <Save size={12} /> Lưu SP
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleEditBOM(group.productId, group.orderItemId)}
                                    className="p-1 px-2.5 bg-neo-purple/10 text-primary border border-primary/20 rounded-md hover:bg-neo-purple/20 transition-all font-bold fluid-text-[10px] uppercase tracking-widest"
                                  >
                                    Chỉnh sửa
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="thin-table w-full fluid-text-xs">
                              <thead>
                                <tr className="fluid-text-xs font-black uppercase tracking-widest text-muted-foreground">
                                  <th className="text-left w-32">Mã vật tư</th>
                                  <th className="text-left">Tên nguyên vật liệu</th>
                                  <th className="text-left">Thông số kỹ thuật</th>
                                  <th className="text-center w-28">Đơn vị</th>
                                  <th className="text-right w-32">Định mức</th>
                                  <th className="text-right w-36">Số lượng cần</th>
                                  {group.isEditing && <th className="w-12"></th>}
                                </tr>
                              </thead>
                              <tbody>
                                {group.materials.length > 0 ? group.materials.map((m: any, mIdx: number) => (
                                  <tr key={mIdx} className={cn("hover:bg-gray-50/50 transition-colors", m.isInvalid && "bg-red-50/30")}>
                                    <td className={cn("px-5 py-3 font-bold", m.isInvalid ? "text-red-500" : "text-primary")}>
                                      <div className="flex items-center gap-2">
                                        {m.isInvalid && <AlertTriangle size={14} className="shrink-0 text-red-500" />}
                                        {m.sku}
                                      </div>
                                    </td>
                                    <td className={cn("px-5 py-3 font-medium", m.isInvalid ? "text-red-600" : "text-foreground")}>
                                      {m.name}
                                      {m.isInvalid && <span className="block text-[8px] font-black uppercase text-red-400 mt-0.5 tracking-tighter">Vật tư không tồn tại hoặc thiếu bộ thông tin</span>}
                                    </td>
                                    <td className="px-5 py-3 fluid-text-xs text-muted-foreground italic truncate max-w-[200px]" title={m.specification}>
                                      {m.specification || '---'}
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                      <span className="px-2 py-0.5 bg-gray-100 rounded fluid-text-xs font-bold text-gray-600 uppercase italic whitespace-nowrap">{m.unit}</span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                      {group.isEditing ? (
                                        <input
                                          type="number"
                                          step="any"
                                          value={m.unit_qty}
                                          onChange={(e) => handleBOMQtyChange(group.productId, mIdx, Number(e.target.value))}
                                          className="w-full px-2 py-1 text-right border border-primary/20 rounded bg-white font-mono text-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                      ) : (
                                        <span className="font-mono text-gray-400">{formatNumber(m.unit_qty)}</span>
                                      )}
                                    </td>
                                    <td className={cn("px-5 py-3 text-right font-black fluid-text-sm", m.isInvalid ? "text-red-500" : "text-primary")}>{formatNumber(m.total_qty)}</td>
                                    {group.isEditing && (
                                      <td className="px-2 py-3 text-center">
                                        <button
                                          onClick={() => handleDeleteBOMMaterial(group.productId, mIdx)}
                                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                )) : (
                                  <tr>
                                    <td colSpan={6} className="px-5 py-8 text-center text-gray-400 italic fluid-text-xs uppercase font-bold tracking-widest">
                                      Sản phẩm này chưa set BOM
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>

                            {/* Manual Add Material UI */}
                            {group.isEditing && (
                              <div className="p-4 bg-gray-50 border-t border-black/10">
                                {!isAddingMaterial ? (
                                  <button
                                    onClick={() => setIsAddingMaterial(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-dashed border-primary/30 text-primary rounded-lg hover:bg-primary/5 transition-all font-bold fluid-text-xs uppercase tracking-widest w-full justify-center"
                                  >
                                    <Plus size={14} /> Thêm vật tư thủ công
                                  </button>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <div className="relative flex-1">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                          autoFocus
                                          type="text"
                                          placeholder="Tìm theo mã hoặc tên vật tư..."
                                          value={materialSearchText}
                                          onChange={(e) => setMaterialSearchText(e.target.value)}
                                          className="w-full pl-9 pr-4 py-2 bg-white border border-primary/20 rounded-lg outline-none focus:ring-2 focus:ring-primary/10 fluid-text-xs font-medium"
                                        />
                                      </div>
                                      <button
                                        onClick={() => {
                                          setIsAddingMaterial(false);
                                          setMaterialSearchText('');
                                        }}
                                        className="p-2 text-gray-400 hover:bg-gray-200 rounded-lg transition-all"
                                      >
                                        <X size={18} />
                                      </button>
                                    </div>

                                    {materialSearchText && (
                                      <div className="max-h-60 overflow-y-auto bg-white border border-black/10 rounded-lg shadow-xl custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                                        {allMaterialsMaster
                                          .filter(m =>
                                            m.code?.toLowerCase().includes(materialSearchText.toLowerCase()) ||
                                            m.name?.toLowerCase().includes(materialSearchText.toLowerCase()) ||
                                            m.specification?.toLowerCase().includes(materialSearchText.toLowerCase())
                                          )
                                          .slice(0, 10)
                                          .map((mat, mIdx) => (
                                            <div
                                              key={mIdx}
                                              onClick={() => {
                                                handleAddBOMMaterial(group.productId, mat);
                                                setMaterialSearchText('');
                                              }}
                                              className="p-3 hover:bg-primary/5 cursor-pointer border-b border-gray-50 last:border-0 flex items-center justify-between group"
                                            >
                                              <div className="flex flex-col">
                                                <span className="fluid-text-[10px] font-black text-primary uppercase leading-none mb-1">[{mat.code}]</span>
                                                <span className="fluid-text-xs font-bold text-foreground">{mat.name}</span>
                                                <span className="fluid-text-[10px] text-muted-foreground italic truncate max-w-[300px] mt-0.5">{mat.specification || '---'}</span>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                <span className="px-2 py-0.5 bg-gray-100 rounded fluid-text-[10px] font-black text-gray-500 uppercase">{mat.unit}</span>
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all">
                                                  <Plus size={14} />
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        {allMaterialsMaster.filter(m =>
                                          m.code?.toLowerCase().includes(materialSearchText.toLowerCase()) ||
                                          m.name?.toLowerCase().includes(materialSearchText.toLowerCase()) ||
                                          m.specification?.toLowerCase().includes(materialSearchText.toLowerCase())
                                        ).length === 0 && (
                                            <div className="p-8 text-center text-gray-400 italic fluid-text-xs font-bold uppercase tracking-widest">
                                              Không tìm thấy vật tư phù hợp
                                            </div>
                                          )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 opacity-50 flex flex-col items-center gap-3">
                          <Layers size={32} className="text-gray-300" />
                          <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Không có dữ liệu định mức cho đơn hàng này</p>
                        </div>
                      )}
                    </div>

                    {/* GRAND TOTAL SUMMARY CARD */}
                    <div className="bg-slate-900 text-white rounded-lg p-5 shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full translate-x-16 -translate-y-16 blur-2xl" />
                      <div className="flex items-center gap-4 mb-5 relative z-10">
                        <div className="w-10 h-10 bg-primary/20 border border-primary/30 text-primary rounded-lg flex items-center justify-center shadow-sm">
                          <Package className="fluid-icon-md" />
                        </div>
                        <div className="flex-1">
                          <h4 className="fluid-text-xs font-black uppercase text-white/40 tracking-[0.2em] leading-none mb-1">Consolidated Requirement</h4>
                          <p className="fluid-text-lg font-black italic uppercase italic leading-none">Tổng hợp Vật tư Toàn đơn</p>
                        </div>
                        <button
                          onClick={handleExportPurchaseRequest}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all font-bold fluid-text-xs uppercase tracking-widest shadow-lg border border-emerald-400 relative z-10"
                        >
                          <Download size={14} /> Xuất Phiếu Đặt Hàng
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
                        {aggregatedMaterials.grandTotals.map((t: any, idx: number) => (
                          <div key={idx} className={cn(
                            "p-4 border rounded-lg flex items-center justify-between transition-all group relative",
                            t.isInvalid
                              ? "bg-red-500/20 border-red-500/50 hover:bg-red-500/30"
                              : "bg-white/5 hover:bg-white/10 border-white/10"
                          )}>
                            {t.isInvalid && (
                              <div className="absolute top-1 right-1">
                                <AlertTriangle size={12} className="text-red-400 animate-pulse" />
                              </div>
                            )}
                            <div className="flex flex-col min-w-0 pr-4">
                              <span className={cn("fluid-text-xs font-bold uppercase leading-none mb-1", t.isInvalid ? "text-red-400" : "text-white/30")}>[{t.sku}]</span>
                              <span className={cn("fluid-text-sm font-black truncate max-w-[150px]", t.isInvalid ? "text-red-500" : "text-white")}>{t.name}</span>
                              <span className={cn("fluid-text-xs italic truncate max-w-[150px] mt-0.5", t.isInvalid ? "text-red-400/60" : "text-white/40")}>{t.specification || '---'}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={cn("block fluid-text-base font-black leading-none", t.isInvalid ? "text-red-500" : "text-primary")}>{formatNumber(t.qty)}</span>
                              <span className={cn("fluid-text-xs font-bold uppercase italic", t.isInvalid ? "text-red-400/40" : "text-white/20")}>{t.unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-l-[0.5px] border-amber-400 pl-3">
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => setIsMilestonesCollapsed(!isMilestonesCollapsed)}
                  >
                    <h3 className="fluid-text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Calendar className={cn("fluid-icon-sm transition-transform duration-300", isMilestonesCollapsed && "rotate-12")} />
                      Thời hạn các khâu dự tính
                      <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full fluid-text-xs font-black border border-amber-200">
                        {((isEditing ? editData.estimatedStages : order.estimatedStages || []).filter((m: any) => m.deadline || m.isCompleted || m.completedAt)).length} khâu
                      </span>
                    </h3>
                    <div className={cn(
                      "p-1.5 rounded-lg bg-gray-100/80 text-gray-500 group-hover:bg-amber-100 group-hover:text-amber-700 transition-all shadow-sm",
                      isMilestonesCollapsed ? "rotate-0" : "rotate-180"
                    )}>
                      <ChevronDown className="fluid-icon-sm" />
                    </div>
                  </div>
                  {isEditing && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={loadDefaultMilestones}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neo-blue/10 text-neo-blue rounded-lg hover:bg-neo-blue/20 border border-neo-blue/20 transition-all shadow-sm font-bold text-[9px] uppercase tracking-widest"
                        title="Tải từ cài đặt mặc định"
                      >
                        <RefreshCw size={12} strokeWidth={3} /> Tải mặc định
                      </button>
                      <button
                        onClick={() => {
                          const newMilestones = [
                            ...(editData.estimatedStages || []),
                            { id: Math.random().toString(36).substr(2, 9), label: '', deadline: '', isCompleted: false }
                          ];
                          setEditData({ ...editData, estimatedStages: newMilestones });
                        }}
                        className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 border border-amber-200 transition-all shadow-sm"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                      <button
                        onClick={async () => {
                          if (await customConfirm('Bạn có chắc muốn xóa tất cả các khâu dự tính?')) {
                            setEditData({ ...editData, estimatedStages: [] });
                          }
                        }}
                        className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all shadow-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {!isMilestonesCollapsed && (
                  <div className="bg-white border-[0.5px] border-black/10 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    <table className="thin-table w-full text-left text-xs border-separate border-spacing-y-0.5">
                      <thead>
                        <tr className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-gray-50/50">
                          <th className="px-4 py-2">Công đoạn</th>
                          <th className="w-40 text-center px-4 py-2">Đánh giá</th>
                          <th className="w-24 text-center px-4 py-2">Thời hạn</th>
                          <th className="w-24 text-center px-4 py-2">HT Thực tế</th>
                          <th className="w-16 text-center px-4 py-2">Xong</th>
                          {isEditing && <th className="w-10 px-4 py-2"></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {((isEditing ? editData.estimatedStages : order.estimatedStages) || [])
                          .filter((m: any) => isEditing || (m.deadline || m.isCompleted || m.completedAt))
                          .map((m: any) => {
                          const status = getMilestoneStatus(m);
                          const config = getStatusConfig(status);
                          
                          return (
                            <tr key={m.id} className={cn("transition-colors group", m.isCompleted ? "bg-green-50/20" : "hover:bg-gray-50/50")}>
                              <td className="px-4 py-3 font-bold text-foreground">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-xs font-bold"
                                    value={m.label}
                                    placeholder="Tên khâu..."
                                    onChange={(e) => {
                                      const newMilestones = editData.estimatedStages.map((ms: any) =>
                                        ms.id === m.id ? { ...ms, label: e.target.value } : ms
                                      );
                                      setEditData({ ...editData, estimatedStages: newMilestones });
                                    }}
                                  />
                                ) : (
                                  <div className="flex flex-col">
                                    <span className="text-xs">{m.label || '---'}</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {config && (
                                  <button
                                    onClick={() => !isEditing && toggleMilestone(m.id)}
                                    disabled={isEditing}
                                    style={{ 
                                      fontSize: 'clamp(8px, 0.6vw, 10px)',
                                      padding: 'clamp(3px, 0.4vw, 5px) 0',
                                      width: 'clamp(95px, 8vw, 120px)',
                                      border: '2px solid #000000'
                                    }}
                                    className={cn(
                                      "rounded-full font-bold uppercase tracking-widest transition-all duration-200 select-none shadow-[2px_2px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none whitespace-nowrap inline-flex items-center justify-center",
                                      config.bg,
                                      !isEditing && "hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#000000]"
                                    )}
                                  >
                                    {config.label}
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center tabular-nums font-bold text-muted-foreground">
                                {isEditing ? (
                                  <input
                                    type="date"
                                    className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-xs font-bold text-center"
                                    value={m.deadline}
                                    onChange={(e) => {
                                      const newMilestones = editData.estimatedStages.map((ms: any) =>
                                        ms.id === m.id ? { ...ms, deadline: e.target.value } : ms
                                      );
                                      setEditData({ ...editData, estimatedStages: newMilestones });
                                    }}
                                  />
                                ) : m.deadline ? new Date(m.deadline).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '---'}
                              </td>
                              <td className="px-4 py-3 text-center tabular-nums font-bold text-emerald-600">
                                {isEditing ? (
                                  <input
                                    type="date"
                                    className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-xs font-bold text-center text-emerald-600"
                                    value={m.completedAt || ''}
                                    onChange={(e) => {
                                      const newMilestones = editData.estimatedStages.map((ms: any) =>
                                        ms.id === m.id ? { ...ms, completedAt: e.target.value, isCompleted: !!e.target.value } : ms
                                      );
                                      setEditData({ ...editData, estimatedStages: newMilestones });
                                    }}
                                  />
                                ) : m.completedAt ? new Date(m.completedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '---'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center">
                                  <button
                                    onClick={() => !isEditing && toggleMilestone(m.id)}
                                    disabled={isEditing}
                                    className={cn(
                                      "w-5 h-5 rounded border flex items-center justify-center transition-all shadow-sm",
                                      m.isCompleted ? "bg-green-500 border-green-600 text-white" : "bg-white border-gray-300 hover:border-primary"
                                    )}
                                  >
                                    {m.isCompleted && <CheckCircle2 size={12} strokeWidth={4} />}
                                  </button>
                                </div>
                              </td>
                              {isEditing && (
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => {
                                      const newItems = editData.estimatedStages.filter((ms: any) => ms.id !== m.id);
                                      setEditData({ ...editData, estimatedStages: newItems });
                                    }}
                                    className="text-red-400 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="fluid-icon-sm" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                        {(!(isEditing ? editData.estimatedStages : order.estimatedStages) || (isEditing ? editData.estimatedStages : order.estimatedStages).length === 0) && (
                          <tr>
                            <td colSpan={isEditing ? 5 : 4} className="px-4 py-8 text-center text-gray-400 italic fluid-text-xs uppercase font-bold tracking-widest">
                              Chưa có dữ liệu khâu dự tính
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              <div className="bg-foreground text-white rounded-lg p-6 shadow-md relative overflow-hidden">
                <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div>
                    <p className="fluid-text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Giá trị đơn hàng</p>
                    <p className="fluid-text-xl font-bold text-white">{formatMoney((order.orderItems || []).reduce((acc: any, i: any) => acc + (Number(i.price) * i.quantity), 0), order.currency)}</p>
                  </div>
                  <div className="text-right">
                    <p className="fluid-text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Dự kiến lợi nhuận</p>
                    <p className="fluid-text-xl font-bold text-green-400">
                      {formatMoney((order.orderItems || []).reduce((acc: any, i: any) => acc + ((Number(i.price) - Number(i.cogsAtOrder || 0)) * i.quantity), 0), order.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="fluid-text-xs font-black text-gray-400 uppercase tracking-widest border-l-[1px] border-gray-300 pl-3">Ghi chú hợp đồng</label>
                <textarea
                  className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 fluid-text-sm font-medium outline-none focus:ring-2 focus:ring-primary-100 min-h-[100px]"
                  placeholder="Nhập ghi chú quan trọng cho đơn hàng này..."
                  value={editData.notes || ''}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              {/* Edit Logs Section */}
              <div className="space-y-4 pt-4 border-t border-dashed border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 border-[0.5px] border-black/10 rounded flex items-center justify-center text-muted-foreground">
                    <History className="fluid-icon-sm" />
                  </div>
                  <h3 className="fluid-text-xs font-black text-muted-foreground uppercase tracking-widest italic">Lịch sử chỉnh sửa</h3>
                </div>

                <div className="space-y-3">
                  {order.logs && order.logs.length > 0 ? [...order.logs].reverse().map((log: any, idx: number) => (
                    <div key={idx} className="bg-gray-50/50 p-4 rounded-xl border border-border/50 relative group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary rounded-full" />
                          <span className="fluid-text-xs font-black text-foreground uppercase">{log.person}</span>
                        </div>
                        <span className="fluid-text-xs font-bold text-muted-foreground tabular-nums">{log.time}</span>
                      </div>
                      <p className="fluid-text-xs font-medium text-muted-foreground leading-relaxed pl-4 border-l border-gray-200">
                        {log.message || 'Cập nhật thông tin đơn hàng'}
                      </p>
                    </div>
                  )) : (
                    <div className="bg-gray-50/30 p-8 rounded-xl border border-dashed border-gray-100 text-center">
                      <p className="fluid-text-xs font-bold text-gray-300 uppercase tracking-widest italic">Chưa có lịch sử thay đổi</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border bg-white shrink-0">
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditData(order);
                      }}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-bold transition-all uppercase tracking-widest fluid-text-xs flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="fluid-icon-sm" /> Hủy bỏ
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2 uppercase tracking-widest fluid-text-xs"
                    >
                      <Save className="fluid-icon-sm" /> Lưu thay đổi
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold shadow-sm transition-all uppercase tracking-widest fluid-text-xs"
                  >
                    Đóng chi tiết
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <SplitProductionModal
        isOpen={isSplitModalOpen}
        onClose={() => {
          setIsSplitModalOpen(false);
          setActiveItemForSplit(null);
        }}
        onSuccess={() => {
          fetchOrder();
          onUpdate();
        }}
        orderId={orderId || ''}
        orderItem={activeItemForSplit}
      />

      <ProductionOrderDetailModal 
        order={selectedProductionOrder}
        onClose={() => setSelectedProductionOrder(null)}
        onUpdate={handleUpdateProductionOrder}
        onDelete={handleDeleteProductionOrder}
        onStatusChange={handleStatusChangeProductionOrder}
        onViewContract={() => setSelectedProductionOrder(null)}
      />
    </div>
  );
}
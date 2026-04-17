import { NextResponse } from 'next/server';
import { createBatchWorkLogs } from '@/services/workLog.service';

/**
 * API Endpoint: /api/production/logs/batch
 * Phương thức: POST
 * Body: { 
 *   logs: [
 *     { 
 *       productionOrderId: string, 
 *       employeeId: string, 
 *       staffName?: string,
 *       quantityProduced: number, 
 *       technicalErrorCount: number, 
 *       materialErrorCount: number, 
 *       note?: string 
 *     }
 *   ],
 *   batchesUsed: [ // Tùy chọn, xử lý tiêu thụ vật tư
 *     { batchId: string, materialId: string, quantity: number }
 *   ]
 * }
 */
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log('--- START POST /api/production/logs/batch ---');
  try {
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { logs, batchesUsed = [] } = body;

    if (!Array.isArray(logs) || logs.length === 0) {
      console.warn('Validation failed: logs is empty or not an array');
      return NextResponse.json({ error: 'Nội dung ghi nhận không hợp lệ' }, { status: 400 });
    }

    console.log(`Calling createBatchWorkLogs with ${logs.length} logs and ${batchesUsed.length} batches`);
    const results = await createBatchWorkLogs(logs, batchesUsed);
    console.log('createBatchWorkLogs success, results count:', results.length);

    return NextResponse.json({ 
      success: true, 
      count: results.length,
      data: results 
    });
  } catch (error: any) {
    console.error('CRITICAL API Error /production/logs/batch:', error);
    // Explicitly return JSON even for top-level errors
    return NextResponse.json({ 
      error: error.message || 'Lỗi hệ thống khi ghi nhận sản lượng hàng loạt',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  } finally {
    console.log('--- END POST /api/production/logs/batch ---');
  }
}

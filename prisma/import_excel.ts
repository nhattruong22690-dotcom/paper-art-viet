import * as XLSX from 'xlsx';
import { prisma } from '../src/lib/prisma';
import * as path from 'path';

async function importExcel() {
  const filePath = path.join(process.cwd(), 'khachhang.xlsx');
  console.log(`📂 Reading file: ${filePath}`);

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON (header: 1 means array of arrays)
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    console.log(`📊 Total rows found: ${data.length}`);

    // Xóa toàn bộ dữ liệu cũ trước khi import mới
    console.log('🧹 Clearing existing customers...');
    await prisma.customer.deleteMany({});
    console.log('✨ Table cleared.');

    let count = 0;
    for (const row of data) {
      const code = String(row[0] || '').trim();
      const name = String(row[1] || '').trim();

      if (!code || !name || code.toLowerCase() === 'mã' || name.toLowerCase() === 'tên') {
        continue; // Skip headers or empty rows
      }

      await prisma.customer.upsert({
        where: { customerCode: code },
        update: { name },
        create: { 
          customerCode: code, 
          name: name,
          phone: '',
          address: '' 
        },
      });
      count++;
    }

    console.log(`✅ Success: Imported/Updated ${count} customers.`);
  } catch (error) {
    console.error('❌ Error importing Excel:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importExcel();

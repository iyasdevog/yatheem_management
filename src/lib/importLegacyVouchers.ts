import fs from 'fs';
import path from 'path';
import os from 'os';
import * as XLSX from 'xlsx';
import { db } from '@/lib/db';

export interface LegacyVoucherExcelRow {
  'Voucher No'?: string;
  'Voucher Number'?: string;
  'Date (YYYY-MM-DD)'?: string;
  'Date'?: string;
  'Amount'?: string | number;
  'Type'?: string;
  'Voucher Type'?: string;
  'Expense Heading'?: string;
  'Heading'?: string;
  'Payment Mode font'?: string;
  'Payment Mode'?: string;
  'Student Adm No'?: string;
  'Student Name'?: string;
  'Sponsor ID'?: string;
  'Sponsor Name'?: string;
  'Description'?: string;
  'Notes'?: string;
  'Created By'?: string;
}

export async function importLegacyVouchers(filePath: string) {
  console.log(`🚀 Starting Legacy Voucher Excel Import from: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: LegacyVoucherExcelRow[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`📊 Found ${rows.length} voucher records in sheet "${sheetName}"`);

  let importedCount = 0;
  let skippedCount = 0;
  const unmappedRecords: Array<{ row: LegacyVoucherExcelRow; reason: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawAmount = row['Amount'];
    const heading = (row['Expense Heading'] || row['Heading'])?.toString().trim();

    // Validation: Amount and Heading are required
    if (rawAmount === undefined || rawAmount === null || rawAmount === '' || !heading) {
      unmappedRecords.push({
        row,
        reason: 'Missing mandatory fields: Amount or Heading',
      });
      skippedCount++;
      continue;
    }

    const amount = parseFloat(rawAmount.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      unmappedRecords.push({
        row,
        reason: `Invalid amount value: "${rawAmount}"`,
      });
      skippedCount++;
      continue;
    }

    const voucherNo =
      (row['Voucher No'] || row['Voucher Number'])?.toString().trim() ||
      `VCH-IMP-${Date.now()}-${i + 1}`;

    // Parse Date
    const rawDate = row['Date (YYYY-MM-DD)'] || row['Date'];
    let voucherDate = new Date();
    if (rawDate) {
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) voucherDate = parsedDate;
    }

    // Determine type
    const rawType = (row['Type'] || row['Voucher Type'])?.toString().trim().toUpperCase();
    let voucherType = 'STUDENT_EXPENSE';
    if (rawType && (rawType.includes('COMMON') || rawType.includes('YATHEEM'))) {
      voucherType = 'YATHEEM_COMMON';
    }

    // Payment Mode
    const paymentMode = (row['Payment Mode'] || row['Payment Mode font'])?.toString().trim() || 'Cash';

    // Student Lookup (by Adm No first, then Name)
    let studentId: string | null = null;
    let resolvedFamilyNo: string | null = null;
    let resolvedStudentName: string | null = (row['Student Name'])?.toString().trim() || null;

    const studentAdmNo = row['Student Adm No']?.toString().trim();
    if (studentAdmNo || resolvedStudentName) {
      let student = null;
      if (studentAdmNo) {
        student = await db.student.findUnique({
          where: { admissionNo: studentAdmNo },
          include: { sponsor: true },
        });
      }
      if (!student && resolvedStudentName) {
        student = await db.student.findFirst({
          where: { name: { contains: resolvedStudentName } },
          include: { sponsor: true },
        });
      }

      if (student) {
        studentId = student.id;
        resolvedFamilyNo = student.familyNo;
        resolvedStudentName = student.name;
      }
    }

    // Sponsor Lookup (by Sponsor ID first, then Name)
    let sponsorId: string | null = null;
    let resolvedSponsorName: string | null = (row['Sponsor Name'])?.toString().trim() || null;

    const spIdRaw = row['Sponsor ID']?.toString().trim();
    if (spIdRaw || resolvedSponsorName) {
      let sponsor = null;
      if (spIdRaw) {
        sponsor = await db.sponsor.findUnique({ where: { sponsorId: spIdRaw } });
      }
      if (!sponsor && resolvedSponsorName) {
        sponsor = await db.sponsor.findFirst({
          where: { name: { contains: resolvedSponsorName } },
        });
      }

      if (sponsor) {
        sponsorId = sponsor.id;
        resolvedSponsorName = sponsor.isAnonymous ? 'Well-wisher' : sponsor.name;
      }
    }

    const description = (row['Description'] || row['Notes'])?.toString().trim() || null;
    const createdBy = row['Created By']?.toString().trim() || 'Excel Import';

    try {
      await db.voucher.create({
        data: {
          voucherNo,
          date: voucherDate,
          amount,
          type: voucherType,
          heading,
          paymentMode,
          studentId,
          sponsorId,
          familyNo: resolvedFamilyNo,
          studentName: resolvedStudentName,
          sponsorName: resolvedSponsorName,
          description,
          createdBy,
        },
      });

      importedCount++;
    } catch (err: any) {
      unmappedRecords.push({
        row,
        reason: `DB error: ${err.message || 'Duplicate voucherNo or constraint violation'}`,
      });
      skippedCount++;
    }
  }

  // Save unmapped dirty records log safely to temp directory
  let logPath = '';
  try {
    const tempDir = os.tmpdir();
    logPath = path.join(tempDir, 'unmapped_vouchers.json');
    fs.writeFileSync(logPath, JSON.stringify(unmappedRecords, null, 2));
  } catch (logErr) {
    console.warn('Could not write unmapped vouchers log file to disk:', logErr);
  }

  console.log(`✅ Voucher Migration: ${importedCount} vouchers imported, ${skippedCount} flagged.`);

  return {
    total: rows.length,
    importedCount,
    skippedCount,
    unmappedRecords,
    logPath,
  };
}

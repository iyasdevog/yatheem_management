import fs from 'fs';
import path from 'path';
import os from 'os';
import * as XLSX from 'xlsx';
import { db } from '@/lib/db';

export interface LegacyExcelRow {
  'Admission No'?: string;
  'Family No'?: string;
  'Student Name'?: string;
  'DOB (YYYY-MM-DD)'?: string;
  'Gender'?: string;
  'Contact Number'?: string;
  'House Name'?: string;
  'Place'?: string;
  'District Name'?: string;
  'Mahallu Name'?: string;
  'School Name'?: string;
  'Class'?: string;
  'Sponsor Name'?: string;
  'Status'?: string;
}

export async function importLegacyExcel(fileSource: string | Buffer) {
  console.log(`🚀 Starting Legacy Excel Import...`);

  let workbook: XLSX.WorkBook;
  if (typeof fileSource === 'string') {
    if (!fs.existsSync(fileSource)) {
      throw new Error(`File not found: ${fileSource}`);
    }
    workbook = XLSX.readFile(fileSource);
  } else {
    workbook = XLSX.read(fileSource, { type: 'buffer' });
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: LegacyExcelRow[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`📊 Found ${rows.length} records in sheet "${sheetName}"`);

  let importedCount = 0;
  let skippedCount = 0;
  const unmappedRecords: Array<{ row: LegacyExcelRow; reason: string }> = [];

  // Default state: Kerala
  let keralaState = await db.state.findUnique({ where: { name: 'Kerala' } });
  if (!keralaState) {
    keralaState = await db.state.create({ data: { name: 'Kerala' } });
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const admissionNo = row['Admission No']?.toString().trim();
    const familyNo = row['Family No']?.toString().trim();
    const studentName = row['Student Name']?.toString().trim();
    const houseName = row['House Name']?.toString().trim();
    const place = row['Place']?.toString().trim();

    // Validation
    if (!studentName || !houseName || !place) {
      unmappedRecords.push({
        row,
        reason: 'Missing mandatory fields: Student Name, House Name, or Place',
      });
      skippedCount++;
      continue;
    }

    const autoAdmissionNo = admissionNo || `IMP-ADM-${Date.now()}-${i}`;
    const autoFamilyNo = familyNo || `IMP-FAM-${1000 + i}`;

    // District lookup or auto-create
    const districtName = row['District Name']?.toString().trim() || 'Malappuram';
    let district = await db.district.findFirst({
      where: { name: { contains: districtName } },
    });
    if (!district) {
      district = await db.district.create({
        data: { name: districtName, stateId: keralaState.id },
      });
    }

    // Mahallu lookup or auto-create
    let mahalluId: string | null = null;
    if (row['Mahallu Name']) {
      const mName = row['Mahallu Name'].toString().trim();
      let mahallu = await db.mahallu.findFirst({
        where: { name: { contains: mName } },
      });
      if (!mahallu) {
        mahallu = await db.mahallu.create({
          data: { name: mName, districtId: district.id, place },
        });
      }
      mahalluId = mahallu.id;
    }

    // Sponsor lookup or auto-create
    let sponsorId: string | null = null;
    if (row['Sponsor Name']) {
      const sName = row['Sponsor Name'].toString().trim();
      let sponsor = await db.sponsor.findFirst({
        where: { name: { contains: sName } },
      });
      if (!sponsor) {
        sponsor = await db.sponsor.create({
          data: {
            sponsorId: `SP-IMP-${Date.now()}-${i}`,
            name: sName,
            contact1: row['Contact Number']?.toString().trim() || '+91 9000000000',
            districtId: district.id,
            stateId: keralaState.id,
          },
        });
      }
      sponsorId = sponsor.id;
    }

    // Parse DOB or default to 2015-01-01
    let dobDate = new Date('2015-01-01');
    if (row['DOB (YYYY-MM-DD)']) {
      const parsed = new Date(row['DOB (YYYY-MM-DD)']);
      if (!isNaN(parsed.getTime())) dobDate = parsed;
    }

    try {
      const student = await db.student.create({
        data: {
          admissionNo: autoAdmissionNo,
          familyNo: autoFamilyNo,
          name: studentName,
          dob: dobDate,
          gender: row['Gender']?.toString().trim() || 'Male',
          contact1: row['Contact Number']?.toString().trim() || '+91 9000000000',
          status: row['Status']?.toString().toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
          houseName,
          place,
          districtId: district.id,
          stateId: keralaState.id,
          mahalluId,
          sponsorId,
        },
      });

      if (row['School Name']) {
        await db.educationalRecord.create({
          data: {
            studentId: student.id,
            academicYear: '2025-2026',
            schoolCategory: 'UP',
            schoolName: row['School Name'].toString().trim(),
            classDivision: row['Class']?.toString().trim() || '5-A',
          },
        });
      }

      importedCount++;
    } catch (err: any) {
      unmappedRecords.push({
        row,
        reason: `DB error: ${err.message || 'Duplicate key or constraint violation'}`,
      });
      skippedCount++;
    }
  }

  // Save dirty record log safely to temp directory
  let logPath = '';
  try {
    const tempDir = os.tmpdir();
    logPath = path.join(tempDir, 'unmapped_records.json');
    fs.writeFileSync(logPath, JSON.stringify(unmappedRecords, null, 2));
  } catch (logErr) {
    console.warn('Could not write unmapped records log file to disk:', logErr);
  }

  console.log(`✅ Import: ${importedCount} imported, ${skippedCount} flagged.`);

  return {
    total: rows.length,
    importedCount,
    skippedCount,
    unmappedRecords,
    logPath,
  };
}

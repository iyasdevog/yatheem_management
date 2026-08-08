import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export async function importLegacyExcel(filePath: string) {
  console.log(`🚀 Starting Legacy Excel Import from: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: LegacyExcelRow[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`📊 Found ${rows.length} records in sheet "${sheetName}"`);

  let importedCount = 0;
  let skippedCount = 0;
  const unmappedRecords: Array<{ row: LegacyExcelRow; reason: string }> = [];

  // Default state: Kerala
  let keralaState = await prisma.state.findUnique({ where: { name: 'Kerala' } });
  if (!keralaState) {
    keralaState = await prisma.state.create({ data: { name: 'Kerala' } });
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

    // District Lookup or Auto-create
    const districtName = row['District Name']?.toString().trim() || 'Malappuram';
    let district = await prisma.district.findFirst({
      where: { name: { contains: districtName } },
    });
    if (!district) {
      district = await prisma.district.create({
        data: { name: districtName, stateId: keralaState.id },
      });
    }

    // Mahallu Lookup or Auto-create
    let mahalluId = null;
    if (row['Mahallu Name']) {
      const mName = row['Mahallu Name'].toString().trim();
      let mahallu = await prisma.mahallu.findFirst({
        where: { name: { contains: mName } },
      });
      if (!mahallu) {
        mahallu = await prisma.mahallu.create({
          data: { name: mName, districtId: district.id, place },
        });
      }
      mahalluId = mahallu.id;
    }

    // Sponsor Lookup or Auto-create
    let sponsorId = null;
    if (row['Sponsor Name']) {
      const sName = row['Sponsor Name'].toString().trim();
      let sponsor = await prisma.sponsor.findFirst({
        where: { name: { contains: sName } },
      });
      if (!sponsor) {
        sponsor = await prisma.sponsor.create({
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
      // Create Student
      const student = await prisma.student.create({
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

      // Add educational record if school specified
      if (row['School Name']) {
        await prisma.educationalRecord.create({
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
        reason: `DB Insertion error: ${err.message || 'Duplicate key'}`,
      });
      skippedCount++;
    }
  }

  // Save unmapped record log
  const logPath = path.join(process.cwd(), 'unmapped_records.json');
  fs.writeFileSync(logPath, JSON.stringify(unmappedRecords, null, 2));

  console.log(`✅ Import finished: ${importedCount} imported, ${skippedCount} flagged as unmapped.`);
  console.log(`📁 Unmapped dirty records saved to: ${logPath}`);

  return {
    total: rows.length,
    importedCount,
    skippedCount,
    unmappedRecords,
    logPath,
  };
}

// Run CLI execution if executed directly
if (require.main === module) {
  const fileArg = process.argv[2] || path.join(process.cwd(), 'sample_legacy_data.xlsx');

  // Create sample excel if missing
  if (!fs.existsSync(fileArg)) {
    const sampleData: LegacyExcelRow[] = [
      {
        'Admission No': 'ADM-LEGACY-001',
        'Family No': 'FAM-LEGACY-101',
        'Student Name': 'Mohammed Sahal',
        'DOB (YYYY-MM-DD)': '2016-03-12',
        Gender: 'Male',
        'Contact Number': '+91 9847112233',
        'House Name': 'Green Cottage',
        Place: 'Kondotty',
        'District Name': 'Malappuram',
        'Mahallu Name': 'Kondotty Juma Masjid Mahallu',
        'School Name': 'EMEA Higher Secondary School',
        Class: '4-A',
        'Sponsor Name': 'Abdul Kareem',
        Status: 'ACTIVE',
      },
      {
        'Admission No': 'ADM-LEGACY-002',
        'Family No': 'FAM-LEGACY-102',
        'Student Name': 'Ansiya Farha',
        'DOB (YYYY-MM-DD)': '2017-07-22',
        Gender: 'Female',
        'Contact Number': '+91 9446334455',
        'House Name': 'Manzil Park',
        Place: 'Perinthalmanna',
        'District Name': 'Malappuram',
        'Mahallu Name': 'Perinthalmanna Town Mahallu',
        'School Name': 'GHS Perinthalmanna',
        Class: '3-B',
        'Sponsor Name': 'Anonymous Well-Wisher',
        Status: 'ACTIVE',
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'LegacyStudents');
    XLSX.writeFile(wb, fileArg);
    console.log(`📝 Generated sample legacy excel file at: ${fileArg}`);
  }

  importLegacyExcel(fileArg)
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error(err);
      prisma.$disconnect();
    });
}

import fs from 'fs';
import path from 'path';
import os from 'os';
import * as XLSX from 'xlsx';
import { db } from '@/lib/db';

export interface LegacySponsorExcelRow {
  'Sponsor ID'?: string;
  'Sponsor Name'?: string;
  'C/O'?: string;
  'c/o'?: string;
  'Care Of'?: string;
  'Gender'?: string;
  'Contact Number'?: string;
  'Contact 2'?: string;
  'WhatsApp'?: string;
  'Is Anonymous'?: string;
  'National ID'?: string;
  'House Name'?: string;
  'Place'?: string;
  'District Name'?: string;
  'State Name'?: string;
  'PIN Code'?: string;
  'Annual Commitment'?: string | number;
  'Count of Slabs'?: string | number;
  'Slab Count'?: string | number;
  'Slab Name'?: string;
  'Slab Amount'?: string | number;
  'Monthly Slab Amount'?: string | number;
  'Sponsored Student Name'?: string;
  'Sponsored Student Adm No'?: string;
  'Starting Date'?: string;
  'Start Date'?: string;
  'Commitment Start Date'?: string;
  'Ending Date'?: string;
  'End Date'?: string;
  'Commitment End Date'?: string;
  // Optional Payment & Contribution Fields
  'Payment Amount'?: string | number;
  'Previous Payment Amount'?: string | number;
  'Payment Date'?: string;
  'Payment Mode'?: string;
  'Payment Heading'?: string;
}

export async function importLegacySponsors(filePath: string) {
  console.log(`🚀 Starting Legacy Sponsor Excel Import from: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: LegacySponsorExcelRow[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`📊 Found ${rows.length} sponsor records in sheet "${sheetName}"`);

  let importedCount = 0;
  let skippedCount = 0;
  let paymentsRecordedCount = 0;
  let studentAllocationsCount = 0;
  const unmappedRecords: Array<{ row: LegacySponsorExcelRow; reason: string }> = [];

  // Default state: Kerala
  let keralaState = await db.state.findUnique({ where: { name: 'Kerala' } });
  if (!keralaState) {
    keralaState = await db.state.create({ data: { name: 'Kerala' } });
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const sponsorName = row['Sponsor Name']?.toString().trim();
    const contact1 = row['Contact Number']?.toString().trim();

    // Validation: Sponsor Name and Contact Number are mandatory
    if (!sponsorName || !contact1) {
      unmappedRecords.push({
        row,
        reason: 'Missing mandatory fields: Sponsor Name or Contact Number',
      });
      skippedCount++;
      continue;
    }

    const autoSponsorId = row['Sponsor ID']?.toString().trim() || `SP-IMP-${Date.now()}-${i + 1}`;

    // Care Of (c/o)
    const careOf = (row['C/O'] || row['c/o'] || row['Care Of'])?.toString().trim() || null;

    // Slab Count
    const slabCountRaw = row['Count of Slabs'] ?? row['Slab Count'];
    const slabCount = slabCountRaw ? parseInt(slabCountRaw.toString().replace(/[^0-9]/g, ''), 10) : 1;

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

    // Parse Anonymous Flag
    const isAnonRaw = row['Is Anonymous']?.toString().trim().toLowerCase();
    const isAnonymous = ['yes', 'true', '1', 'y'].includes(isAnonRaw || '');

    // Parse Annual Commitment Target
    const commitmentRaw = row['Annual Commitment'];
    const annualCommitment = commitmentRaw ? parseFloat(commitmentRaw.toString().replace(/[^0-9.]/g, '')) : 0;

    // Parse Commitment Start Date
    const startDateRaw = row['Starting Date'] || row['Start Date'] || row['Commitment Start Date'];
    let commitmentStartDate: Date | null = null;
    if (startDateRaw) {
      const parsedStart = new Date(startDateRaw);
      if (!isNaN(parsedStart.getTime())) commitmentStartDate = parsedStart;
    }

    // Parse Commitment End Date
    const endDateRaw = row['Ending Date'] || row['End Date'] || row['Commitment End Date'];
    let commitmentEndDate: Date | null = null;
    if (endDateRaw) {
      const parsedEnd = new Date(endDateRaw);
      if (!isNaN(parsedEnd.getTime())) commitmentEndDate = parsedEnd;
    }

    // Check duplicate sponsor by sponsorId or (name + contact1)
    let sponsor = await db.sponsor.findFirst({
      where: {
        OR: [
          { sponsorId: autoSponsorId },
          { name: sponsorName, contact1 },
        ],
      },
    });

    if (!sponsor) {
      try {
        sponsor = await db.sponsor.create({
          data: {
            sponsorId: autoSponsorId,
            name: sponsorName,
            careOf,
            gender: row['Gender']?.toString().trim() || 'Male',
            isAnonymous,
            nationalId: row['National ID']?.toString().trim() || null,
            contact1,
            contact2: row['Contact 2']?.toString().trim() || null,
            whatsapp: row['WhatsApp']?.toString().trim() || null,
            houseName: row['House Name']?.toString().trim() || null,
            place: row['Place']?.toString().trim() || null,
            districtId: district.id,
            stateId: keralaState.id,
            pinCode: row['PIN Code']?.toString().trim() || null,
            annualCommitment: isNaN(annualCommitment) ? 0 : annualCommitment,
            slabCount: isNaN(slabCount) || slabCount < 1 ? 1 : slabCount,
            commitmentStartDate: commitmentStartDate || (row['Payment Date'] ? new Date(row['Payment Date']) : new Date()),
            commitmentEndDate: commitmentEndDate || null,
          },
        });

        importedCount++;
      } catch (err: any) {
        unmappedRecords.push({
          row,
          reason: `DB Insertion error: ${err.message || 'Constraint error'}`,
        });
        skippedCount++;
        continue;
      }
    } else {
      // Update existing sponsor with new careOf / dates / slabCount if missing
      sponsor = await db.sponsor.update({
        where: { id: sponsor.id },
        data: {
          careOf: sponsor.careOf || careOf,
          commitmentEndDate: sponsor.commitmentEndDate || commitmentEndDate,
          slabCount: sponsor.slabCount || slabCount,
        },
      });
      console.log(`ℹ️ Existing sponsor updated: ${sponsor.name} (${sponsor.sponsorId})`);
    }

    // Process Optional Slab Master
    let slabId: string | null = null;
    if (row['Slab Name'] || row['Slab Amount'] || row['Monthly Slab Amount']) {
      const slabName = row['Slab Name']?.toString().trim() || 'Standard Slab';
      const slabAmtRaw = row['Slab Amount'] ?? row['Monthly Slab Amount'] ?? '1000';
      const slabAmt = parseFloat(slabAmtRaw.toString().replace(/[^0-9.]/g, ''));

      if (!isNaN(slabAmt) && slabAmt > 0) {
        let slab = await db.sponsorshipSlab.findFirst({
          where: { name: { contains: slabName } },
        });
        if (!slab) {
          slab = await db.sponsorshipSlab.create({
            data: { name: slabName, amount: slabAmt, description: 'Created via Excel Migration' },
          });
        }
        slabId = slab.id;
      }
    }

    // Process Sponsored Student Allocation if provided
    const studentNameRaw = row['Sponsored Student Name']?.toString().trim();
    const studentAdmNoRaw = row['Sponsored Student Adm No']?.toString().trim();

    if (studentNameRaw || studentAdmNoRaw) {
      let student = null;
      if (studentAdmNoRaw) {
        student = await db.student.findUnique({ where: { admissionNo: studentAdmNoRaw } });
      }
      if (!student && studentNameRaw) {
        student = await db.student.findFirst({
          where: { name: { contains: studentNameRaw } },
        });
      }

      if (student) {
        // Link student to sponsor
        await db.student.update({
          where: { id: student.id },
          data: {
            sponsorId: sponsor.id,
            sponsorshipStartDate: commitmentStartDate || new Date(),
          },
        });

        // Create allocation record if not exists
        const existingAlloc = await db.sponsorSlabAllocation.findFirst({
          where: { sponsorId: sponsor.id, studentId: student.id },
        });

        if (!existingAlloc) {
          await db.sponsorSlabAllocation.create({
            data: {
              sponsorId: sponsor.id,
              studentId: student.id,
              slabId: slabId || undefined,
              customAmount: isNaN(annualCommitment) ? null : annualCommitment,
            },
          });
        }
        studentAllocationsCount++;
      } else {
        console.log(`⚠️ Sponsored student "${studentNameRaw || studentAdmNoRaw}" not found during sponsor migration.`);
      }
    }

    // Process Payment Installment into SponsorPayment table & Voucher
    const paymentAmtRaw = row['Payment Amount'] ?? row['Previous Payment Amount'];
    if (paymentAmtRaw !== undefined && paymentAmtRaw !== null && paymentAmtRaw !== '') {
      const paymentAmount = parseFloat(paymentAmtRaw.toString().replace(/[^0-9.]/g, ''));
      if (!isNaN(paymentAmount) && paymentAmount > 0) {
        let paymentDate = new Date();
        if (row['Payment Date']) {
          const parsedDate = new Date(row['Payment Date']);
          if (!isNaN(parsedDate.getTime())) paymentDate = parsedDate;
        }

        const heading = row['Payment Heading'] || 'Sponsorship Contribution';
        const paymentMode = row['Payment Mode'] || 'Bank Transfer';

        try {
          // Record in SponsorPayment table (for payment tracker)
          await db.sponsorPayment.create({
            data: {
              sponsorId: sponsor.id,
              amount: paymentAmount,
              date: paymentDate,
              paymentMode,
              notes: heading,
            },
          });

          // Also record in Voucher table
          await db.voucher.create({
            data: {
              voucherNo: `VCH-SP-MIG-${Date.now()}-${i + 1}`,
              date: paymentDate,
              amount: paymentAmount,
              type: 'YATHEEM_COMMON',
              heading: heading.toString().trim(),
              paymentMode: paymentMode.toString().trim(),
              sponsorId: sponsor.id,
              sponsorName: sponsor.isAnonymous ? 'Well-wisher (Anonymous)' : sponsor.name,
              description: `Imported legacy payment for sponsor ${sponsor.name} (${sponsor.sponsorId})`,
            },
          });
          paymentsRecordedCount++;
        } catch (vchErr: any) {
          console.error('Failed to create payment/voucher for sponsor:', vchErr);
        }
      }
    }
  }

  // Save unmapped dirty records log safely to temp directory
  let logPath = '';
  try {
    const tempDir = os.tmpdir();
    logPath = path.join(tempDir, 'unmapped_sponsors.json');
    fs.writeFileSync(logPath, JSON.stringify(unmappedRecords, null, 2));
  } catch (logErr) {
    console.warn('Could not write unmapped sponsors log file to disk:', logErr);
  }

  console.log(`✅ Sponsor Migration: ${importedCount} sponsors imported, ${studentAllocationsCount} students linked, ${paymentsRecordedCount} payments recorded, ${skippedCount} flagged.`);

  return {
    total: rows.length,
    importedCount,
    studentAllocationsCount,
    paymentsRecordedCount,
    skippedCount,
    unmappedRecords,
    logPath,
  };
}

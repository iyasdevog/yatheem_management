import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { db } from '@/lib/db';

export interface LegacySponsorExcelRow {
  'Sponsor ID'?: string;
  'Sponsor Name'?: string;
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
  'Commitment Start Date'?: string;
  // Optional Payment & Contribution Fields
  'Payment Amount'?: string | number;
  'Previous Payment Amount'?: string | number;
  'Payment Date'?: string;
  'Payment Mode'?: string;
  'Payment Heading'?: string;
  'Slab Name'?: string;
  'Monthly Slab Amount'?: string | number;
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
    let commitmentStartDate: Date | null = null;
    if (row['Commitment Start Date']) {
      const parsedStart = new Date(row['Commitment Start Date']);
      if (!isNaN(parsedStart.getTime())) commitmentStartDate = parsedStart;
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
            commitmentStartDate: commitmentStartDate || (row['Payment Date'] ? new Date(row['Payment Date']) : new Date()),
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
      console.log(`ℹ️ Existing sponsor found: ${sponsor.name} (${sponsor.sponsorId})`);
    }

    // Process Optional Previous Payment / Contribution if present
    const paymentAmtRaw = row['Payment Amount'] ?? row['Previous Payment Amount'];
    if (paymentAmtRaw !== undefined && paymentAmtRaw !== null && paymentAmtRaw !== '') {
      const paymentAmount = parseFloat(paymentAmtRaw.toString().replace(/[^0-9.]/g, ''));
      if (!isNaN(paymentAmount) && paymentAmount > 0) {
        let paymentDate = new Date();
        if (row['Payment Date']) {
          const parsedDate = new Date(row['Payment Date']);
          if (!isNaN(parsedDate.getTime())) paymentDate = parsedDate;
        }

        const heading = row['Payment Heading'] || 'Sponsor Legacy Contribution';
        const paymentMode = row['Payment Mode'] || 'Bank Transfer';

        try {
          await db.voucher.create({
            data: {
              voucherNo: `VCH-SP-LEGACY-${Date.now()}-${i + 1}`,
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
          console.error('Failed to create voucher for sponsor payment:', vchErr);
        }
      }
    }

    // Optional: Setup Sponsorship Slab if provided
    if (row['Slab Name'] || row['Monthly Slab Amount']) {
      const slabName = row['Slab Name']?.toString().trim() || 'Standard Slab';
      const slabAmt = parseFloat((row['Monthly Slab Amount'] || '1000').toString().replace(/[^0-9.]/g, ''));

      if (!isNaN(slabAmt) && slabAmt > 0) {
        let slab = await db.sponsorshipSlab.findFirst({
          where: { name: { contains: slabName } },
        });
        if (!slab) {
          slab = await db.sponsorshipSlab.create({
            data: { name: slabName, amount: slabAmt, description: 'Created via Legacy Sponsor Import' },
          });
        }
      }
    }
  }

  // Save unmapped dirty records log to project root
  const logPath = path.join(process.cwd(), 'unmapped_sponsors.json');
  fs.writeFileSync(logPath, JSON.stringify(unmappedRecords, null, 2));

  console.log(`✅ Sponsor Import: ${importedCount} sponsors imported, ${paymentsRecordedCount} payments recorded, ${skippedCount} flagged.`);

  return {
    total: rows.length,
    importedCount,
    paymentsRecordedCount,
    skippedCount,
    unmappedRecords,
    logPath,
  };
}

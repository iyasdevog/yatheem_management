import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { db } from '../src/lib/db';
import { importLegacySponsors, LegacySponsorExcelRow } from '../src/lib/importLegacySponsors';

if (require.main === module) {
  const fileArg = process.argv[2] || path.join(process.cwd(), 'sample_legacy_sponsors.xlsx');

  // Generate sample excel if file doesn't exist
  if (!fs.existsSync(fileArg)) {
    const sampleData: LegacySponsorExcelRow[] = [
      {
        'Sponsor ID': 'SP-LEGACY-001',
        'Sponsor Name': 'Abdul Kareem',
        Gender: 'Male',
        'Contact Number': '+91 9847112233',
        'Contact 2': '+91 9446001122',
        WhatsApp: '+91 9847112233',
        'Is Anonymous': 'No',
        'National ID': '321456789012',
        'House Name': 'Rahman Manzil',
        Place: 'Kondotty',
        'District Name': 'Malappuram',
        'State Name': 'Kerala',
        'PIN Code': '673638',
        'Payment Amount': 5000,
        'Payment Date': '2025-04-10',
        'Payment Mode': 'Bank Transfer',
        'Payment Heading': 'Ramadan Yatheem Fund Contribution',
        'Slab Name': 'Gold Slab',
        'Monthly Slab Amount': 5000,
      },
      {
        'Sponsor ID': 'SP-LEGACY-002',
        'Sponsor Name': 'Anonymous Well-Wisher',
        Gender: 'Male',
        'Contact Number': '+91 9446998877',
        'Is Anonymous': 'Yes',
        Place: 'Manjeri',
        'District Name': 'Malappuram',
        'State Name': 'Kerala',
        'Payment Amount': 2000,
        'Payment Date': '2025-05-01',
        'Payment Mode': 'Cash',
        'Payment Heading': 'Monthly Support',
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'LegacySponsors');
    XLSX.writeFile(wb, fileArg);
    console.log(`📝 Generated sample legacy sponsor excel file with payments at: ${fileArg}`);
  }

  importLegacySponsors(fileArg)
    .then(() => db.$disconnect())
    .catch((err) => {
      console.error(err);
      db.$disconnect();
    });
}

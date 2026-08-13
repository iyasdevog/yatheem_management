import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'students';

    let data: any[] = [];
    let filename = '';

    if (type === 'sponsors') {
      filename = 'Sponsor_Migration_Template.xlsx';
      data = [
        {
          'Sponsor ID': 'SP-2026-001',
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
          'Annual Commitment': 50000,
          'Commitment Start Date': '2025-01-01',
          'Payment Amount': 5000,
          'Payment Date': '2025-04-10',
          'Payment Mode': 'Bank Transfer',
          'Payment Heading': 'Monthly Sponsorship Contribution',
          'Slab Name': 'Annual ₹50,000 Sponsor',
          'Monthly Slab Amount': 5000,
        },
        {
          'Sponsor ID': 'SP-2026-002',
          'Sponsor Name': 'Anonymous Wellwisher',
          Gender: 'Male',
          'Contact Number': '+91 9811122233',
          'Contact 2': '',
          WhatsApp: '+91 9811122233',
          'Is Anonymous': 'Yes',
          'National ID': '',
          'House Name': 'Green Villa',
          Place: 'Manjeri',
          'District Name': 'Malappuram',
          'State Name': 'Kerala',
          'PIN Code': '676121',
          'Annual Commitment': 50000,
          'Commitment Start Date': '2025-01-01',
          'Payment Amount': 10000,
          'Payment Date': '2025-05-15',
          'Payment Mode': 'UPI',
          'Payment Heading': 'Perunnal Kit Contribution',
          'Slab Name': 'Annual ₹50,000 Sponsor',
          'Monthly Slab Amount': 5000,
        },
      ];
    } else {
      filename = 'Student_Migration_Template.xlsx';
      data = [
        {
          'Admission No': 'ADM-2026-001',
          'Family No': 'FAM-1001',
          'Student Name': 'Mohammed Sahal',
          'DOB (YYYY-MM-DD)': '2016-03-12',
          Gender: 'Male',
          'Contact Number': '+91 9847112233',
          'House Name': 'Green Cottage',
          Place: 'Kondotty',
          'District Name': 'Malappuram',
          'Mahallu Name': 'Kondotty Town Mahallu',
          'School Name': 'EMEA Higher Secondary School',
          Class: '4-A',
          'Sponsor Name': 'Abdul Kareem',
          Status: 'ACTIVE',
        },
        {
          'Admission No': 'ADM-2026-002',
          'Family No': 'FAM-1002',
          'Student Name': 'Fatima Suhra',
          'DOB (YYYY-MM-DD)': '2015-08-20',
          Gender: 'Female',
          'Contact Number': '+91 9447123456',
          'House Name': 'Rose Villa',
          Place: 'Manjeri',
          'District Name': 'Malappuram',
          'Mahallu Name': 'Manjeri Central Mahallu',
          'School Name': 'Government HSS Manjeri',
          Class: '5-B',
          'Sponsor Name': 'Anonymous Wellwisher',
          Status: 'ACTIVE',
        },
      ];
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate template:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}

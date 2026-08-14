import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'students';

    let data: any[] = [];
    let filename = '';

    if (type === 'vouchers') {
      filename = 'Voucher_Migration_Template.xlsx';
      data = [
        {
          'Voucher No': 'VCH-2026-001',
          'Date (YYYY-MM-DD)': '2025-04-15',
          'Amount': 2500,
          'Type': 'STUDENT_EXPENSE',
          'Expense Heading': 'Dress exp',
          'Payment Mode': 'Cash',
          'Student Adm No': 'ADM-2026-001',
          'Student Name': 'Mohammed Sahal',
          'Sponsor ID': 'SP-2026-001',
          'Sponsor Name': 'Abdul Kareem',
          'Description': 'Festive clothing and school uniform purchase',
          'Created By': 'Office Accounts',
        },
        {
          'Voucher No': 'VCH-2026-002',
          'Date (YYYY-MM-DD)': '2025-05-01',
          'Amount': 15000,
          'Type': 'YATHEEM_COMMON',
          'Expense Heading': 'Salary of section employees',
          'Payment Mode': 'Bank Transfer',
          'Student Adm No': '',
          'Student Name': '',
          'Sponsor ID': '',
          'Sponsor Name': '',
          'Description': 'Staff monthly honorarium payout',
          'Created By': 'Chief Accounts Officer',
        },
      ];
    } else if (type === 'sponsors') {
      filename = 'Sponsor_Migration_Template.xlsx';
      data = [
        {
          'Sponsor ID': 'SP-2026-001',
          'Sponsor Name': 'Abdul Kareem',
          'C/O': 'Moideen Kutty',
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
          'Count of Slabs': 1,
          'Slab Name': 'Grand Fixed Sponsorship Slab',
          'Sponsored Student Name': 'Mohammed Sahal',
          'Sponsored Student Adm No': 'ADM-2026-001',
          'Starting Date': '2025-01-01',
          'Ending Date': '2025-12-31',
          'Payment Amount': 5000,
          'Payment Date': '2025-04-10',
          'Payment Mode': 'Bank Transfer',
          'Payment Heading': 'Sponsorship Installment',
        },
        {
          'Sponsor ID': 'SP-2026-002',
          'Sponsor Name': 'Anonymous Wellwisher',
          'C/O': 'Self',
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
          'Annual Commitment': 30000,
          'Count of Slabs': 2,
          'Slab Name': 'Full Education & Tuition Slab',
          'Sponsored Student Name': 'Fatima Suhra',
          'Sponsored Student Adm No': 'ADM-2026-002',
          'Starting Date': '2025-01-01',
          'Ending Date': '2025-12-31',
          'Payment Amount': 10000,
          'Payment Date': '2025-05-15',
          'Payment Mode': 'UPI',
          'Payment Heading': 'Education Kit Contribution',
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

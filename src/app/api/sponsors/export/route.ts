import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !['ADMIN', 'OFFICE_STAFF'].includes(currentUser.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sponsors = await db.sponsor.findMany({
      include: {
        students: { select: { admissionNo: true, name: true, status: true } },
        slabAllocations: { include: { slab: true } },
        vouchers: { orderBy: { date: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows: any[] = sponsors.map((sp) => {
      const totalPaid = sp.vouchers.reduce((acc, v) => acc + v.amount, 0);
      const annualCommitment = sp.annualCommitment || 0;
      const remainingBalance = Math.max(0, annualCommitment - totalPaid);
      const fulfillmentPercentage =
        annualCommitment > 0
          ? Math.min(100, Math.round((totalPaid / annualCommitment) * 100))
          : 100;
      const studentNames = sp.students.map((s) => `${s.name} (${s.admissionNo})`).join(', ');
      const slabNames = sp.slabAllocations
        .map((a) => (a.slab ? `${a.slab.name} (₹${a.slab.amount})` : 'Custom'))
        .join(', ');

      return {
        'Sponsor ID': sp.sponsorId,
        'Sponsor Name': sp.name,
        Gender: sp.gender || '',
        Anonymous: sp.isAnonymous ? 'Yes' : 'No',
        'Contact 1': sp.contact1,
        'Contact 2': sp.contact2 || '',
        WhatsApp: sp.whatsapp || '',
        'National ID': sp.nationalId || '',
        'House Name': sp.houseName || '',
        Place: sp.place || '',
        'PIN Code': sp.pinCode || '',
        'Annual Commitment (₹)': annualCommitment,
        'Total Paid (₹)': totalPaid,
        'Remaining Balance (₹)': remainingBalance,
        'Fulfillment %': fulfillmentPercentage,
        'Commitment Start Date': sp.commitmentStartDate
          ? new Date(sp.commitmentStartDate).toISOString().split('T')[0]
          : '',
        'Sponsored Students': studentNames,
        'Slab Allocations': slabNames,
        'Registered On': new Date(sp.createdAt).toISOString().split('T')[0],
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sponsors');

    // Auto column widths
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(
        key.length,
        ...rows.map((r) => String(r[key] ?? '').length)
      ),
    }));
    worksheet['!cols'] = colWidths;

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const filename = `Sponsors_Export_${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Sponsor export error:', error);
    return NextResponse.json({ error: 'Failed to export sponsors' }, { status: 500 });
  }
}

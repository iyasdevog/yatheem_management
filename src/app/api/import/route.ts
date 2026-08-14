import { NextRequest, NextResponse } from 'next/server';
import { importLegacyExcel } from '@/lib/importLegacyExcel';
import { importLegacySponsors } from '@/lib/importLegacySponsors';
import { importLegacyVouchers } from '@/lib/importLegacyVouchers';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'students';

    if (!file) {
      return NextResponse.json({ error: 'No Excel/CSV file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = type === 'sponsors'
      ? await importLegacySponsors(buffer)
      : type === 'vouchers'
      ? await importLegacyVouchers(buffer)
      : await importLegacyExcel(buffer);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${result.importedCount} ${type} records. ${result.skippedCount} dirty/unmapped records flagged.`,
      result,
    });
  } catch (error: any) {
    console.error('Import API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process Excel legacy import' },
      { status: 500 }
    );
  }
}

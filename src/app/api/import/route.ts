import { NextRequest, NextResponse } from 'next/server';
import { importLegacyExcel } from '@/lib/importLegacyExcel';
import { importLegacySponsors } from '@/lib/importLegacySponsors';
import { importLegacyVouchers } from '@/lib/importLegacyVouchers';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

    const tempDir = os.tmpdir();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const tempFilePath = path.join(tempDir, `import_${Date.now()}_${safeFileName}`);
    await fs.promises.writeFile(tempFilePath, buffer);

    const result = type === 'sponsors'
      ? await importLegacySponsors(tempFilePath)
      : type === 'vouchers'
      ? await importLegacyVouchers(tempFilePath)
      : await importLegacyExcel(tempFilePath);

    // Clean temp file
    if (fs.existsSync(tempFilePath)) {
      await fs.promises.unlink(tempFilePath);
    }

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

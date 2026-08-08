import { NextRequest, NextResponse } from 'next/server';
import { importLegacyExcel } from '@/lib/importLegacyExcel';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No Excel/CSV file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `import_${Date.now()}_${file.name}`);
    await fs.promises.writeFile(tempFilePath, buffer);

    const result = await importLegacyExcel(tempFilePath);

    // Clean temp file
    if (fs.existsSync(tempFilePath)) {
      await fs.promises.unlink(tempFilePath);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${result.importedCount} records. ${result.skippedCount} dirty/unmapped records flagged.`,
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

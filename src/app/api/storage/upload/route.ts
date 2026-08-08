import { NextRequest, NextResponse } from 'next/server';
import { StorageFactory } from '@/lib/storage/StorageFactory';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const pathPrefix = (formData.get('pathPrefix') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storage = StorageFactory.getStorageService();
    const uploadResult = await storage.uploadFile(
      buffer,
      pathPrefix,
      file.name,
      file.type || 'application/octet-stream'
    );

    // Get display URL for response preview
    const url = await storage.getFileUrl(uploadResult.key);

    return NextResponse.json({
      success: true,
      key: uploadResult.key, // RELATIVE KEY stored in DB
      url,
      originalName: uploadResult.originalName,
      mimeType: uploadResult.mimeType,
      size: uploadResult.size,
    });
  } catch (error) {
    console.error('Storage Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

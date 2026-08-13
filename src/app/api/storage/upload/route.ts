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

    const MAX_FILE_SIZE = 100 * 1024; // 100 KB limit
    if (file.size > MAX_FILE_SIZE) {
      const currentKb = (file.size / 1024).toFixed(1);
      return NextResponse.json(
        { error: `File size (${currentKb} KB) exceeds maximum allowed limit of 100 KB. Please compress or select a smaller photo.` },
        { status: 400 }
      );
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

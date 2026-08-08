import { NextRequest, NextResponse } from 'next/server';
import { StorageFactory } from '@/lib/storage/StorageFactory';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const relativeKey = (resolvedParams.key || []).join('/');

    if (!relativeKey) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    // For local storage: serve file directly from public/uploads directory
    const fullPath = path.join(process.cwd(), 'public', 'uploads', relativeKey);
    if (fs.existsSync(fullPath)) {
      const fileBuffer = await fs.promises.readFile(fullPath);
      const ext = path.extname(fullPath).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
      const contentType = contentTypeMap[ext] || 'application/octet-stream';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Fall back: resolve URL from active storage provider and redirect
    const storage = StorageFactory.getStorageService();
    const resolvedUrl = await storage.getFileUrl(relativeKey);

    return NextResponse.redirect(resolvedUrl);
  } catch (error) {
    console.error('File resolution error:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

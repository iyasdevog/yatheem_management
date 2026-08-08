import fs from 'fs';
import path from 'path';
import { IStorageService, UploadResult } from './IStorageService';

export class LocalStorageAdapter implements IStorageService {
  private baseDir: string;

  constructor() {
    // Store in public/uploads directory for local zero-cost development
    this.baseDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    pathPrefix: string,
    filename: string,
    mimeType: string
  ): Promise<UploadResult> {
    const cleanPrefix = pathPrefix.replace(/^\/+|\/+$/g, '');
    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const relativeKey = `${cleanPrefix}/${Date.now()}_${cleanFilename}`;

    const fullPath = path.join(this.baseDir, relativeKey);
    const directoryPath = path.dirname(fullPath);

    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    await fs.promises.writeFile(fullPath, fileBuffer);

    return {
      key: relativeKey,
      originalName: filename,
      mimeType,
      size: fileBuffer.length,
    };
  }

  async getFileUrl(key: string): Promise<string> {
    if (!key) return '';
    // Format dynamic URL path served by Next.js or uploads route
    const cleanKey = key.replace(/^\/+/, '');
    return `/uploads/${cleanKey}`;
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const cleanKey = key.replace(/^\/+/, '');
      const fullPath = path.join(this.baseDir, cleanKey);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('LocalStorageAdapter delete error:', error);
      return false;
    }
  }
}

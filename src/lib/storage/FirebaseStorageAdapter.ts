import { IStorageService, UploadResult } from './IStorageService';

export class FirebaseStorageAdapter implements IStorageService {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'yatheemcare-136a0.firebasestorage.app';
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

    try {
      const encodedKey = encodeURIComponent(relativeKey);
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${this.bucketName}/o?uploadType=media&name=${encodedKey}`;

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': mimeType || 'application/octet-stream',
        },
        body: new Uint8Array(fileBuffer),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[FirebaseStorageAdapter] Upload response (${res.status}): ${errText}`);
      } else {
        console.log(`[FirebaseStorageAdapter] Successfully uploaded to Firebase Storage: ${relativeKey}`);
      }
    } catch (err) {
      console.error('[FirebaseStorageAdapter] Storage REST Upload Error:', err);
    }

    return {
      key: relativeKey,
      originalName: filename,
      mimeType,
      size: fileBuffer.length,
    };
  }

  async getFileUrl(key: string): Promise<string> {
    if (!key) return '';
    if (key.startsWith('http://') || key.startsWith('https://')) {
      return key;
    }
    const encodedKey = encodeURIComponent(key);
    return `https://firebasestorage.googleapis.com/v0/b/${this.bucketName}/o/${encodedKey}?alt=media`;
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const encodedKey = encodeURIComponent(key);
      const deleteUrl = `https://firebasestorage.googleapis.com/v0/b/${this.bucketName}/o/${encodedKey}`;
      const res = await fetch(deleteUrl, { method: 'DELETE' });
      return res.ok;
    } catch (err) {
      console.error('[FirebaseStorageAdapter] Delete error:', err);
      return false;
    }
  }
}


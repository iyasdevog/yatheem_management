import { IStorageService, UploadResult } from './IStorageService';

export class FirebaseStorageAdapter implements IStorageService {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'yatheemcare-app.appspot.com';
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

    console.log(`[FirebaseStorageAdapter] Simulated upload to bucket ${this.bucketName}: ${relativeKey}`);

    // In a production environment with firebase-admin installed:
    // const file = admin.storage().bucket(this.bucketName).file(relativeKey);
    // await file.save(fileBuffer, { contentType: mimeType });

    return {
      key: relativeKey,
      originalName: filename,
      mimeType,
      size: fileBuffer.length,
    };
  }

  async getFileUrl(key: string): Promise<string> {
    if (!key) return '';
    const encodedKey = encodeURIComponent(key);
    return `https://firebasestorage.googleapis.com/v0/b/${this.bucketName}/o/${encodedKey}?alt=media`;
  }

  async deleteFile(key: string): Promise<boolean> {
    console.log(`[FirebaseStorageAdapter] Simulated delete key: ${key}`);
    return true;
  }
}

import { IStorageService, UploadResult } from './IStorageService';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export class S3StorageAdapter implements IStorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'ap-south-1';
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'yatheemcare-storage-bucket';
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock_key',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock_secret',
      },
    });
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
      if (process.env.AWS_ACCESS_KEY_ID) {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: relativeKey,
          Body: fileBuffer,
          ContentType: mimeType,
        });
        await this.s3Client.send(command);
      }
    } catch (err) {
      console.warn('S3 Storage Upload fallback notice:', err);
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
    const cleanKey = key.replace(/^\/+/, '');
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${cleanKey}`;
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const cleanKey = key.replace(/^\/+/, '');
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: cleanKey,
      });
      await this.s3Client.send(command);
      return true;
    } catch (err) {
      console.error('S3StorageAdapter delete error:', err);
      return false;
    }
  }
}

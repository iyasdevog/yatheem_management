import { IStorageService } from './IStorageService';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { FirebaseStorageAdapter } from './FirebaseStorageAdapter';
import { S3StorageAdapter } from './S3StorageAdapter';

export class StorageFactory {
  private static instance: IStorageService;

  public static getStorageService(): IStorageService {
    if (!StorageFactory.instance) {
      const defaultProvider = (process.env.VERCEL || process.env.NODE_ENV === 'production') ? 'firebase' : 'local';
      const provider = (process.env.STORAGE_PROVIDER || defaultProvider).toLowerCase();

      switch (provider) {
        case 'firebase':
          console.log('[StorageFactory] Instantiating FirebaseStorageAdapter');
          StorageFactory.instance = new FirebaseStorageAdapter();
          break;
        case 's3':
        case 'minio':
          console.log('[StorageFactory] Instantiating S3StorageAdapter');
          StorageFactory.instance = new S3StorageAdapter();
          break;
        case 'local':
        default:
          console.log('[StorageFactory] Instantiating LocalStorageAdapter ($0 local disk)');
          StorageFactory.instance = new LocalStorageAdapter();
          break;
      }
    }

    return StorageFactory.instance;
  }
}

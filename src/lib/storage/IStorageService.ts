/**
 * File Storage Abstraction Interface (Strategy Pattern)
 */
export interface UploadResult {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface IStorageService {
  /**
   * Upload a file buffer or stream to the storage provider
   * @param fileBuffer The raw file buffer
   * @param pathPrefix Relative directory prefix, e.g., 'students/photos' or 'marksheets/2026'
   * @param filename Filename or photo key identifier
   * @param mimeType MIME type of the file
   */
  uploadFile(
    fileBuffer: Buffer,
    pathPrefix: string,
    filename: string,
    mimeType: string
  ): Promise<UploadResult>;

  /**
   * Resolve display URL for a given relative storage key.
   * NEVER store absolute domain URLs in DB. Store relative keys only.
   */
  getFileUrl(key: string): Promise<string>;

  /**
   * Delete a file by its relative storage key
   */
  deleteFile(key: string): Promise<boolean>;
}

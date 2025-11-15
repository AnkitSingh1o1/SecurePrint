export interface FileRecord {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  path?: string;
  s3Key?: string;
  uploadedAt: Date;
}

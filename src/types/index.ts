export interface UploadItem {
  id: string;
  file: File;
  previewUrl?: string;
  status: 'queued' | 'uploading' | 'completed' | 'error';
  progress: number; // 0 to 100
  bytesUploaded: number;
  totalBytes: number;
  driveFileId?: string;
  driveViewLink?: string;
  errorMessage?: string;
  uploadSpeed?: number; // bytes/sec
}

export interface UploadedFileRecord {
  id: string;
  name: string;
  size: number;
  type: string;
  driveFileId: string;
  webViewLink?: string;
  uploadedAt: string;
  uploaderName?: string;
}

export interface FolderConfig {
  id: string;
  url: string;
  name: string;
}

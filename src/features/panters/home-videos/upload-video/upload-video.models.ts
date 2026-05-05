export interface HomeVideoUploadResponse {
  id: string;
  url: string;
  key: string;
}

export interface HomeVideoUploadUrlResponse {
  uploadUrl: string;
  key: string;
  clientId: string;
}

export class RegisterUploadDto {
  key: string;
  originalName: string;
  mimeType: string;
}

export interface UploadProgressData {
  status: 'starting' | 'uploading_s3' | 'saving_db' | 'completed' | 'error';
  progress: number;
  message?: string;
  data?: any;
}

export class UnsupportedMimeTypeError extends Error {
  constructor(mimeType: string) {
    super(
      `El formato de video '${mimeType}' no está soportado. Se requiere video/webm.`,
    );
    this.name = 'UnsupportedMimeTypeError';
  }
}

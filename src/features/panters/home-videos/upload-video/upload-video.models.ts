export class HomeVideoUploadResponse {
  id: string;
  url: string;
  key: string;
}

export class UnsupportedMimeTypeError extends Error {
  constructor(mimeType: string) {
    super(`El formato de video '${mimeType}' no está soportado. Se requiere video/webm.`);
    this.name = 'UnsupportedMimeTypeError';
  }
}

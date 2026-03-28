export class HomeVideoDeleteResponse {
  success: boolean;
  message: string;
}

export class VideoNotFoundError extends Error {
  constructor(id: string) {
    super(`Video con ID '${id}' no encontrado.`);
    this.name = 'VideoNotFoundError';
  }
}

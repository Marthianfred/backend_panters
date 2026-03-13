export class UpdateContentRequest {
  constructor(
    public readonly contentId: string,
    public readonly creatorId: string,
    public readonly updates: {
      title?: string;
      description?: string;
      price?: number;
      accessType?: string;
    },
  ) {}
}

export class UpdateContentResponse {
  constructor(
    public readonly success: boolean,
    public readonly message: string,
  ) {}
}

export class ContentNotFoundError extends Error {
  constructor() {
    super('Contenido no encontrado.');
  }
}

export class UnauthorizedUpdateError extends Error {
  constructor() {
    super('No tiene permisos para actualizar este contenido.');
  }
}

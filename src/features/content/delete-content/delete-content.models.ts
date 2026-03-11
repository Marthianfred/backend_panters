export class DeleteContentRequest {
  constructor(
    public readonly contentId: string,
    public readonly creatorId: string,
  ) {}
}

export class DeleteContentResponse {
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

export class UnauthorizedDeleteError extends Error {
  constructor() {
    super('No tiene permisos para eliminar este contenido.');
  }
}

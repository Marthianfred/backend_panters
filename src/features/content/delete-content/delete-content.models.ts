import { NotFoundException, ForbiddenException } from '@nestjs/common';

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

export class ContentNotFoundError extends NotFoundException {
  constructor() {
    super('Contenido no encontrado.');
  }
}

export class UnauthorizedDeleteError extends ForbiddenException {
  constructor() {
    super('No tiene permisos para eliminar este contenido.');
  }
}

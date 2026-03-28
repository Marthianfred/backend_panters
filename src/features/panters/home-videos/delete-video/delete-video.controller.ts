import { Controller, Delete, Param, HttpStatus, HttpException, ParseUUIDPipe } from '@nestjs/common';
import { DeleteHomeVideoHandler } from './delete-video.handler';
import { HomeVideoDeleteResponse, VideoNotFoundError } from './delete-video.models';

@Controller('api/v1/panters/home-videos')
export class DeleteHomeVideoController {
  constructor(private readonly handler: DeleteHomeVideoHandler) {}

  @Delete(':id')
  public async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<HomeVideoDeleteResponse> {
    try {
      return await this.handler.execute(id);
    } catch (error) {
      if (error instanceof VideoNotFoundError) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Falla del servidor al eliminar el video.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

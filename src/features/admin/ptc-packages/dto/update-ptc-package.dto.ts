import { PartialType } from '@nestjs/swagger';
import { CreatePtcPackageDto } from './create-ptc-package.dto';

export class UpdatePtcPackageDto extends PartialType(CreatePtcPackageDto) {}

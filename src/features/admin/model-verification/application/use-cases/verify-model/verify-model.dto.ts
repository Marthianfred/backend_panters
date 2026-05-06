import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';

export enum VerificationDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class VerifyModelRequest {
  @IsUUID()
  @IsNotEmpty()
  verificationId!: string;

  @IsEnum(VerificationDecision)
  @IsNotEmpty()
  decision!: VerificationDecision;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

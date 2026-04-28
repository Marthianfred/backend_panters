import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResendEmailService } from './resend-email.service';
import { EMAIL_SERVICE_TOKEN } from '../../domain/services/email-service.interface';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EMAIL_SERVICE_TOKEN,
      useClass: ResendEmailService,
    },
  ],
  exports: [EMAIL_SERVICE_TOKEN],
})
export class EmailModule {}

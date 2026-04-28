import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  EmailService,
  SendEmailOptions,
} from '../../domain/services/email-service.interface';

@Injectable()
export class ResendEmailService implements EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(ResendEmailService.name);
  private readonly defaultFrom: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.defaultFrom =
      this.configService.get<string>('EMAIL_FROM') ||
      'Panters <noreply@pantersdigital.com>';
  }

  async send(options: SendEmailOptions): Promise<{ data: any; error: any }> {
    try {
      this.logger.log(
        `Enviando correo a: ${options.to} - Asunto: ${options.subject}`,
      );

      const { data, error } = await this.resend.emails.send({
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        this.logger.error('Error al enviar correo con Resend:', error);
      }

      return { data, error };
    } catch (err) {
      this.logger.error('Error inesperado al enviar correo:', err);
      return { data: null, error: err };
    }
  }
}

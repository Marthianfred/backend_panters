export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailService {
  send(options: SendEmailOptions): Promise<{ data: unknown; error: unknown }>;
}

export const EMAIL_SERVICE_TOKEN = Symbol('EmailService');

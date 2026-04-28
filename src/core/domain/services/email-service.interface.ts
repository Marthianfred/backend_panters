export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailService {
  send(options: SendEmailOptions): Promise<{ data: any; error: any }>;
}

export const EMAIL_SERVICE_TOKEN = Symbol('EmailService');

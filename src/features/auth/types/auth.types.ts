import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  username?: string;
  displayUsername?: string;
  emailVerified: boolean;
  image?: string;
  roleId?: string;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser | null;
  session: Session | null;
}

export interface BetterAuthInstance {
  api: {
    getSession: (options: { headers: Headers }) => Promise<{
      user: AuthenticatedUser;
      session: Session;
    } | null>;
    signUpEmail: (options: Record<string, unknown>) => Promise<unknown>;
  };
  handler: (request: Request) => Promise<Response>;
  database?: unknown;
}

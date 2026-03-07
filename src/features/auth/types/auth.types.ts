import { Request } from 'express';

/**
 * Representa un usuario autenticado por BetterAuth.
 */
export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  role?: string;
}

/**
 * Representa una sesión activa de BetterAuth.
 */
export interface Session {
  id: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  userId: string;
}

/**
 * Extensión de la interfaz Request de Express para incluir los datos de autenticación.
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  session: Session;
}

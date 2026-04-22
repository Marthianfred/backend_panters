import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/features/auth/guards/auth.guard';
import { SubscriptionGuard } from './subscription.guard';
import { ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

/**
 * Decorador compuesto que asegura que el usuario esté autenticado
 * y tenga una suscripción activa.
 */
export function RequiresSubscription() {
  return applyDecorators(
    UseGuards(AuthGuard, SubscriptionGuard),
    ApiUnauthorizedResponse({ description: 'No autenticado' }),
    ApiForbiddenResponse({ description: 'Se requiere suscripción activa' }),
  );
}

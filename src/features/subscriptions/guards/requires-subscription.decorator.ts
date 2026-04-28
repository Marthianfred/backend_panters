import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/features/auth/guards/auth.guard';
import { SubscriptionGuard } from './subscription.guard';
import { ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';


export function RequiresSubscription() {
  return applyDecorators(
    UseGuards(AuthGuard, SubscriptionGuard),
    ApiUnauthorizedResponse({ description: 'No autenticado' }),
    ApiForbiddenResponse({ description: 'Se requiere suscripción activa' }),
  );
}

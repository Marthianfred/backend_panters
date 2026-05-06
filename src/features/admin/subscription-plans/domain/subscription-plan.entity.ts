export class SubscriptionPlanEntity {
  id: string;
  name: string;
  description: string | null;
  priceUsd: number;
  durationDays: number;
  benefits: string[];
  stripePriceId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<SubscriptionPlanEntity>) {
    Object.assign(this, partial);
  }
}

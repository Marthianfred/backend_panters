import { PayoutRequest } from '../entities/payout-request.entity';
import { PayoutStatus } from '../enums/payout-status.enum';

export interface IPayoutsRepository {
  create(payout: Partial<PayoutRequest>): Promise<PayoutRequest>;
  findById(id: string): Promise<PayoutRequest | null>;
  updateStatus(
    id: string,
    status: PayoutStatus,
    metadata?: {
      adminId?: string;
      approvedAt?: Date;
      confirmedAt?: Date;
      rejectedAt?: Date;
      rejectionReason?: string;
    },
  ): Promise<void>;
  findPendingApproval(): Promise<PayoutRequest[]>;
  findByCreatorId(creatorId: string): Promise<PayoutRequest[]>;
  findAdminHistory(): Promise<PayoutRequest[]>;
  getCreatorBalance(creatorId: string): Promise<number>;
  reserveBalance(creatorId: string, amount: number): Promise<void>;
}

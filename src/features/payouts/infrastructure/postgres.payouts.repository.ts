import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { IPayoutsRepository } from '../interfaces/payouts.repository.interface';
import { PayoutRequest } from '../entities/payout-request.entity';
import { PayoutStatus } from '../enums/payout-status.enum';

interface PayoutRequestRow {
  id: string;
  creator_id: string;
  amount: string | number;
  status: string;
  admin_id: string | null;
  approved_at: Date | null;
  confirmed_at: Date | null;
  rejected_at: Date | null;
  rejection_reason: string | null;
  created_at: Date;
  updated_at: Date;
  creator_name?: string;
}

@Injectable()
export class PostgresPayoutsRepository implements IPayoutsRepository {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  async create(payout: Partial<PayoutRequest>): Promise<PayoutRequest> {
    const query = `
      INSERT INTO public.payout_requests (
        id, creator_id, amount, status, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, NOW(), NOW()
      ) RETURNING *;
    `;

    const result = await this.pool.query<PayoutRequestRow>(query, [
      payout.creatorId,
      payout.amount,
      payout.status || PayoutStatus.PENDING_APPROVAL,
    ]);

    return this.mapRowToEntity(result.rows[0]);
  }

  async findById(id: string): Promise<PayoutRequest | null> {
    const result = await this.pool.query<PayoutRequestRow>(
      'SELECT * FROM public.payout_requests WHERE id = $1',
      [id],
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToEntity(result.rows[0]);
  }

  async updateStatus(
    id: string,
    status: PayoutStatus,
    metadata?: {
      adminId?: string;
      approvedAt?: Date;
      confirmedAt?: Date;
      rejectedAt?: Date;
      rejectionReason?: string;
    },
  ): Promise<void> {
    const query = `
      UPDATE public.payout_requests
      SET 
        status = $1,
        admin_id = COALESCE($2, admin_id),
        approved_at = COALESCE($3, approved_at),
        confirmed_at = COALESCE($4, confirmed_at),
        rejected_at = COALESCE($5, rejected_at),
        rejection_reason = COALESCE($6, rejection_reason),
        updated_at = NOW()
      WHERE id = $7;
    `;

    await this.pool.query(query, [
      status,
      metadata?.adminId || null,
      metadata?.approvedAt || null,
      metadata?.confirmedAt || null,
      metadata?.rejectedAt || null,
      metadata?.rejectionReason || null,
      id,
    ]);
  }

  async findPendingApproval(): Promise<PayoutRequest[]> {
    const query = `
      SELECT pr.*, u.name as creator_name 
      FROM public.payout_requests pr
      JOIN public."user" u ON pr.creator_id = u.id
      WHERE pr.status = 'PENDING_APPROVAL' 
      ORDER BY pr.created_at ASC
    `;
    const result = await this.pool.query<PayoutRequestRow>(query);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  async findByCreatorId(creatorId: string): Promise<PayoutRequest[]> {
    const query = `
      SELECT pr.*, u.name as creator_name 
      FROM public.payout_requests pr
      JOIN public."user" u ON pr.creator_id = u.id
      WHERE pr.creator_id = $1 
      ORDER BY pr.created_at DESC
    `;
    const result = await this.pool.query<PayoutRequestRow>(query, [creatorId]);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  async findAdminHistory(): Promise<PayoutRequest[]> {
    const query = `
      SELECT pr.*, u.name as creator_name 
      FROM public.payout_requests pr
      JOIN public."user" u ON pr.creator_id = u.id
      WHERE pr.status IN ('PENDING_RECEIPT_CONFIRMATION', 'COMPLETED', 'REJECTED')
      ORDER BY pr.updated_at DESC
    `;
    const result = await this.pool.query<PayoutRequestRow>(query);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  async getCreatorBalance(creatorId: string): Promise<number> {
    const result = await this.pool.query<{ net_balance: string | number }>(
      'SELECT net_balance FROM public.creator_wallets WHERE creator_id = $1',
      [creatorId],
    );

    if (result.rows.length === 0) return 0;
    return typeof result.rows[0].net_balance === 'string'
      ? parseFloat(result.rows[0].net_balance)
      : result.rows[0].net_balance;
  }

  async reserveBalance(creatorId: string, amount: number): Promise<void> {
    const query = `
      UPDATE public.creator_wallets
      SET 
        net_balance = net_balance - $1,
        updated_at = NOW()
      WHERE creator_id = $2 AND net_balance >= $1;
    `;

    const result = await this.pool.query(query, [amount, creatorId]);
    if (result.rowCount === 0) {
      throw new Error('Saldo insuficiente para realizar el cobro.');
    }
  }

  private mapRowToEntity(row: PayoutRequestRow): PayoutRequest {
    const entity = new PayoutRequest();
    entity.id = row.id;
    entity.creatorId = row.creator_id;
    entity.amount =
      typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount;
    entity.status = row.status as PayoutStatus;
    entity.adminId = row.admin_id;
    entity.approvedAt = row.approved_at;
    entity.confirmedAt = row.confirmed_at;
    entity.rejectedAt = row.rejected_at;
    entity.rejectionReason = row.rejection_reason;
    entity.createdAt = row.created_at;
    entity.updatedAt = row.updated_at;
    entity.creatorName = row.creator_name;
    return entity;
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { IVideoChatRepository, VideoCallSession } from '../interfaces/video-chat.repository.interface';

@Injectable()
export class PostgresVideoChatRepository implements IVideoChatRepository {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  async createSession(session: Partial<VideoCallSession>): Promise<VideoCallSession> {
    const query = `
      INSERT INTO video_call_sessions (creator_id, user_id, schedule_time, duration_minutes, price_coins, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, creator_id as "creatorId", user_id as "userId", schedule_time as "scheduleTime", 
                duration_minutes as "durationMinutes", price_coins as "priceCoins", status, stream_id as "streamId";
    `;
    const result = await this.pool.query(query, [
      session.creatorId,
      session.userId,
      session.scheduleTime || new Date(),
      session.durationMinutes,
      session.priceCoins,
      session.status || 'pending',
    ]);
    return result.rows[0];
  }

  async getSessionById(id: string): Promise<VideoCallSession | null> {
    const query = `
      SELECT v.id, v.creator_id as "creatorId", v.user_id as "userId", v.schedule_time as "scheduleTime", 
             v.duration_minutes as "durationMinutes", v.price_coins as "priceCoins", v.status, v.stream_id as "streamId",
             s.channel_arn as "channelArn"
      FROM video_call_sessions v
      LEFT JOIN antigravity_streams s ON v.stream_id = s.id
      WHERE v.id = $1;
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async updateSessionStatus(id: string, status: VideoCallSession['status']): Promise<void> {
    const query = 'UPDATE video_call_sessions SET status = $1, updated_at = NOW() WHERE id = $2;';
    await this.pool.query(query, [status, id]);
  }

  async updateSessionStream(id: string, streamId: string, channelArn: string): Promise<void> {
    const query = 'UPDATE video_call_sessions SET stream_id = $1, updated_at = NOW() WHERE id = $2;';
    await this.pool.query(query, [streamId, id]);
  }

  async userExists(userId: string): Promise<boolean> {
    const query = 'SELECT 1 FROM "user" WHERE id = $1;';
    const result = await this.pool.query(query, [userId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async processPayment(userId: string, creatorId: string, amount: number, description: string): Promise<{ transactionId: string; remainingBalance: number } | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const walletQuery = `
        UPDATE antigravity_wallets
        SET panter_coin_balance = panter_coin_balance - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2 AND panter_coin_balance >= $1
        RETURNING id as wallet_id, panter_coin_balance;
      `;
      const walletRes = await client.query(walletQuery, [amount, userId]);

      if (walletRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const walletId = walletRes.rows[0].wallet_id;
      const remainingBalance = parseFloat(walletRes.rows[0].panter_coin_balance);

      const netAmount = amount * 0.70;
      const platformCommission = amount * 0.30;

      const creatorWalletQuery = `
        INSERT INTO creator_wallets (creator_id, total_earned, net_balance, platform_commission, updated_at)
        VALUES ($1, $2, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (creator_id) DO UPDATE SET
          total_earned = creator_wallets.total_earned + EXCLUDED.total_earned,
          net_balance = creator_wallets.net_balance + EXCLUDED.net_balance,
          platform_commission = creator_wallets.platform_commission + EXCLUDED.platform_commission,
          updated_at = CURRENT_TIMESTAMP;
      `;
      await client.query(creatorWalletQuery, [creatorId, netAmount, platformCommission]);

      const transQuery = `
        INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference_id, created_at)
        VALUES ($1, 'debit', $2, $3, $4, CURRENT_TIMESTAMP)
        RETURNING id as transaction_id;
      `;
      const transRes = await client.query(transQuery, [
        walletId, 
        amount, 
        description, 
        `vc_${Date.now()}`
      ]);

      await client.query('COMMIT');

      return {
        transactionId: transRes.rows[0].transaction_id,
        remainingBalance
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

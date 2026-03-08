import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { IListGiftsRepository } from '../interfaces/list-gifts.repository.interface';
import { GiftDTO } from '../list-gifts.models';

@Injectable()
export class PostgresListGiftsRepository implements IListGiftsRepository {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  public async getAllActiveGifts(): Promise<GiftDTO[]> {
    const query = `
      SELECT 
        gift_id as id, 
        name, 
        price_coins as "priceCoins", 
        icon, 
        animation as "animationUrl"
      FROM virtual_gifts
      WHERE is_active = true
      ORDER BY price_coins ASC;
    `;
    const result = await this.pool.query(query);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      priceCoins: parseFloat(row.priceCoins),
      icon: row.icon,
      animationUrl: row.animationUrl,
    }));
  }
}

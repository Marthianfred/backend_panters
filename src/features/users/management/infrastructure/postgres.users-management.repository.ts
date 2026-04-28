import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
}

export interface UserManagementDetails {
  id: string;
  email: string;
  name: string;
  username: string | null;
  displayUsername: string | null;
  role: {
    id: string | null;
    name: string | null;
  };
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  profile: {
    fullName: string | null;
    avatarUrl: string | null;
    bio: string | null;
  } | null;
  wallet: {
    balance: number;
  } | null;
  creatorStats?: {
    totalEarned: number;
    netBalance: number;
    contentCount: number;
  };
}

@Injectable()
export class PostgresUsersManagementRepository {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  async listRoles(): Promise<RoleRecord[]> {
    const result = await this.pool.query(
      'SELECT id, name, description FROM public.roles ORDER BY name ASC',
    );
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
    }));
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    await this.pool.query(
      'UPDATE public."user" SET is_active = $1 WHERE id = $2',
      [isActive, userId],
    );
    
    await this.pool.query(
      'UPDATE public.antigravity_profiles SET is_active = $1 WHERE user_id = $2',
      [isActive, userId],
    );
  }

  async updateUserRole(userId: string, roleId: string): Promise<void> {
    
    const roleRes = await this.pool.query('SELECT name FROM public.roles WHERE id = $1', [roleId]);
    const roleName = roleRes.rows[0]?.name || 'subscriber';

    await this.pool.query(
      'UPDATE public."user" SET "roleId" = $1, "role" = $2 WHERE id = $3',
      [roleId, roleName, userId],
    );
  }

  async getUserDetails(userId: string): Promise<UserManagementDetails | null> {
    const userQuery = `
      SELECT 
        u.id, u.email, u.name, u.username, u."displayUsername", u."roleId" as "roleId", r.name as "roleName", u.is_active as "isActive", 
        u.must_change_password as "mustChangePassword", u."createdAt",
        ap.full_name as "fullName", ap.avatar_url as "avatarUrl", ap.bio,
        aw.panter_coin_balance as "walletBalance",
        cw.total_earned as "totalEarned", cw.net_balance as "netBalance",
        (SELECT COUNT(*) FROM public.content_items WHERE creator_id = u.id) as "contentCount"
      FROM public."user" u
      LEFT JOIN public.roles r ON r.id = u."roleId"
      LEFT JOIN public.antigravity_profiles ap ON ap.user_id = u.id
      LEFT JOIN public.antigravity_wallets aw ON aw.user_id = u.id
      LEFT JOIN public.creator_wallets cw ON cw.creator_id = u.id
      WHERE u.id = $1;
    `;

    const result = await this.pool.query(userQuery, [userId]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const details: UserManagementDetails = {
      id: row.id,
      email: row.email,
      name: row.name,
      username: row.username,
      displayUsername: row.displayUsername,
      role: {
        id: row.roleId,
        name: row.roleName,
      },
      isActive: row.isActive,
      mustChangePassword: row.mustChangePassword,
      createdAt: row.createdAt,
      profile: row.fullName
        ? {
            fullName: row.fullName,
            avatarUrl: row.avatarUrl,
            bio: row.bio,
          }
        : null,
      wallet:
        row.walletBalance !== null
          ? {
              balance: parseFloat(row.walletBalance),
            }
          : null,
    };

    if (row.roleName === 'model' || row.roleName === 'creator') {
      details.creatorStats = {
        totalEarned: parseFloat(row.totalEarned || '0'),
        netBalance: parseFloat(row.netBalance || '0'),
        contentCount: parseInt(row.contentCount || '0', 10),
      };
    }

    return details;
  }

  async moderateUserContent(
    contentId: string,
    status: 'archived' | 'blocked',
  ): Promise<void> {
    await this.pool.query(
      'UPDATE public.content_items SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, contentId],
    );
  }

  async setMustChangePassword(
    userId: string,
    mustChange: boolean,
  ): Promise<void> {
    await this.pool.query(
      'UPDATE public."user" SET must_change_password = $1 WHERE id = $2',
      [mustChange, userId],
    );
  }

  async exists(userId: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM public."user" WHERE id = $1',
      [userId],
    );
    return result.rows.length > 0;
  }

  async existsRole(roleId: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM public.roles WHERE id = $1',
      [roleId],
    );
    return result.rows.length > 0;
  }

  async listUsers(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ users: UserManagementDetails[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = '';
    const params: any[] = [limit, offset];

    if (search) {
      whereClause = 'WHERE u.email ILIKE $3 OR u.name ILIKE $3';
      params.push(`%${search}%`);
    }

    const query = `
      SELECT 
        u.id, u.email, u.name, u.username, u."displayUsername", u."roleId" as "roleId", r.name as "roleName", u.is_active as "isActive", 
        u.must_change_password as "mustChangePassword", u."createdAt",
        ap.full_name as "fullName", ap.avatar_url as "avatarUrl", ap.bio,
        aw.panter_coin_balance as "walletBalance"
      FROM public."user" u
      LEFT JOIN public.roles r ON r.id = u."roleId"
      LEFT JOIN public.antigravity_profiles ap ON ap.user_id = u.id
      LEFT JOIN public.antigravity_wallets aw ON aw.user_id = u.id
      ${whereClause}
      ORDER BY u."createdAt" DESC
      LIMIT $1 OFFSET $2;
    `;

    const countQuery = `SELECT COUNT(*) FROM public."user" u ${whereClause};`;

    const [usersRes, countRes] = await Promise.all([
      this.pool.query(query, params),
      this.pool.query(countQuery, search ? [`%${search}%`] : []),
    ]);

    const users = usersRes.rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      username: row.username,
      displayUsername: row.displayUsername,
      role: {
        id: row.roleId,
        name: row.roleName,
      },
      isActive: row.isActive,
      mustChangePassword: row.mustChangePassword,
      createdAt: row.createdAt,
      profile: row.fullName
        ? {
            fullName: row.fullName,
            avatarUrl: row.avatarUrl,
            bio: row.bio,
          }
        : null,
      wallet:
        row.walletBalance !== null
          ? {
              balance: parseFloat(row.walletBalance),
            }
          : null,
    }));

    return {
      users,
      total: parseInt(countRes.rows[0].count, 10),
    };
  }
}

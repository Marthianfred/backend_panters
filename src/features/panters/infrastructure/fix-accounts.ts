import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.*)/);
const databaseUrl = dbUrlMatch
  ? dbUrlMatch[1].replace(/"/g, '').trim()
  : process.env.DATABASE_URL;

async function fixAccounts() {
  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    console.log('Verificando cuentas Admin, Moderador y Cliente...');

    const updates = [
      {
        email: 'admin@panters.com',
        name: 'Administrador Master',
        image:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
      },
      {
        email: 'moderator@panters.com',
        name: 'Moderador Panters',
        image:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400',
      },
      {
        email: 'client@panters.com',
        name: 'Freddy Client',
        image:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400',
      },
    ];

    for (const user of updates) {
      await client.query(
        `UPDATE "user" SET name = $1, image = $2 WHERE email = $3`,
        [user.name, user.image, user.email],
      );

      const userResult = await client.query(
        'SELECT id FROM "user" WHERE email = $1',
        [user.email],
      );
      if (userResult.rows.length > 0) {
        const userId = (userResult.rows[0] as { id: string }).id;
        await client.query(
          `INSERT INTO antigravity_profiles (user_id, full_name, avatar_url, bio) 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id) DO UPDATE SET full_name = $2, avatar_url = $3`,
          [userId, user.name, user.image, `Perfil de ${user.name}`],
        );
      }
    }

    console.log('Cuentas actualizadas con estética Premium.');
  } catch (error) {
    console.error('Error actualizando cuentas:', error);
  } finally {
    await client.end();
  }
}

void fixAccounts();

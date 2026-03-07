import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { hashPassword } from 'better-auth/crypto';

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
    const result = await client.query(
      `SELECT id, email FROM "user" WHERE role = 'model'`,
    );
    const users = result.rows;

    for (const u of users) {
      const accRes = await client.query(
        `SELECT id FROM "account" WHERE "userId" = $1`,
        [u.id],
      );
      if (accRes.rows.length === 0) {
        const hashed = await hashPassword('Panters2026!');
        await client.query(
          `
          INSERT INTO "account" (id, "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, $1, 'credential', $1, $2, now(), now())
        `,
          [u.id, hashed],
        );
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

fixAccounts();

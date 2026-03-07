import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env manually to avoid missing dotenv dependency issues
const envPath = path.resolve(__dirname, '../../../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.*)/);
const databaseUrl = dbUrlMatch
  ? dbUrlMatch[1].replace(/"/g, '').trim()
  : process.env.DATABASE_URL;

async function seedPanters() {
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log(
      'Conectado a la base de datos. Iniciando Seed de Chicas Panters...',
    );

    try {
      // Intentar agregar las columnas en caso de que no se haya corrido el init-schema.sql actualizado
      await client.query(`
        ALTER TABLE "antigravity_profiles" ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
        ALTER TABLE "antigravity_profiles" ADD COLUMN IF NOT EXISTS reviews_count INT DEFAULT 0;
        ALTER TABLE "antigravity_profiles" ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;
        ALTER TABLE "antigravity_profiles" ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;
      `);
      console.log('Columnas de perfil verificadas/actualizadas.');
    } catch (e) {
      console.log('Nota: no se pudieron crear las columnas automáticamente', e);
    }

    const seedQuery = `
      DO $$
      DECLARE
          v_user_id TEXT;
          i INT;
          v_names TEXT[] := ARRAY['Valentina', 'Isabella', 'Camila', 'Sofía', 'Mariana', 'Luciana', 'Valeria', 'Victoria', 'Martina', 'Daniela'];
          v_surnames TEXT[] := ARRAY['García', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Díaz', 'Martínez', 'Pérez', 'Romero', 'Sánchez'];
          v_services JSONB;
          v_full_name TEXT;
          v_is_vip BOOLEAN;
          v_is_online BOOLEAN;
          v_reviews_count INT;
          v_email TEXT;
      BEGIN
          FOR i IN 1..10 LOOP
              v_email := 'model' || i || '@panters.com';
              
              IF NOT EXISTS (SELECT 1 FROM "user" WHERE email = v_email) THEN
                  v_user_id := gen_random_uuid()::text;
                  v_full_name := v_names[i] || ' ' || v_surnames[i];
                  v_is_vip := (random() > 0.5);
                  v_is_online := (random() > 0.5);
                  v_reviews_count := floor(random() * 500);
                  
                  v_services := jsonb_build_array(
                      jsonb_build_object('name', 'Suscripción Básica', 'type', 'subscription', 'price', floor(random() * 50 + 10)),
                      jsonb_build_object('name', 'Pack de Fotos VIP', 'type', 'content', 'price', floor(random() * 100 + 20)),
                      jsonb_build_object('name', 'Videollamada Privada (30m)', 'type', 'streaming', 'price', floor(random() * 200 + 50))
                  );

                  INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role)
                  VALUES (
                      v_user_id, 
                      v_full_name, 
                      v_email, 
                      true, 
                      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || v_user_id, 
                      now(), 
                      now(), 
                      'model'
                  );

                  INSERT INTO "antigravity_profiles" (user_id, full_name, avatar_url, bio, is_online, reviews_count, is_vip, services)
                  VALUES (
                      v_user_id,
                      v_full_name,
                      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || v_user_id,
                      'Hola, soy ' || v_full_name || ' y me encanta ser parte de Panters! Únete a mis transmisiones para contenido exclusivo.',
                      v_is_online,
                      v_reviews_count,
                      v_is_vip,
                      v_services
                  );

                  INSERT INTO "antigravity_wallets" (user_id, panter_coin_balance)
                  VALUES (v_user_id, floor(random() * 1000));

                  INSERT INTO "creator_wallets" (creator_id, total_earned, platform_commission, net_balance)
                  VALUES (v_user_id, 0, 0, 0);
              END IF;
          END LOOP;
      END $$;
    `;

    await client.query(seedQuery);
    console.log(
      'Seed ejecutado exitosamente. Se crearon/verificaron 10 chicas panters.',
    );
  } catch (error) {
    console.error('Error ejecutando el Seed:', error);
  } finally {
    await client.end();
  }
}

seedPanters();

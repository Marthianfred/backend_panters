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
          v_content_id UUID;
          i INT;
          j INT;
          v_names TEXT[] := ARRAY['Valentina', 'Isabella', 'Camila', 'Sofía', 'Mariana', 'Luciana', 'Valeria', 'Victoria', 'Martina', 'Daniela'];
          v_surnames TEXT[] := ARRAY['García', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Díaz', 'Martínez', 'Pérez', 'Romero', 'Sánchez'];
          v_avatars TEXT[] := ARRAY[
              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400',
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
              'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400',
              'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400',
              'https://images.unsplash.com/photo-1503185912284-5271ff81b9a8?q=80&w=400',
              'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400',
              'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=400',
              'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=400',
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400',
              'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400'
          ];
          v_content_images TEXT[] := ARRAY[
              'https://images.unsplash.com/photo-1616091093714-c64882e9ab55?q=80&w=800',
              'https://images.unsplash.com/photo-1502323777036-f41e4aa66099?q=80&w=800',
              'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800',
              'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800'
          ];
          v_services JSONB;
          v_full_name TEXT;
          v_is_vip BOOLEAN;
          v_is_online BOOLEAN;
          v_reviews_count INT;
          v_email TEXT;
          v_avatar TEXT;
      BEGIN
          -- Limpiar modelos generadas anteriormente por el Mock de Dicebear para forzar el Update Premium
          DELETE FROM "user" WHERE email LIKE 'model%@panters.com';
          
          FOR i IN 1..10 LOOP
              v_email := 'model' || i || '@panters.com';
              v_user_id := gen_random_uuid()::text;
              v_full_name := v_names[i] || ' ' || v_surnames[i];
              v_avatar := v_avatars[i];
              v_is_vip := (random() > 0.5);
              v_is_online := (random() > 0.5);
              v_reviews_count := floor(random() * 500);
              
              v_services := jsonb_build_array(
                  jsonb_build_object('name', 'Suscripción Básica', 'type', 'subscription', 'price', floor(random() * 50 + 10)),
                  jsonb_build_object('name', 'Pack de Fotos VIP', 'type', 'content', 'price', floor(random() * 100 + 20)),
                  jsonb_build_object('name', 'Videollamada Privada (30m)', 'type', 'streaming', 'price', floor(random() * 200 + 50))
              );

              -- 1. Insertar Usuario
              INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role)
              VALUES (
                  v_user_id, 
                  v_full_name, 
                  v_email, 
                  true, 
                  v_avatar, 
                  now(), 
                  now(), 
                  'model'
              );

              -- 2. Insertar su Perfil
              INSERT INTO "antigravity_profiles" (user_id, full_name, avatar_url, bio, is_online, reviews_count, is_vip, services)
              VALUES (
                  v_user_id,
                  v_full_name,
                  v_avatar,
                  'Hola, soy ' || v_full_name || ' y me encanta ser parte de Panters! Desbloquea mi contenido premium abajo. 🔥',
                  v_is_online,
                  v_reviews_count,
                  v_is_vip,
                  v_services
              );

              -- 3. Crear Wallets
              INSERT INTO "antigravity_wallets" (user_id, panter_coin_balance)
              VALUES (v_user_id, floor(random() * 1000));

              INSERT INTO "creator_wallets" (creator_id, total_earned, platform_commission, net_balance)
              VALUES (v_user_id, 0, 0, 0);
              
              -- 4. Inyectar CONTENIDO PREMIUM REAL (Videos/Photos Posts)
              -- Cada chica tendrá entre 2 y 4 posts aleatorios
              FOR j IN 1..(floor(random() * 3) + 2) LOOP
                  v_content_id := gen_random_uuid();
                  
                  -- Simulamos una inserción a content_items
                  INSERT INTO "content_items" (
                      id, creator_id, title, description, type, price_coins, file_url, thumbnail, status
                  ) VALUES (
                      v_content_id, 
                      v_user_id, 
                      'Sesión Privada Exclusive #' || j, 
                      'Disfruta de este contenido único que prepare especialmente para ti. 💖', 
                      'photo', 
                      floor(random() * 500 + 50), 
                      v_content_images[floor(random() * 4) + 1], 
                      v_content_images[floor(random() * 4) + 1], 
                      'published'
                  );
              END LOOP;

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

void seedPanters();

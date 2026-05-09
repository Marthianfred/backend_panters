-- Archivo: src/features/auth/infrastructure/init-schema.sql
-- Este script inicializa TODAS las tablas necesarias para el ecosistema Panters.
-- Actualizado según el estado real de la base de datos.

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================================================
-- 1. BETTER AUTH (Nucleo de Usuarios y Sesiones)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "roles" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Roles Iniciales
INSERT INTO "roles" (id, name, description) VALUES 
('c901e6a7-f58c-493e-b567-5d554a32ac46', 'admin', 'Administrador con acceso total al sistema'),
('f88b9012-bd7c-47ea-a2a9-c70a84d2f831', 'model', 'Usuario con capacidades de creación de contenido premium'),
('d80b1a31-4521-4ec0-9329-30d4d1adc025', 'subscriber', 'Usuario consumidor de contenido')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL,
    image TEXT,
    "createdAt" TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP NOT NULL,
    username TEXT,
    "birthDate" TEXT,
    gender TEXT,
    age INTEGER,
    "displayUsername" TEXT,
    is_active BOOLEAN DEFAULT true,
    must_change_password BOOLEAN DEFAULT false,
    "roleId" UUID NOT NULL REFERENCES "roles"(id) DEFAULT 'd80b1a31-4521-4ec0-9329-30d4d1adc025',
    role TEXT
);

CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMP NOT NULL,
    token TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP,
    "refreshTokenExpiresAt" TIMESTAMP,
    scope TEXT,
    password TEXT,
    "createdAt" TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP,
    "updatedAt" TIMESTAMP
);

-- ===========================================================================
-- 2. PROFILES (Perfiles de Usuarios)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "antigravity_profiles" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id TEXT NOT NULL UNIQUE REFERENCES "user" (id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    is_online BOOLEAN DEFAULT false,
    reviews_count INT DEFAULT 0,
    is_vip BOOLEAN DEFAULT false,
    services JSONB DEFAULT '[]'::jsonb,
    username TEXT,
    birth_date DATE,
    gender TEXT,
    age INTEGER,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ===========================================================================
-- 3. WALLET (Billetera y Economía Digital)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "antigravity_wallets" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id TEXT NOT NULL UNIQUE REFERENCES "user" (id) ON DELETE CASCADE,
    panter_coin_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT balance_must_be_positive CHECK (panter_coin_balance >= 0)
);

CREATE TABLE IF NOT EXISTS "creator_wallets" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    creator_id TEXT NOT NULL UNIQUE REFERENCES "user" (id) ON DELETE CASCADE,
    total_earned NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    platform_commission NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    net_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('credit', 'debit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "wallet_transactions" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    wallet_id UUID NOT NULL REFERENCES antigravity_wallets (id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    description TEXT NOT NULL,
    reference_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT amount_must_be_positive CHECK (amount > 0)
);

-- ===========================================================================
-- 4. CONTENT (Marketplace y Multimedia)
-- ===========================================================================
DO $$ BEGIN
    CREATE TYPE content_type AS ENUM ('photo', 'video', 'pack');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "content_items" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    creator_id TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type content_type NOT NULL,
    price_coins NUMERIC(15, 2) NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail TEXT,
    status content_status NOT NULL DEFAULT 'draft',
    access_type TEXT NOT NULL DEFAULT 'free',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT price_must_be_positive CHECK (price_coins >= 0)
);

CREATE TABLE IF NOT EXISTS "content_purchases" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    content_item_id UUID NOT NULL REFERENCES content_items (id) ON DELETE RESTRICT,
    price_paid NUMERIC(15, 2) NOT NULL,
    transaction_id UUID REFERENCES wallet_transactions (id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_content_purchase UNIQUE (user_id, content_item_id)
);

-- ===========================================================================
-- 5. STREAMING (Kinesis y Videollamadas)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "antigravity_streams" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    creator_id TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    channel_arn TEXT NOT NULL UNIQUE,
    aws_region TEXT NOT NULL,
    s3_thumbnail_bucket TEXT NOT NULL,
    s3_thumbnail_key TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('pending', 'accepted', 'completed', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "video_call_sessions" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    creator_id TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    schedule_time TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL,
    price_coins NUMERIC(15, 2) NOT NULL,
    status session_status NOT NULL DEFAULT 'pending',
    stream_id UUID REFERENCES antigravity_streams (id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT duration_positive CHECK (duration_minutes > 0),
    CONSTRAINT price_positive CHECK (price_coins >= 0)
);

-- Índices de optimización
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions (wallet_id);
CREATE INDEX IF NOT EXISTS idx_content_items_creator_status ON content_items (creator_id, status);
CREATE INDEX IF NOT EXISTS idx_video_calls_users ON video_call_sessions (creator_id, user_id);

-- ===========================================================================
-- 6. SUBSCRIPTIONS (Planes y Suscripciones)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "subscription_plans" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    price_usd NUMERIC NOT NULL,
    duration_days INTEGER NOT NULL,
    benefits JSONB DEFAULT '[]'::jsonb,
    stripe_price_id VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_subscriptions" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES "subscription_plans"(id) ON DELETE CASCADE,
    status VARCHAR NOT NULL DEFAULT 'pending',
    payment_gateway VARCHAR,
    external_subscription_id VARCHAR,
    cancel_at_period_end BOOLEAN DEFAULT false,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===========================================================================
-- 7. PTC PACKAGES (Panter Coins)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "ptc_packages" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    ptc_amount INTEGER NOT NULL,
    stripe_price_id VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT true,
    price_usd NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ===========================================================================
-- 8. CONTENT EXTRA (Reacciones, Ratings y Multimedia)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "home_loop_videos" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    url TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'video/webm',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "post_reactions" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    post_id UUID NOT NULL, -- Se asocia a posts en Kinesis o DB externa
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "panter_ratings" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    subscriber_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ===========================================================================
-- 9. GIFTS (Regalos Virtuales)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "virtual_gifts" (
    gift_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price_coins NUMERIC NOT NULL,
    icon TEXT NOT NULL,
    animation TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "gift_transactions" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    creator_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    gift_id UUID REFERENCES virtual_gifts(gift_id) ON DELETE SET NULL,
    coins_spent NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================================
-- 10. STRIPE TRACKING (Eventos Procesados)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "stripe_processed_events" (
    id VARCHAR PRIMARY KEY,
    type VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================================
-- 11. NOTIFICATIONS & PUSH (Mensajería y Web Push)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "notifications" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    body VARCHAR NOT NULL,
    data JSONB,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_push_subscriptions" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    endpoint VARCHAR NOT NULL,
    p256dh VARCHAR NOT NULL,
    auth VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ===========================================================================
-- 12. PAYOUTS (Solicitudes de Cobro)
-- ===========================================================================
DO $$ BEGIN
    CREATE TYPE payout_status AS ENUM (
        'PENDING_APPROVAL', 
        'PENDING_RECEIPT_CONFIRMATION', 
        'COMPLETED', 
        'REJECTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "payout_requests" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    status payout_status NOT NULL DEFAULT 'PENDING_APPROVAL',
    admin_id TEXT REFERENCES "user"(id),
    approved_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_creator_id ON payout_requests (creator_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests (status);

-- ===========================================================================
-- 13. MODEL VERIFICATION (Verificación de Modelos)
-- ===========================================================================
DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "model_verifications" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
    status verification_status DEFAULT 'PENDING',
    rejection_reason TEXT,
    admin_id TEXT REFERENCES "user"(id),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_model_verifications_user_id ON model_verifications (user_id);
CREATE INDEX IF NOT EXISTS idx_model_verifications_status ON model_verifications (status);
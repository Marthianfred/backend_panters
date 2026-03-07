-- Archivo: src/features/auth/infrastructure/init-schema.sql
-- Este script inicializa TODAS las tablas necesarias para el ecosistema Panters.

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================================================
-- 1. BETTER AUTH (Nucleo de Usuarios y Sesiones)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL,
    image TEXT,
    "createdAt" TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP NOT NULL,
    role TEXT DEFAULT 'subscriber'
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
    CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
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
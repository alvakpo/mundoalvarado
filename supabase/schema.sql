-- ============================================================
-- ESQUEMA SUPABASE - MUNDO ALVARADO
-- Club Atlético Alvarado - Programa de Beneficios
-- ============================================================
-- Ejecutar este script en el SQL Editor de Supabase

-- ---- EXTENSIONES ----
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---- TIPOS ENUMERADOS ----
CREATE TYPE member_category AS ENUM (
  'activo',
  'activo_protector',
  'cancha',
  'cancha_protector'
);

CREATE TYPE member_status AS ENUM (
  'al_dia',
  'con_deuda'
);

CREATE TYPE referral_status AS ENUM (
  'pending',
  'active',
  'inactive'
);

-- ============================================================
-- TABLA: profiles
-- Perfil de usuario de la app (separado de auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  brio_member_id TEXT,                    -- ID en Brío (futuro)
  member_number TEXT,                     -- Número visible de socio
  referral_code TEXT NOT NULL UNIQUE,     -- Código de referido (estable)
  public_alias TEXT NOT NULL UNIQUE,      -- Alias público (puede cambiar)
  referred_by_app_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_profiles_brio_member_id ON public.profiles(brio_member_id);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX idx_profiles_public_alias ON public.profiles(public_alias);
CREATE INDEX idx_profiles_referred_by ON public.profiles(referred_by_app_user_id);

-- ============================================================
-- TABLA: members
-- Datos societarios (cacheados desde Brío o ingresados manualmente)
-- ============================================================
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  brio_member_id TEXT,
  member_number TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  category member_category NOT NULL DEFAULT 'activo',
  status member_status NOT NULL DEFAULT 'al_dia',
  phone TEXT,
  photo_url TEXT,
  email TEXT,
  -- Metadata de sincronización con Brío
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_members_app_user_id ON public.members(app_user_id);
CREATE INDEX idx_members_brio_member_id ON public.members(brio_member_id);
CREATE INDEX idx_members_status ON public.members(status);

-- ============================================================
-- TABLA: referrals
-- Relaciones de referido (estable, basada en IDs internos)
-- ============================================================
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_app_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_app_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status referral_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_referral CHECK (referrer_app_user_id != referred_app_user_id)
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_app_user_id);
CREATE INDEX idx_referrals_referred ON public.referrals(referred_app_user_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);

-- ============================================================
-- TABLA: monthly_chances
-- Chances del sorteo general mensual por usuario
-- ============================================================
CREATE TABLE public.monthly_chances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month SMALLINT NOT NULL CHECK (month >= 1 AND month <= 12),
  year SMALLINT NOT NULL CHECK (year >= 2024),
  base_chances SMALLINT NOT NULL DEFAULT 0,
  referral_chances SMALLINT NOT NULL DEFAULT 0,
  total_chances SMALLINT NOT NULL DEFAULT 0,
  breakdown JSONB,                        -- Detalle del cálculo
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(app_user_id, month, year)
);

CREATE INDEX idx_monthly_chances_user ON public.monthly_chances(app_user_id);
CREATE INDEX idx_monthly_chances_period ON public.monthly_chances(year, month);

-- ============================================================
-- TABLA: annual_monthly_snapshots
-- Chances generadas para el premio anual, por mes
-- Guardadas permanentemente - NO recalcular destruyendo datos
-- ============================================================
CREATE TABLE public.annual_monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month SMALLINT NOT NULL CHECK (month >= 1 AND month <= 12),
  year SMALLINT NOT NULL CHECK (year >= 2024),
  chances_this_month SMALLINT NOT NULL DEFAULT 0,
  breakdown JSONB,
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- Cuándo se tomó el snapshot
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(app_user_id, month, year)
);

CREATE INDEX idx_annual_snapshots_user ON public.annual_monthly_snapshots(app_user_id);
CREATE INDEX idx_annual_snapshots_period ON public.annual_monthly_snapshots(year, month);

-- ============================================================
-- TABLA: annual_chances
-- Acumulado anual de chances (calculado a partir de snapshots)
-- ============================================================
CREATE TABLE public.annual_chances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year SMALLINT NOT NULL CHECK (year >= 2024),
  total_accumulated SMALLINT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(app_user_id, year)
);

CREATE INDEX idx_annual_chances_user ON public.annual_chances(app_user_id);

-- ============================================================
-- FUNCIÓN: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Un usuario solo puede ver sus propios datos y los de su red
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_chances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_chances ENABLE ROW LEVEL SECURITY;

-- ---- POLÍTICAS: profiles ----
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (app_user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (app_user_id = auth.uid());

-- Usuarios pueden ver el alias público de sus referentes (para el banner de registro)
CREATE POLICY "Public alias is readable for referral resolution"
  ON public.profiles FOR SELECT
  USING (TRUE); -- El alias es público para resolver el link /r/{alias}
-- Nota: No expone datos sensibles, solo public_alias y referral_code

-- ---- POLÍTICAS: members ----
CREATE POLICY "Users can view their own member data"
  ON public.members FOR SELECT
  USING (app_user_id = auth.uid());

-- Ver datos de referidos directos propios
CREATE POLICY "Users can view their direct referrals member data"
  ON public.members FOR SELECT
  USING (
    app_user_id IN (
      SELECT referred_app_user_id FROM public.referrals
      WHERE referrer_app_user_id = auth.uid() AND status = 'active'
    )
  );

-- Ver datos de segundo nivel (referidos de mis referidos)
CREATE POLICY "Users can view second level referrals member data"
  ON public.members FOR SELECT
  USING (
    app_user_id IN (
      SELECT r2.referred_app_user_id FROM public.referrals r1
      JOIN public.referrals r2 ON r2.referrer_app_user_id = r1.referred_app_user_id
      WHERE r1.referrer_app_user_id = auth.uid()
        AND r1.status = 'active'
        AND r2.status = 'active'
    )
  );

-- ---- POLÍTICAS: referrals ----
CREATE POLICY "Users can view referrals where they are the referrer"
  ON public.referrals FOR SELECT
  USING (referrer_app_user_id = auth.uid());

CREATE POLICY "Users can view their own referral record"
  ON public.referrals FOR SELECT
  USING (referred_app_user_id = auth.uid());

-- ---- POLÍTICAS: monthly_chances ----
CREATE POLICY "Users can view their own monthly chances"
  ON public.monthly_chances FOR SELECT
  USING (app_user_id = auth.uid());

-- ---- POLÍTICAS: annual_monthly_snapshots ----
CREATE POLICY "Users can view their own annual snapshots"
  ON public.annual_monthly_snapshots FOR SELECT
  USING (app_user_id = auth.uid());

-- ---- POLÍTICAS: annual_chances ----
CREATE POLICY "Users can view their own annual chances"
  ON public.annual_chances FOR SELECT
  USING (app_user_id = auth.uid());

-- ============================================================
-- FUNCIÓN: Obtener red de referidos de un usuario
-- ============================================================
CREATE OR REPLACE FUNCTION get_referral_network(user_id UUID)
RETURNS TABLE (
  app_user_id UUID,
  level INTEGER,
  referrer_id UUID
) AS $$
BEGIN
  -- Nivel 1: referidos directos
  RETURN QUERY
    SELECT r.referred_app_user_id, 1, r.referrer_app_user_id
    FROM public.referrals r
    WHERE r.referrer_app_user_id = user_id AND r.status = 'active';

  -- Nivel 2: referidos de mis referidos
  RETURN QUERY
    SELECT r2.referred_app_user_id, 2, r2.referrer_app_user_id
    FROM public.referrals r1
    JOIN public.referrals r2 ON r2.referrer_app_user_id = r1.referred_app_user_id
    WHERE r1.referrer_app_user_id = user_id
      AND r1.status = 'active'
      AND r2.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

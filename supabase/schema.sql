-- ============================================================
-- ESQUEMA SUPABASE - MUNDO ALVARADO
-- Club Atlético Alvarado - Programa de Beneficios
-- ============================================================
-- Ejecutar este script en el SQL Editor de Supabase
--
-- Este archivo es el ESQUEMA BASE. Después hay que aplicar las
-- migraciones en orden, que agregan lo que vino después:
--   supabase/migrations/20261006000000_fix_rls_security.sql
--   supabase/migrations/20261007000000_privacy_second_level.sql
--   supabase/migrations/20261008000000_daily_points.sql
--   supabase/migrations/20261009000000_remove_grupales.sql
-- ============================================================

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

-- Unicidad case-insensitive: evita que "Marce" y "marce" resuelvan
-- a links distintos, y que un código se confunda con otro por case.
CREATE UNIQUE INDEX idx_profiles_public_alias_lower ON public.profiles(lower(public_alias));
CREATE UNIQUE INDEX idx_profiles_referral_code_upper ON public.profiles(upper(referral_code));

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

-- NOTA: acá estaban `annual_monthly_snapshots` y `annual_chances`, el
-- pozo del premio por armar red (Premios Grupales). El club lo eliminó
-- por ser demasiado complejo de explicar. Ver la migración:
--   supabase/migrations/20261009000000_remove_grupales.sql
-- Las chances del SORTEO GENERAL viven en `monthly_chances`, que se
-- mantiene: son la base del Sorteo anual.

-- ============================================================
-- FUNCIÓN: updated_at automático
-- ============================================================
-- search_path fijo: una función sin search_path explícito es un
-- vector de escalada si el caller puede anteponer un esquema.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

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

-- ============================================================
-- FUNCIONES DE APOYO PARA LAS POLÍTICAS
-- Deben declararse ANTES de las políticas que las usan: PostgreSQL
-- resuelve la expresión de la política al crear la política.
-- ============================================================

-- ------------------------------------------------------------
-- Resolución pública del link /r/{alias}
-- ------------------------------------------------------------
-- Devuelve SÓLO el código de referido y un nombre a mostrar, que es
-- lo que un link de invitación público legítimamente expone.
--
-- IMPORTANTE: reemplaza a la política `USING (TRUE)` del esquema
-- anterior. RLS es a nivel de FILA, no de columna: `USING (TRUE)`
-- sobre `profiles` dejaba leer TODAS las columnas de TODAS las filas
-- (brio_member_id, member_number, referred_by_app_user_id) a
-- cualquiera, incluso con la anon key.
--
-- Tampoco devuelve app_user_id: es el mismo UUID de auth.users y no
-- debe exponerse. El alta debe resolver código -> app_user_id del
-- lado servidor.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_referral_alias(alias_input TEXT)
RETURNS TABLE (referral_code TEXT, display_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    p.referral_code,
    COALESCE(NULLIF(btrim(m.first_name), ''), 'Un socio')
      || CASE
           WHEN COALESCE(m.last_name, '') <> '' THEN ' ' || left(m.last_name, 1) || '.'
           ELSE ''
         END
  FROM public.profiles p
  LEFT JOIN public.members m ON m.app_user_id = p.app_user_id
  WHERE lower(p.public_alias) = lower(btrim(alias_input))
     OR upper(p.referral_code) = upper(btrim(alias_input))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_referral_alias(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_referral_alias(TEXT) TO anon, authenticated;

-- NOTA: acá estaba `my_second_level()`, que devolvía el nombre de pila y
-- el estado de la red indirecta para el premio por armar red
-- (Premios Grupales). El club eliminó ese premio, y el segundo nivel ya
-- no se muestra en ninguna pantalla. Ver la migración:
--   supabase/migrations/20261009000000_remove_grupales.sql

-- ============================================================
-- POLÍTICAS
-- ============================================================

-- ---- profiles ----
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (app_user_id = auth.uid());

-- Necesaria para que el registro pueda crear el perfil.
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (app_user_id = auth.uid());

-- WITH CHECK evita que un UPDATE reasigne la fila a otro usuario.
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (app_user_id = auth.uid())
  WITH CHECK (app_user_id = auth.uid());

-- ---- members ----
-- Sólo uno mismo y los referidos DIRECTOS: son personas que el socio
-- invitó él mismo. El segundo nivel no entra acá, y tampoco se muestra
-- en ninguna pantalla del programa.
CREATE POLICY "members_visible_self_and_direct"
  ON public.members FOR SELECT TO authenticated
  USING (
    app_user_id = auth.uid()
    OR app_user_id IN (
      SELECT r.referred_app_user_id
      FROM public.referrals r
      WHERE r.referrer_app_user_id = auth.uid()
        AND r.status = 'active'
    )
  );

-- ---- referrals ----
CREATE POLICY "referrals_select_as_referrer"
  ON public.referrals FOR SELECT TO authenticated
  USING (referrer_app_user_id = auth.uid());

CREATE POLICY "referrals_select_as_referred"
  ON public.referrals FOR SELECT TO authenticated
  USING (referred_app_user_id = auth.uid());

-- ---- chances ----
-- Sólo lectura del propio historial. La escritura queda reservada a
-- service_role a propósito: estas tablas las llena el proceso de
-- cálculo/corte, nunca el cliente.
CREATE POLICY "monthly_chances_select_own"
  ON public.monthly_chances FOR SELECT TO authenticated
  USING (app_user_id = auth.uid());

-- ============================================================
-- Verificación posterior sugerida
-- ============================================================
-- Con la anon key (sin sesión), esto debe dar 0 filas o error:
--   SELECT * FROM public.profiles;
--
-- Con un usuario autenticado:
--   SELECT * FROM public.members;          -- SÓLO yo + mis referidos directos
--   SELECT * FROM public.monthly_chances;  -- mis chances del sorteo general
--
-- Si `SELECT * FROM public.members` devolviera gente que no es tu
-- referido directo, el RLS quedaría mal aplicado.
--
-- Y el resolutor público sólo debe devolver código + nombre:
--   SELECT * FROM public.resolve_referral_alias('marce');
-- ============================================================

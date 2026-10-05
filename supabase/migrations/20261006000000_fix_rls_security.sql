-- ============================================================
-- MUNDO ALVARADO — FIX DE SEGURIDAD RLS
-- ============================================================
-- Corrige 4 problemas del esquema inicial (20261005000000):
--
--   1. `profiles` era legible COMPLETA por cualquiera.
--      La política "Public alias is readable for referral resolution"
--      usaba USING (TRUE). RLS es a nivel de FILA, no de columna:
--      eso exponía todas las columnas de todas las filas
--      (brio_member_id, member_number, referred_by_app_user_id)
--      a cualquiera, incluso con la anon key.
--
--   2. `get_referral_network(user_id UUID)` era SECURITY DEFINER y
--      recibía el usuario por parámetro: cualquier autenticado podía
--      pedir la red de OTRO usuario salteando el RLS.
--
--   3. El 2º nivel de la red NUNCA era visible. La política de
--      `members` para 2º nivel hacía un JOIN sobre `referrals`, pero
--      el RLS de `referrals` sólo deja ver filas donde sos referrer o
--      referred. Las filas de r2 (referidos de mi referido) quedaban
--      filtradas -> la subconsulta devolvía vacío -> 0 filas visibles.
--
--   4. `profiles` no tenía política de INSERT: el registro desde el
--      cliente iba a fallar al crear el perfil.
--
-- Además: hardening de SECURITY DEFINER (search_path fijo), grants
-- explícitos y unicidad case-insensitive de alias y código.
--
-- Idempotente: se puede aplicar sobre una base ya inicializada.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Unicidad case-insensitive de alias y código de referido
--    (evita "Marce" y "marce" apuntando a links distintos)
--    NOTA: si ya existieran duplicados con distinto case, estos
--    índices fallan. Verificar antes:
--      SELECT lower(public_alias), count(*) FROM public.profiles
--      GROUP BY 1 HAVING count(*) > 1;
-- ------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_public_alias_lower
  ON public.profiles (lower(public_alias));

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code_upper
  ON public.profiles (upper(referral_code));

-- ============================================================
-- 1. RESOLUCIÓN PÚBLICA DEL LINK DE INVITACIÓN
-- ============================================================
-- Reemplaza la política USING (TRUE). Devuelve SOLO lo que un link
-- público de invitación legítimamente muestra: el código de referido
-- y un nombre a mostrar. No expone app_user_id (que es el mismo UUID
-- de auth.users), ni member_number, ni estado, ni contacto.
--
-- El registro debe resolver código -> app_user_id del lado servidor.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Public alias is readable for referral resolution" ON public.profiles;

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

-- ============================================================
-- 2. IDs VISIBLES PARA EL USUARIO ACTUAL
-- ============================================================
-- Fuente única de verdad para "qué socios puedo ver":
-- yo + mis referidos directos activos + el 2º nivel activo.
-- SECURITY DEFINER para poder atravesar el RLS de `referrals`,
-- que de otro modo bloquea el 2º nivel (problema 3).
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.visible_member_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid()
  WHERE auth.uid() IS NOT NULL

  UNION

  SELECT r.referred_app_user_id
  FROM public.referrals r
  WHERE r.referrer_app_user_id = auth.uid()
    AND r.status = 'active'

  UNION

  SELECT r2.referred_app_user_id
  FROM public.referrals r1
  JOIN public.referrals r2 ON r2.referrer_app_user_id = r1.referred_app_user_id
  WHERE r1.referrer_app_user_id = auth.uid()
    AND r1.status = 'active'
    AND r2.status = 'active';
$$;

REVOKE ALL ON FUNCTION public.visible_member_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.visible_member_ids() TO authenticated;

-- ============================================================
-- 3. POLÍTICAS: profiles
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

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

-- ============================================================
-- 4. POLÍTICAS: members
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own member data" ON public.members;
DROP POLICY IF EXISTS "Users can view their direct referrals member data" ON public.members;
DROP POLICY IF EXISTS "Users can view second level referrals member data" ON public.members;
DROP POLICY IF EXISTS "members_visible_in_own_network" ON public.members;

-- Una sola política que sí hace visible el 2º nivel.
CREATE POLICY "members_visible_in_own_network"
  ON public.members FOR SELECT TO authenticated
  USING (app_user_id IN (SELECT public.visible_member_ids()));

-- ============================================================
-- 5. POLÍTICAS: referrals
-- ============================================================
DROP POLICY IF EXISTS "Users can view referrals where they are the referrer" ON public.referrals;
DROP POLICY IF EXISTS "Users can view their own referral record" ON public.referrals;
DROP POLICY IF EXISTS "referrals_select_as_referrer" ON public.referrals;
DROP POLICY IF EXISTS "referrals_select_as_referred" ON public.referrals;

CREATE POLICY "referrals_select_as_referrer"
  ON public.referrals FOR SELECT TO authenticated
  USING (referrer_app_user_id = auth.uid());

CREATE POLICY "referrals_select_as_referred"
  ON public.referrals FOR SELECT TO authenticated
  USING (referred_app_user_id = auth.uid());

-- ============================================================
-- 6. POLÍTICAS: chances
-- ============================================================
-- Sólo lectura del propio historial. La escritura queda reservada a
-- service_role a propósito: estas tablas las llena el proceso de
-- cálculo/corte, nunca el cliente.
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own monthly chances" ON public.monthly_chances;
CREATE POLICY "monthly_chances_select_own"
  ON public.monthly_chances FOR SELECT TO authenticated
  USING (app_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own annual snapshots" ON public.annual_monthly_snapshots;
CREATE POLICY "annual_monthly_snapshots_select_own"
  ON public.annual_monthly_snapshots FOR SELECT TO authenticated
  USING (app_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own annual chances" ON public.annual_chances;
CREATE POLICY "annual_chances_select_own"
  ON public.annual_chances FOR SELECT TO authenticated
  USING (app_user_id = auth.uid());

-- ============================================================
-- 7. get_referral_network: sin parámetro de usuario
-- ============================================================
-- La versión anterior aceptaba user_id por parámetro y era
-- SECURITY DEFINER -> cualquiera podía leer la red ajena.
-- Ahora opera siempre sobre auth.uid().
-- ------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_referral_network(UUID);

CREATE OR REPLACE FUNCTION public.get_referral_network()
RETURNS TABLE (app_user_id UUID, level INTEGER, referrer_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT r.referred_app_user_id, 1, r.referrer_app_user_id
  FROM public.referrals r
  WHERE r.referrer_app_user_id = auth.uid()
    AND r.status = 'active'

  UNION ALL

  SELECT r2.referred_app_user_id, 2, r2.referrer_app_user_id
  FROM public.referrals r1
  JOIN public.referrals r2 ON r2.referrer_app_user_id = r1.referred_app_user_id
  WHERE r1.referrer_app_user_id = auth.uid()
    AND r1.status = 'active'
    AND r2.status = 'active';
$$;

REVOKE ALL ON FUNCTION public.get_referral_network() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_referral_network() TO authenticated;

-- ============================================================
-- 8. HARDENING: search_path de las funciones preexistentes
-- ============================================================
-- Una función SECURITY DEFINER sin search_path fijo es un vector de
-- escalada (el caller puede anteponer un esquema con una función
-- homónima). update_updated_at_column no es SECURITY DEFINER, pero
-- se fija igual por prolijidad.
-- ------------------------------------------------------------
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

-- ============================================================
-- 9. Verificación posterior sugerida
-- ============================================================
-- Con la anon key (sin sesión), esto debe dar 0 filas o error:
--   SELECT * FROM public.profiles;
--
-- Con un usuario autenticado, esto sólo debe devolver su propia red:
--   SELECT * FROM public.get_referral_network();
--   SELECT * FROM public.members;
--
-- Y el resolutor público sólo debe devolver código + nombre:
--   SELECT * FROM public.resolve_referral_alias('marce');
-- ============================================================

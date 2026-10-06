-- ============================================================
-- MUNDO ALVARADO — PUNTOS DIARIOS
-- ============================================================
-- Regla: el socio entra una vez por día y reclama 100 puntos. Los días
-- seguidos (racha) son el gancho para que vuelva.
--
-- LAS DOS COSAS QUE HACEN QUE ESTO ESTÉ BIEN HECHO:
--
-- 1. EL DÍA LO DEFINE EL SERVIDOR, EN HORA DEL CLUB.
--    Si el "día nuevo" se calculara en UTC, llegaría a las 21:00 de
--    Mar del Plata: un socio podría reclamar a las 20:00 y otra vez a
--    las 22:00, y serían dos días distintos para el sistema. Acá se usa
--    siempre `club_today()`, que devuelve la fecha en
--    America/Argentina/Buenos_Aires.
--
-- 2. RECLAMAR DOS VECES ES IMPOSIBLE, NO IMPROBABLE.
--    La regla no es un `if` en la aplicación: es una restricción
--    UNIQUE(app_user_id, claim_date). Aunque el socio edite el
--    almacenamiento del navegador, cambie el reloj de su celular o
--    mande dos pedidos al mismo tiempo, la base rechaza el segundo.
--
-- Además, el saldo NO se guarda como un número suelto: se guarda un
-- LIBRO DE MOVIMIENTOS (point_ledger) y el saldo se calcula sumando.
-- Así siempre se puede explicar de dónde salió cada punto, y un error
-- se corrige agregando un movimiento, sin reescribir la historia.
--
-- Idempotente: se puede aplicar sobre una base ya inicializada.
-- ============================================================

-- ------------------------------------------------------------
-- Tipo para el estado de un canje
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'redemption_status') THEN
    CREATE TYPE public.redemption_status AS ENUM ('pending', 'delivered', 'cancelled');
  END IF;
END
$$;

-- ------------------------------------------------------------
-- TABLA: daily_point_claims
-- Un reclamo por socio por día. Acá vive la regla.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_point_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_date DATE NOT NULL,               -- fecha en hora del club
  points_awarded INTEGER NOT NULL,
  streak_day INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_claim_per_day UNIQUE (app_user_id, claim_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_claims_user_date
  ON public.daily_point_claims(app_user_id, claim_date DESC);

-- ------------------------------------------------------------
-- TABLA: point_ledger — libro de movimientos (sólo se agrega)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.point_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,                 -- +100 reclamo diario, -500 canje
  reason TEXT NOT NULL,                   -- 'daily_claim' | 'redemption' | 'adjustment'
  reference_id UUID,                      -- a qué canje corresponde, si aplica
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_ledger_user
  ON public.point_ledger(app_user_id, created_at DESC);

-- ------------------------------------------------------------
-- TABLA: rewards — catálogo de premios (lo carga el club)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cost_points INTEGER NOT NULL CHECK (cost_points > 0),
  emoji TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  stock INTEGER,                          -- NULL = sin límite
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABLA: reward_redemptions — canjes pedidos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id),
  cost_points INTEGER NOT NULL,
  status public.redemption_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user
  ON public.reward_redemptions(app_user_id, created_at DESC);

-- Triggers de updated_at (la función ya existe del esquema inicial)
DROP TRIGGER IF EXISTS update_rewards_updated_at ON public.rewards;
CREATE TRIGGER update_rewards_updated_at
  BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_redemptions_updated_at ON public.reward_redemptions;
CREATE TRIGGER update_redemptions_updated_at
  BEFORE UPDATE ON public.reward_redemptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCIONES
-- ============================================================

-- ------------------------------------------------------------
-- club_today(): la fecha de hoy en Mar del Plata
-- ------------------------------------------------------------
-- Es la única definición de "hoy" en todo el sistema. Nada más debe
-- calcular fechas por su cuenta.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.club_today()
RETURNS DATE
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
$$;

REVOKE ALL ON FUNCTION public.club_today() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.club_today() TO authenticated;

-- ------------------------------------------------------------
-- claim_daily_points(): reclama los puntos del día
-- ------------------------------------------------------------
-- Nunca recibe el usuario por parámetro: siempre usa auth.uid(), así
-- un socio no puede reclamar en nombre de otro.
--
-- Es SECURITY DEFINER porque las tablas no tienen política de INSERT:
-- la única forma de escribir un movimiento es a través de esta función.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_daily_points()
RETURNS TABLE (
  awarded INTEGER,
  already_claimed BOOLEAN,
  total_points INTEGER,
  streak INTEGER,
  next_claim_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_today DATE;
  v_prev_date DATE;
  v_prev_streak INTEGER;
  v_streak INTEGER;
  v_awarded INTEGER := 0;
  v_already BOOLEAN := FALSE;
  v_total INTEGER;
  -- Cuántos puntos da el reclamo diario. Si el club quiere cambiarlo,
  -- se cambia acá y listo (el valor queda registrado en cada reclamo,
  -- así que los reclamos viejos conservan los puntos que dieron).
  c_points CONSTANT INTEGER := 100;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = '28000';
  END IF;

  v_today := public.club_today();

  -- Último reclamo del socio
  SELECT c.claim_date, c.streak_day
    INTO v_prev_date, v_prev_streak
  FROM public.daily_point_claims c
  WHERE c.app_user_id = v_uid
  ORDER BY c.claim_date DESC
  LIMIT 1;

  IF v_prev_date = v_today THEN
    -- Ya reclamó hoy: no se acredita nada.
    v_already := TRUE;
    v_streak := COALESCE(v_prev_streak, 1);
  ELSE
    -- Si reclamó ayer, sigue la racha. Si no (incluido el primer
    -- reclamo, donde v_prev_date es NULL), arranca en 1.
    IF v_prev_date = v_today - 1 THEN
      v_streak := v_prev_streak + 1;
    ELSE
      v_streak := 1;
    END IF;

    -- La restricción UNIQUE decide quién gana si llegan dos pedidos
    -- al mismo tiempo. DO NOTHING en vez de un error.
    INSERT INTO public.daily_point_claims
      (app_user_id, claim_date, points_awarded, streak_day)
    VALUES
      (v_uid, v_today, c_points, v_streak)
    ON CONFLICT (app_user_id, claim_date) DO NOTHING
    RETURNING points_awarded INTO v_awarded;

    IF v_awarded IS NULL THEN
      -- Otra petición ganó la carrera en el mismo instante.
      v_awarded := 0;
      v_already := TRUE;
      v_streak := COALESCE(v_prev_streak, 1);
    ELSE
      INSERT INTO public.point_ledger (app_user_id, delta, reason)
      VALUES (v_uid, v_awarded, 'daily_claim');
    END IF;
  END IF;

  -- El saldo se deriva del libro, nunca se guarda suelto.
  SELECT COALESCE(SUM(l.delta), 0)::INTEGER
    INTO v_total
  FROM public.point_ledger l
  WHERE l.app_user_id = v_uid;

  RETURN QUERY SELECT
    v_awarded,
    v_already,
    v_total,
    v_streak,
    ((v_today + 1)::timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires');
END;
$$;

REVOKE ALL ON FUNCTION public.claim_daily_points() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_daily_points() TO authenticated;

-- ------------------------------------------------------------
-- my_points(): consulta del saldo y la racha, sin reclamar
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_points()
RETURNS TABLE (
  total_points INTEGER,
  streak INTEGER,
  last_claim_date DATE,
  claimed_today BOOLEAN,
  next_claim_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH yo AS (SELECT auth.uid() AS uid),
  hoy AS (SELECT public.club_today() AS d)
  SELECT
    COALESCE((SELECT SUM(l.delta) FROM public.point_ledger l WHERE l.app_user_id = yo.uid), 0)::INTEGER,
    COALESCE((SELECT c.streak_day FROM public.daily_point_claims c
              WHERE c.app_user_id = yo.uid ORDER BY c.claim_date DESC LIMIT 1), 0),
    (SELECT c.claim_date FROM public.daily_point_claims c
     WHERE c.app_user_id = yo.uid ORDER BY c.claim_date DESC LIMIT 1),
    EXISTS (SELECT 1 FROM public.daily_point_claims c
            WHERE c.app_user_id = yo.uid AND c.claim_date = hoy.d),
    ((hoy.d + 1)::timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires')
  FROM yo, hoy
  WHERE yo.uid IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.my_points() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_points() TO authenticated;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.daily_point_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Cada socio ve sólo su propio historial. No hay política de INSERT ni
-- UPDATE a propósito: los puntos sólo se mueven por las funciones de
-- arriba, nunca escribiendo directo en la tabla.
DROP POLICY IF EXISTS "daily_claims_select_own" ON public.daily_point_claims;
CREATE POLICY "daily_claims_select_own"
  ON public.daily_point_claims FOR SELECT TO authenticated
  USING (app_user_id = auth.uid());

DROP POLICY IF EXISTS "point_ledger_select_own" ON public.point_ledger;
CREATE POLICY "point_ledger_select_own"
  ON public.point_ledger FOR SELECT TO authenticated
  USING (app_user_id = auth.uid());

DROP POLICY IF EXISTS "redemptions_select_own" ON public.reward_redemptions;
CREATE POLICY "redemptions_select_own"
  ON public.reward_redemptions FOR SELECT TO authenticated
  USING (app_user_id = auth.uid());

-- El catálogo de premios sí lo puede ver cualquier socio autenticado:
-- es información pública del programa.
DROP POLICY IF EXISTS "rewards_select_active" ON public.rewards;
CREATE POLICY "rewards_select_active"
  ON public.rewards FOR SELECT TO authenticated
  USING (active = TRUE);

-- ============================================================
-- Verificación posterior sugerida
-- ============================================================
--   SELECT public.club_today();            -- la fecha de hoy en el club
--   SELECT * FROM public.claim_daily_points();  -- reclama (una vez)
--   SELECT * FROM public.claim_daily_points();  -- la 2ª: awarded = 0
--   SELECT * FROM public.my_points();      -- saldo y racha
--   SELECT * FROM public.point_ledger;     -- el movimiento registrado
-- ============================================================

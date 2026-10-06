-- ============================================================
-- MUNDO ALVARADO — PRIVACIDAD DEL SEGUNDO NIVEL
-- ============================================================
-- REGLA DE NEGOCIO
--   Un socio ve la ficha COMPLETA de sus referidos directos: son
--   personas que invitó él mismo.
--   De los referidos de sus referidos NO ve más que el nombre de pila
--   y el estado. Esa persona no lo invitó, no lo conoce, y
--   probablemente no sepa que existe.
--
-- POR QUÉ HAY QUE ARREGLARLO EN LA BASE Y NO EN LA PANTALLA
--   El RLS es a nivel de FILA, no de columna. La política anterior
--   (`members_visible_in_own_network`, apoyada en `visible_member_ids()`)
--   dejaba leer la fila COMPLETA de `members` para el 1º y el 2º nivel.
--   Es decir: el apellido, el número de socio y el celular del segundo
--   nivel VIAJABAN al navegador, aunque la interfaz no los dibujara.
--   Cualquiera podía leerlos con las herramientas del desarrollador.
--   Ocultar en la pantalla no es privacidad.
--
-- SOLUCIÓN: partir el acceso en dos.
--   1. `members` queda accesible sólo para uno mismo y sus referidos
--      DIRECTOS.
--   2. El segundo nivel se pide por `my_second_level()`, que devuelve
--      únicamente el nombre de pila y el estado. Nada más sale del
--      servidor.
--
-- Idempotente: se puede aplicar sobre una base ya inicializada.
-- ============================================================

-- ------------------------------------------------------------
-- 1. members: sólo yo y mis referidos directos
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "members_visible_in_own_network" ON public.members;
DROP POLICY IF EXISTS "Users can view their own member data" ON public.members;
DROP POLICY IF EXISTS "Users can view their direct referrals member data" ON public.members;
DROP POLICY IF EXISTS "Users can view second level referrals member data" ON public.members;
DROP POLICY IF EXISTS "members_visible_self_and_direct" ON public.members;

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

-- ------------------------------------------------------------
-- 2. El segundo nivel, con columnas mínimas
-- ------------------------------------------------------------
-- Devuelve SÓLO: quién es el referido directo del que cuelga, el nombre
-- de pila, y el estado. Sin apellido, sin foto, sin categoría, sin
-- número de socio, sin celular, sin email y sin identificadores del
-- socio (no se devuelve su app_user_id: no hace falta para dibujar el
-- mapa y no hay razón para que salga del servidor).
--
-- SECURITY DEFINER para poder leer `referrals` sin que el RLS de esa
-- tabla (que sólo deja ver filas propias) bloquee el join del 2º nivel.
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.my_second_level();

CREATE FUNCTION public.my_second_level()
RETURNS TABLE (
  parent_app_user_id UUID,
  child_first_name TEXT,
  child_status public.member_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    r1.referred_app_user_id,
    m.first_name,
    m.status
  FROM public.referrals r1
  JOIN public.referrals r2
    ON r2.referrer_app_user_id = r1.referred_app_user_id
  JOIN public.members m
    ON m.app_user_id = r2.referred_app_user_id
  WHERE r1.referrer_app_user_id = auth.uid()
    AND r1.status = 'active'
    AND r2.status = 'active';
$$;

REVOKE ALL ON FUNCTION public.my_second_level() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_second_level() TO authenticated;

-- ------------------------------------------------------------
-- 3. Limpieza: la función que exponía el conjunto completo de ids
-- ------------------------------------------------------------
-- Ya no la usa nadie. Devolvía los app_user_id del 1º y 2º nivel
-- juntos, que es exactamente lo que ahora hay que separar.
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.visible_member_ids();

-- ============================================================
-- Verificación posterior sugerida
-- ============================================================
-- Con un usuario autenticado que tenga referidos:
--
--   -- Sólo debe devolver tu ficha y las de tus referidos DIRECTOS:
--   SELECT app_user_id, first_name, last_name, phone FROM public.members;
--
--   -- Sólo nombre de pila y estado de la red indirecta:
--   SELECT * FROM public.my_second_level();
--
-- Si la primera consulta devuelve a alguien del segundo nivel, el RLS
-- quedó mal aplicado.
-- ============================================================

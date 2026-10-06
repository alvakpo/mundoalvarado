-- ============================================================
-- MUNDO ALVARADO — SE ELIMINA "PREMIOS GRUPALES"
-- ============================================================
-- El club decidió sacar el premio por armar red: la regla (mínimo 2
-- referidos directos al día, +1 por cada referido que a su vez tenga 2
-- propios al día) era demasiado compleja para explicársela a un socio.
--
-- Se elimina la funcionalidad completa:
--   - annual_monthly_snapshots y annual_chances
--     Eran el pozo del premio por red, que se acumulaba aparte del
--     sorteo general.
--   - my_second_level()
--     Existía sólo para mostrar la red indirecta en esa pantalla. Como
--     ya no se muestra el segundo nivel en ningún lado, la función
--     queda sin uso (y sin uso también la protección que la rodeaba).
--   - get_referral_network()
--     Devolvía los dos niveles de la red.
--
-- LO QUE NO SE TOCA, A PROPÓSITO:
--   - monthly_chances: son las chances del SORTEO GENERAL, que siguen
--     siendo la base del Sorteo anual. NO se borra.
--   - La política de `members` que sólo deja ver la ficha propia y la de
--     los referidos DIRECTOS. Es buena práctica de seguridad y se
--     mantiene aunque hoy no haya pantalla que la ejercite.
--   - Las tablas y funciones de Puntos Diarios.
--
-- Las tablas que se borran están VACÍAS (todavía no hay datos reales en
-- la base), así que no se pierde ninguna información.
--
-- Idempotente: se puede aplicar más de una vez sin problema.
-- ============================================================

DROP TABLE IF EXISTS public.annual_monthly_snapshots CASCADE;
DROP TABLE IF EXISTS public.annual_chances CASCADE;

DROP FUNCTION IF EXISTS public.my_second_level();
DROP FUNCTION IF EXISTS public.get_referral_network();

-- ============================================================
-- Verificación posterior sugerida
-- ============================================================
--   SELECT * FROM public.monthly_chances;  -- sigue existiendo
--   SELECT * FROM public.my_second_level(); -- debe dar error: ya no existe
--   SELECT * FROM public.annual_chances;    -- debe dar error: ya no existe
-- ============================================================

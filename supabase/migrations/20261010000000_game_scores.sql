-- ============================================================
-- MUNDO ALVARADO — TABLA DE PUNTAJES DE JUEGOS (LEADERBOARD)
-- ============================================================
-- Permite registrar los récords alcanzados por los socios en los
-- juegos integrados (ej: "Torino en Avioneta").
-- ============================================================

CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  game_id TEXT NOT NULL DEFAULT 'torino-avioneta',
  score INTEGER NOT NULL CHECK (score >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas rápidas del ranking
CREATE INDEX IF NOT EXISTS idx_game_scores_ranking 
  ON public.game_scores(game_id, score DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_game_scores_user 
  ON public.game_scores(app_user_id);

-- Habilitar RLS (Seguridad por filas)
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Política de lectura: cualquier socio o visitante puede ver el ranking
DROP POLICY IF EXISTS "Permitir lectura de ranking de juegos" ON public.game_scores;
CREATE POLICY "Permitir lectura de ranking de juegos"
  ON public.game_scores
  FOR SELECT
  USING (true);

-- Política de inserción: socios autenticados pueden registrar su puntaje
DROP POLICY IF EXISTS "Permitir registrar puntajes a usuarios" ON public.game_scores;
CREATE POLICY "Permitir registrar puntajes a usuarios"
  ON public.game_scores
  FOR INSERT
  WITH CHECK (true);

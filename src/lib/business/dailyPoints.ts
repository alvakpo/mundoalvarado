// src/lib/business/dailyPoints.ts
// ============================================================
// PUNTOS DIARIOS
// ============================================================
// El socio entra una vez por día y reclama 100 puntos. Los días
// seguidos (racha) son el gancho que hace que vuelva.
//
// DOS DECISIONES QUE IMPORTAN MÁS DE LO QUE PARECEN:
//
// 1. QUÉ ES "HOY". El club está en Mar del Plata, así que el día se
//    corta a la medianoche ARGENTINA, no a la medianoche UTC. Si se
//    usara UTC, el "día nuevo" llegaría a las 21:00 local y un socio
//    podría reclamar dos veces en la misma noche. Acá el día se
//    calcula siempre con la zona del club.
//
// 2. QUIÉN DECIDE SI YA RECLAMÓ. Estas funciones son puras y sirven
//    para la demo. En producción la decisión la toma el SERVIDOR
//    (ver supabase/migrations/20261008000000_daily_points.sql): si la
//    decidiera el navegador, cualquiera podría cambiar el reloj o el
//    almacenamiento local y reclamar puntos infinitos.
//    La regla real es una restricción UNIQUE en la base:
//      UNIQUE(app_user_id, claim_date)
//    Eso hace que reclamar dos veces el mismo día sea imposible, no
//    "improbable".
// ============================================================

export const POINTS_PER_DAY = 100;
export const CLUB_TIMEZONE = 'America/Argentina/Buenos_Aires';

/** Cuántos días para atrás guardamos para dibujar la racha. */
export const STREAK_WINDOW_DAYS = 7;

export interface DailyPointsState {
  totalPoints: number;
  /** 'YYYY-MM-DD' en hora del club, o null si nunca reclamó. */
  lastClaimDate: string | null;
  streak: number;
  /** Fechas reclamadas, para dibujar la tira de días. */
  claimedDates: string[];
}

export function emptyDailyPoints(): DailyPointsState {
  return { totalPoints: 0, lastClaimDate: null, streak: 0, claimedDates: [] };
}

// ------------------------------------------------------------
// Fechas del club
// ------------------------------------------------------------

/**
 * La fecha calendario en la zona del club, como 'YYYY-MM-DD'.
 * Se usa Intl en vez de restar horas a mano para que funcione con
 * cualquier zona, incluido un eventual horario de verano.
 */
export function clubDateKey(date: Date): string {
  // 'en-CA' formatea como YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLUB_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** La fecha anterior a una clave dada. */
export function previousDateKey(key: string): string {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/** Las últimas N fechas (de la más vieja a hoy), para la tira de días. */
export function recentDateKeys(todayKey: string, days = STREAK_WINDOW_DAYS): string[] {
  const keys: string[] = [todayKey];
  let cursor = todayKey;
  for (let i = 1; i < days; i++) {
    cursor = previousDateKey(cursor);
    keys.push(cursor);
  }
  return keys.reverse();
}

/**
 * Milisegundos que faltan para la próxima medianoche del club.
 * Se lee la hora local formateada en vez de asumir un desfasaje fijo,
 * así no se rompe si algún día cambia el huso.
 */
export function msUntilNextClubDay(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: CLUB_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  let hour = get('hour');
  if (hour === 24) hour = 0; // algunas versiones devuelven 24 en vez de 0

  const elapsed = hour * 3600 + get('minute') * 60 + get('second');
  return (86400 - elapsed) * 1000;
}

/** 'HH:MM:SS' para el contador. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

// ------------------------------------------------------------
// La regla del reclamo
// ------------------------------------------------------------

export function canClaimToday(
  lastClaimDate: string | null,
  todayKey: string
): boolean {
  return lastClaimDate !== todayKey;
}

/**
 * La racha que quedaría al reclamar hoy.
 *   - Si ayer reclamó, sigue la racha.
 *   - Si se saltó uno o más días, vuelve a 1.
 *   - Si ya reclamó hoy, no cambia.
 */
export function nextStreak(
  lastClaimDate: string | null,
  currentStreak: number,
  todayKey: string
): number {
  if (lastClaimDate === todayKey) return currentStreak;
  if (lastClaimDate === previousDateKey(todayKey)) return currentStreak + 1;
  return 1;
}

export interface ClaimResult {
  state: DailyPointsState;
  awarded: number;
  alreadyClaimed: boolean;
  todayKey: string;
  streak: number;
}

// ------------------------------------------------------------
// Catálogo de premios
// ------------------------------------------------------------
// Todavía está vacío: el club va a definir qué se puede canjear y a
// cuántos puntos. La pantalla se dibuja a partir de esta lista, así
// que cargar premios va a ser llenar este arreglo (y, cuando Supabase
// esté conectado, leerlo de la tabla `rewards`).
// ------------------------------------------------------------
export interface Reward {
  id: string;
  title: string;
  description: string;
  costPoints: number;
  /** Emoji, para no depender de imágenes que todavía no existen. */
  emoji: string;
}

export const REWARDS_CATALOG: Reward[] = [];

/**
 * Aplica el reclamo del día sobre el estado.
 * Es idempotente: reclamar dos veces el mismo día no suma de nuevo.
 */
export function claimDailyPoints(state: DailyPointsState, now: Date): ClaimResult {
  const todayKey = clubDateKey(now);

  if (!canClaimToday(state.lastClaimDate, todayKey)) {
    return {
      state,
      awarded: 0,
      alreadyClaimed: true,
      todayKey,
      streak: state.streak,
    };
  }

  const streak = nextStreak(state.lastClaimDate, state.streak, todayKey);

  return {
    state: {
      totalPoints: state.totalPoints + POINTS_PER_DAY,
      lastClaimDate: todayKey,
      streak,
      // Se guardan sólo los últimos días: alcanza para la tira visual
      // y evita que el estado crezca sin límite.
      claimedDates: [...state.claimedDates, todayKey].slice(-90),
    },
    awarded: POINTS_PER_DAY,
    alreadyClaimed: false,
    todayKey,
    streak,
  };
}

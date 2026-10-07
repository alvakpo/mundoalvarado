// src/lib/business/levels.ts
// ============================================================
// NIVELES
// ============================================================
// El nivel depende de cuántos referidos directos trajo el socio.
//
// PROPUESTA DE RANGOS. El club había pasado estos:
//   0 = ninguno · 1 = 1-2 · 2 = 3-5 · (salteaba el 3) · 6-10 · 10-15 · 15-20 · 21-30
//
// Tenía dos problemas: se salteaba el nivel 3, y los rangos se pisaban
// (el 10 estaba en dos niveles, el 15 también). Acá quedaron
// correlativos y sin superposición: cada referido cae en un solo nivel.
//
// Si el club quiere otros cortes, se cambia SOLO esta tabla.
// ============================================================

export interface LevelDefinition {
  level: number;
  /** Desde cuántos referidos directos se alcanza. */
  minReferrals: number;
  /** Hasta cuántos. null = sin techo. */
  maxReferrals: number | null;
  /** Nombre corto, para mostrar en la escalera. */
  title: string;
  /** Frase motivadora para el socio. */
  motto: string;
}

export const LEVELS: LevelDefinition[] = [
  {
    level: 0,
    minReferrals: 0,
    maxReferrals: 0,
    title: 'Sin nivel',
    motto: 'Todavía no invitaste a nadie',
  },
  {
    level: 1,
    minReferrals: 1,
    maxReferrals: 2,
    title: 'Primeros pasos',
    motto: 'Ya empezaste: tus primeros referidos',
  },
  {
    level: 2,
    minReferrals: 3,
    maxReferrals: 5,
    title: 'En marcha',
    motto: 'Le estás tomando la mano',
  },
  {
    level: 3,
    minReferrals: 6,
    maxReferrals: 10,
    title: 'Traés gente',
    motto: 'Tu red empieza a notarse',
  },
  {
    level: 4,
    minReferrals: 11,
    maxReferrals: 15,
    title: 'Armador de red',
    motto: 'Sos de los que hacen crecer el club',
  },
  {
    level: 5,
    minReferrals: 16,
    maxReferrals: 20,
    title: 'Referente',
    motto: 'Muchos socios llegaron por vos',
  },
  {
    level: 6,
    minReferrals: 21,
    maxReferrals: 30,
    title: 'Embajador',
    motto: 'Tu nombre suena en el club',
  },
  {
    level: 7,
    minReferrals: 31,
    maxReferrals: null,
    title: 'Leyenda',
    motto: 'No hay techo: seguí sumando',
  },
];

export const MAX_LEVEL = LEVELS.length - 1;

/** El nivel que corresponde a una cantidad de referidos directos. */
export function levelForReferralCount(count: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0;

  const found = LEVELS.find(
    (l) => count >= l.minReferrals && (l.maxReferrals === null || count <= l.maxReferrals)
  );
  return found ? found.level : MAX_LEVEL;
}

export function levelDefinition(level: number): LevelDefinition {
  const clamped = Math.min(Math.max(0, Math.trunc(level)), MAX_LEVEL);
  return LEVELS[clamped];
}

/** Texto del rango: "1 a 2", "31 o más", "nadie". */
export function levelRangeLabel(level: number): string {
  const def = levelDefinition(level);
  if (def.maxReferrals === null) return `${def.minReferrals} o más`;
  if (def.minReferrals === def.maxReferrals) return `${def.minReferrals}`;
  return `${def.minReferrals} a ${def.maxReferrals}`;
}

export interface LevelProgress {
  currentLevel: number;
  currentTitle: string;
  referralCount: number;
  nextLevel: number | null;
  /** Cuántos referidos faltan para el próximo nivel. null si es el máximo. */
  missingForNext: number | null;
  /** Avance dentro del nivel actual, de 0 a 1. */
  progressInLevel: number;
}

export function levelProgress(referralCount: number): LevelProgress {
  const count = Number.isFinite(referralCount) && referralCount > 0 ? Math.trunc(referralCount) : 0;
  const currentLevel = levelForReferralCount(count);
  const current = levelDefinition(currentLevel);

  if (currentLevel >= MAX_LEVEL) {
    return {
      currentLevel,
      currentTitle: current.title,
      referralCount: count,
      nextLevel: null,
      missingForNext: null,
      progressInLevel: 1,
    };
  }

  const next = levelDefinition(currentLevel + 1);
  const span = next.minReferrals - current.minReferrals;
  const walked = count - current.minReferrals;

  return {
    currentLevel,
    currentTitle: current.title,
    referralCount: count,
    nextLevel: next.level,
    missingForNext: next.minReferrals - count,
    progressInLevel: span > 0 ? Math.min(1, Math.max(0, walked / span)) : 0,
  };
}

/**
 * Cuánto se atenúa un escalón según qué tan lejos está del nivel actual.
 * Lo de arriba se va "borrando" a propósito: son los escalones que
 * todavía no alcanzaste.
 *
 * La tabla baja SIEMPRE, escalón por escalón, sin mesetas: si dos
 * niveles seguidos quedaran igual de borrosos, el de arriba se vería
 * como el mismo premio que el de abajo. El más alto queda en 0.07, que
 * es apenas una insinuación: se ve que hay algo más arriba, sin que
 * compita con lo que el socio ya alcanzó.
 */
const STEP_OPACITY_BY_DISTANCE = [1, 0.62, 0.42, 0.28, 0.18, 0.12, 0.09, 0.07];

export function stepOpacity(level: number, currentLevel: number): number {
  if (level <= currentLevel) return 1;
  const distance = level - currentLevel;
  const index = Math.min(distance, STEP_OPACITY_BY_DISTANCE.length - 1);
  return STEP_OPACITY_BY_DISTANCE[index];
}

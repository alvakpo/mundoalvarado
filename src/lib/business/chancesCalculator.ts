// src/lib/business/chancesCalculator.ts
// ============================================================
// LÓGICA DE NEGOCIO: CÁLCULO DE CHANCES
// NO mezclar con componentes visuales
// ============================================================

import {
  EnrichedMember,
  MemberStatus,
  MonthlyChancesResult,
  AnnualMonthlyChancesResult,
  AnnualAccumulatedResult,
  AnnualYearSeries,
  ChanceBreakdownItem,
  BASE_CHANCES,
  MEMBER_CATEGORY_LABELS,
  MONTHLY_CUTOFF_DAY,
  MONTHLY_CUTOFF_HOUR,
  MONTHLY_CUTOFF_MINUTE,
} from '@/types';

/**
 * Lo ÚNICO que el cálculo del premio anual necesita saber del segundo
 * nivel es si cada persona está al día o no.
 *
 * Está declarado así a propósito: el cálculo no puede mirar el apellido
 * ni el teléfono de alguien que no es referido del socio. Si algún día
 * alguien intenta usar otro campo acá, no compila.
 */
export type NetworkStatusEntry = { status: MemberStatus };

// ============================================================
// EVALUACIÓN DEL CORTE MENSUAL
// El corte es el día 20 a las 23:59
// ============================================================
export function evaluateMonthlyCutoff(date: Date): {
  effectiveMonth: number;
  effectiveYear: number;
  isBeyondCutoff: boolean;
} {
  const cutoffDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    MONTHLY_CUTOFF_DAY,
    MONTHLY_CUTOFF_HOUR,
    MONTHLY_CUTOFF_MINUTE,
    59
  );

  const isBeyondCutoff = date > cutoffDate;

  if (isBeyondCutoff) {
    // Si pasó el corte, se cuenta para el mes siguiente
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return {
      effectiveMonth: nextMonth.getMonth() + 1,
      effectiveYear: nextMonth.getFullYear(),
      isBeyondCutoff: true,
    };
  }

  return {
    effectiveMonth: date.getMonth() + 1,
    effectiveYear: date.getFullYear(),
    isBeyondCutoff: false,
  };
}

// ============================================================
// CHANCES MENSUALES (SORTEO GENERAL)
// Reglas:
// - Activo: 1 chance base
// - Activo Protector: 2 chances base
// - Cancha: 2 chances base
// - Cancha Protector: 3 chances base
// - +1 por cada referido directo activo/al día en el mes
// - Solo si el socio está al día
// ============================================================
export function calculateGeneralChances(
  member: EnrichedMember,
  directReferrals: EnrichedMember[],
  month: number,
  year: number
): MonthlyChancesResult {
  const breakdown: ChanceBreakdownItem[] = [];

  // Si no está al día, no participa
  if (member.status !== 'al_dia') {
    return {
      appUserId: member.appUserId,
      month,
      year,
      baseChances: 0,
      referralChances: 0,
      totalChances: 0,
      breakdown: [
        {
          label: 'No participa',
          chances: 0,
          reason: 'El socio no está al día',
        },
      ],
    };
  }

  // Chances base por categoría
  const baseChances = BASE_CHANCES[member.category];
  breakdown.push({
    // El nombre lindo, no la clave interna: al socio no le dice nada
    // leer "cancha_protector".
    label: MEMBER_CATEGORY_LABELS[member.category],
    chances: baseChances,
    reason: `${baseChances} chance${baseChances > 1 ? 's' : ''} por tu categoría`,
  });

  // Chances por referidos directos activos
  const activeReferrals = directReferrals.filter((r) => r.status === 'al_dia');

  for (const ref of activeReferrals) {
    breakdown.push({
      label: `${ref.firstName} ${ref.lastName}`,
      chances: 1,
      reason: `Referido directo al día`,
    });
  }

  const referralChances = activeReferrals.length;
  const totalChances = baseChances + referralChances;

  return {
    appUserId: member.appUserId,
    month,
    year,
    baseChances,
    referralChances,
    totalChances,
    breakdown,
  };
}

// ============================================================
// CHANCES ANUALES (ACUMULADAS) - POR MES
// Reglas:
// - Si tiene al menos 2 referidos directos activos: +1 chance
// - Por cada referido directo que tenga al menos 2 referidos
//   propios activos: +1 chance adicional
// - El socio debe estar al día
// ============================================================
export function calculateAnnualMonthlyChances(
  member: EnrichedMember,
  directReferrals: EnrichedMember[],
  secondLevelMap: Map<string, NetworkStatusEntry[]>,
  month: number,
  year: number
): AnnualMonthlyChancesResult {
  const breakdown: ChanceBreakdownItem[] = [];

  // Si no está al día, no genera chances anuales
  if (member.status !== 'al_dia') {
    return {
      appUserId: member.appUserId,
      month,
      year,
      chancesThisMonth: 0,
      breakdown: [],
    };
  }

  // Referidos directos activos
  const activeDirectReferrals = directReferrals.filter((r) => r.status === 'al_dia');
  const hasEnoughDirectReferrals = activeDirectReferrals.length >= 2;

  if (!hasEnoughDirectReferrals) {
    return {
      appUserId: member.appUserId,
      month,
      year,
      chancesThisMonth: 0,
      breakdown: [
        {
          label: 'Sin chances anuales',
          chances: 0,
          reason: `Necesitás al menos 2 referidos directos al día (tenés ${activeDirectReferrals.length})`,
        },
      ],
    };
  }

  // +1 por tener 2+ referidos directos activos
  breakdown.push({
    label: 'Tus referidos directos',
    chances: 1,
    reason: `Tenés ${activeDirectReferrals.length} referidos directos al día`,
  });

  let totalChances = 1;

  // +1 por cada referido directo que tenga 2+ referidos propios activos
  for (const directRef of activeDirectReferrals) {
    const secondLevel = secondLevelMap.get(directRef.appUserId) ?? [];
    const activeSecondLevel = secondLevel.filter((r) => r.status === 'al_dia');

    if (activeSecondLevel.length >= 2) {
      totalChances += 1;
      breakdown.push({
        label: `${directRef.firstName} ${directRef.lastName}`,
        chances: 1,
        reason: `${directRef.firstName} tiene ${activeSecondLevel.length} referidos al día`,
      });
    }
  }

  return {
    appUserId: member.appUserId,
    month,
    year,
    chancesThisMonth: totalChances,
    breakdown,
  };
}

// ============================================================
// CHANCES ANUALES ACUMULADAS
// ============================================================
// El sorteo anual se juega UNA SOLA VEZ AL AÑO. Las chances se
// calculan mes a mes, se congelan en el corte del día 20 y se
// acumulan. Por lo tanto la invariante que hay que garantizar es:
// CADA MES CUENTA EXACTAMENTE UNA VEZ.
//
// Sumar el historial a ciegas no alcanza: si un mes aparece repetido
// (dato inconsistente, doble escritura, reintento del proceso de
// corte) el pozo del sorteo anual queda inflado. Y si además se le
// suma el mes en curso "por arriba", un mes ya congelado se cuenta
// dos veces.
//
// No recalcula ni destruye historial: sólo selecciona y ordena.
// ============================================================

const MIN_MONTH = 1;
const MAX_MONTH = 12;

function isValidMonth(month: number): boolean {
  return Number.isInteger(month) && month >= MIN_MONTH && month <= MAX_MONTH;
}

function normalizeChances(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.trunc(value);
}

/**
 * Deja un solo registro por mes. Ante un mes repetido gana el último:
 * el historial se asume en orden cronológico y el más nuevo es el
 * vigente.
 *
 * Está compartido a propósito entre el pozo por red (Premios Grupales)
 * y el pozo del sorteo general: los dos se juegan una vez al año, así
 * que los dos tienen la misma invariante y no conviene que cada uno
 * tenga su propia versión que después se desincronice.
 */
function dedupeMonthsBy<T extends { month: number }>(
  entries: T[]
): { kept: Map<number, T>; duplicateMonths: number[] } {
  const kept = new Map<number, T>();
  const duplicateMonths: number[] = [];

  for (const entry of entries) {
    if (kept.has(entry.month) && !duplicateMonths.includes(entry.month)) {
      duplicateMonths.push(entry.month);
    }
    kept.set(entry.month, entry);
  }

  return { kept, duplicateMonths: duplicateMonths.sort((a, b) => a - b) };
}

// Construye la serie anual del pozo por red: a lo sumo un registro por mes.
export function buildAnnualYearSeries(
  appUserId: string,
  year: number,
  snapshots: AnnualMonthlyChancesResult[],
  liveMonth?: AnnualMonthlyChancesResult | null
): AnnualYearSeries {
  const validos = (snapshots ?? [])
    .filter(
      (entry) =>
        entry &&
        entry.appUserId === appUserId &&
        entry.year === year &&
        isValidMonth(entry.month)
    )
    .map((entry) => ({
      ...entry,
      chancesThisMonth: normalizeChances(entry.chancesThisMonth),
    }));

  const { kept: byMonth, duplicateMonths } = dedupeMonthsBy(validos);

  // El mes en curso entra SÓLO si ese mes todavía no está congelado.
  // Si ya existe snapshot del mes, el snapshot manda: se tomó después
  // del corte y no debe ser pisado por un valor provisorio.
  let liveMonthIncluded = false;
  if (
    liveMonth &&
    liveMonth.appUserId === appUserId &&
    liveMonth.year === year &&
    isValidMonth(liveMonth.month) &&
    !byMonth.has(liveMonth.month)
  ) {
    byMonth.set(liveMonth.month, {
      ...liveMonth,
      chancesThisMonth: normalizeChances(liveMonth.chancesThisMonth),
    });
    liveMonthIncluded = true;
  }

  const periods = Array.from(byMonth.values()).sort((a, b) => a.month - b.month);
  const totalAccumulated = periods.reduce((sum, p) => sum + p.chancesThisMonth, 0);

  return {
    appUserId,
    year,
    periods,
    monthsCounted: periods.length,
    totalAccumulated,
    duplicateMonths: duplicateMonths.sort((a, b) => a - b),
    liveMonthIncluded,
  };
}

export function calculateAnnualAccumulatedChances(
  appUserId: string,
  history: AnnualMonthlyChancesResult[],
  year: number,
  liveMonth?: AnnualMonthlyChancesResult | null
): AnnualAccumulatedResult {
  const series = buildAnnualYearSeries(appUserId, year, history, liveMonth);

  return {
    appUserId,
    year,
    totalAccumulated: series.totalAccumulated,
    monthlyHistory: series.periods,
    monthsCounted: series.monthsCounted,
    duplicateMonths: series.duplicateMonths,
    liveMonthIncluded: series.liveMonthIncluded,
  };
}

// ============================================================
// SORTEO ANUAL: ACUMULACIÓN DE LAS CHANCES DEL SORTEO GENERAL
// ============================================================
// OJO: esto NO es el premio por red (Premios Grupales). Son dos cosas
// distintas que se acumulan por separado:
//
//   - Sorteo anual   -> suma las chances que el socio genera para el
//                       SORTEO GENERAL mes a mes (categoría + referidos).
//                       Es el mismo pozo que se ve en Chances mensuales,
//                       pero acumulado en vez de renovarse cada mes.
//   - Premios Grupales -> el premio por armar red (regla de 2+ referidos
//                       directos al día). Se acumula con su propia regla.
//
// Se juega una sola vez al año, así que la invariante vuelve a ser la
// misma: CADA MES CUENTA EXACTAMENTE UNA VEZ. Se reutiliza la misma
// deduplicación que el pozo por red.
// ============================================================

export interface AnnualGeneralAccumulatedResult {
  appUserId: string;
  year: number;
  totalAccumulated: number;
  monthlyHistory: MonthlyChancesResult[];
  monthsCounted: number;
  duplicateMonths: number[];
  liveMonthIncluded: boolean;
}

export function calculateAnnualGeneralChances(
  appUserId: string,
  history: MonthlyChancesResult[],
  year: number,
  liveMonth?: MonthlyChancesResult | null
): AnnualGeneralAccumulatedResult {
  const validos = (history ?? [])
    .filter(
      (entry) =>
        entry &&
        entry.appUserId === appUserId &&
        entry.year === year &&
        isValidMonth(entry.month)
    )
    .map((entry) => ({
      ...entry,
      totalChances: normalizeChances(entry.totalChances),
    }));

  const { kept: byMonth, duplicateMonths } = dedupeMonthsBy(validos);

  // El mes en curso entra como provisorio sólo si ese mes todavía no
  // está cerrado. Si ya hay registro del mes, ese manda.
  let liveMonthIncluded = false;
  if (
    liveMonth &&
    liveMonth.appUserId === appUserId &&
    liveMonth.year === year &&
    isValidMonth(liveMonth.month) &&
    !byMonth.has(liveMonth.month)
  ) {
    byMonth.set(liveMonth.month, {
      ...liveMonth,
      totalChances: normalizeChances(liveMonth.totalChances),
    });
    liveMonthIncluded = true;
  }

  const periods = Array.from(byMonth.values()).sort((a, b) => a.month - b.month);
  const totalAccumulated = periods.reduce((sum, p) => sum + p.totalChances, 0);

  return {
    appUserId,
    year,
    totalAccumulated,
    monthlyHistory: periods,
    monthsCounted: periods.length,
    duplicateMonths,
    liveMonthIncluded,
  };
}

// src/lib/business/chancesCalculator.ts
// ============================================================
// LÓGICA DE NEGOCIO: CÁLCULO DE CHANCES
// NO mezclar con componentes visuales
// ============================================================

import {
  EnrichedMember,
  MonthlyChancesResult,
  ChanceBreakdownItem,
  BASE_CHANCES,
  MEMBER_CATEGORY_LABELS,
  MONTHLY_CUTOFF_DAY,
  MONTHLY_CUTOFF_HOUR,
  MONTHLY_CUTOFF_MINUTE,
} from '@/types';

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
// HELPERS COMPARTIDOS
// ============================================================
// Los usa la acumulación del sorteo anual. La invariante que
// garantizan es: CADA MES CUENTA EXACTAMENTE UNA VEZ.
//
// Sumar un historial a ciegas no alcanza: si un mes aparece repetido
// (dato inconsistente, doble escritura, reintento del proceso de
// corte) el pozo queda inflado. Y si además se le suma el mes en curso
// "por arriba", un mes ya cerrado se cuenta dos veces.
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
 * Está compartido para que la acumulación del sorteo anual tenga una
 * sola definición y no se desincronice.
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

// ============================================================
// SORTEO ANUAL: ACUMULACIÓN DE LAS CHANCES DEL SORTEO GENERAL
// ============================================================
// Suma las chances que el socio genera para el SORTEO GENERAL mes a
// mes (categoría + referidos al día).
//
// El club confirmó que se sortean LOS DOS: cada mes hay un premio
// general, y además estas mismas chances se acumulan para el sorteo
// de fin de año.
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

// src/lib/business/chancesCalculator.ts
// ============================================================
// LÓGICA DE NEGOCIO: CÁLCULO DE CHANCES
// NO mezclar con componentes visuales
// ============================================================

import {
  EnrichedMember,
  MonthlyChancesResult,
  AnnualMonthlyChancesResult,
  AnnualAccumulatedResult,
  ChanceBreakdownItem,
  BASE_CHANCES,
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
    label: `Categoría: ${member.category}`,
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
  secondLevelMap: Map<string, EnrichedMember[]>,
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
// Suma el historial de chances anuales sin destruir datos anteriores
// ============================================================
export function calculateAnnualAccumulatedChances(
  appUserId: string,
  history: AnnualMonthlyChancesResult[],
  year: number
): AnnualAccumulatedResult {
  const yearHistory = history.filter(
    (h) => h.appUserId === appUserId && h.year === year
  );

  const totalAccumulated = yearHistory.reduce(
    (sum, h) => sum + h.chancesThisMonth,
    0
  );

  return {
    appUserId,
    year,
    totalAccumulated,
    monthlyHistory: yearHistory.sort((a, b) => a.month - b.month),
  };
}

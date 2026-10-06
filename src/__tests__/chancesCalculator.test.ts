// src/__tests__/chancesCalculator.test.ts
// ============================================================
// TESTS DE LÓGICA DE NEGOCIO - CÁLCULO DE CHANCES
// ============================================================

import {
  calculateGeneralChances,
  calculateAnnualMonthlyChances,
  calculateAnnualAccumulatedChances,
  evaluateMonthlyCutoff,
} from '../lib/business/chancesCalculator';
import { EnrichedMember, AnnualMonthlyChancesResult } from '../types';

// ---- HELPERS ----
function makeMember(overrides: Partial<EnrichedMember> = {}): EnrichedMember {
  return {
    appUserId: 'user-test-001',
    brioMemberId: 'brio-001',
    memberNumber: '12345',
    firstName: 'Test',
    lastName: 'User',
    category: 'activo',
    status: 'al_dia',
    phone: null,
    photoUrl: null,
    email: 'test@test.com',
    referralCode: 'TEST1234',
    publicAlias: 'testalias',
    referredByAppUserId: null,
    ...overrides,
  };
}

function makeReferral(id: string, status: 'al_dia' | 'con_deuda' = 'al_dia'): EnrichedMember {
  return makeMember({ appUserId: id, firstName: id, status });
}

const MONTH = 10;
const YEAR = 2026;

// ============================================================
// CHANCES GENERALES MENSUALES
// ============================================================
describe('calculateGeneralChances', () => {
  test('Socio Activo sin referidos = 1 chance', () => {
    const member = makeMember({ category: 'activo' });
    const result = calculateGeneralChances(member, [], MONTH, YEAR);
    expect(result.totalChances).toBe(1);
    expect(result.baseChances).toBe(1);
    expect(result.referralChances).toBe(0);
  });

  test('Socio Activo Protector sin referidos = 2 chances', () => {
    const member = makeMember({ category: 'activo_protector' });
    const result = calculateGeneralChances(member, [], MONTH, YEAR);
    expect(result.totalChances).toBe(2);
  });

  test('Socio Cancha sin referidos = 2 chances', () => {
    const member = makeMember({ category: 'cancha' });
    const result = calculateGeneralChances(member, [], MONTH, YEAR);
    expect(result.totalChances).toBe(2);
  });

  test('Socio Cancha Protector sin referidos = 2 chances', () => {
    const member = makeMember({ category: 'cancha_protector' });
    const result = calculateGeneralChances(member, [], MONTH, YEAR);
    // Regla del club: Activo = 1, cualquier otra categoría = 2
    expect(result.totalChances).toBe(2);
  });

  test('Socio Cancha Protector + 2 referidos activos = 4 chances', () => {
    const member = makeMember({ category: 'cancha_protector' });
    const refs = [makeReferral('r1'), makeReferral('r2')];
    const result = calculateGeneralChances(member, refs, MONTH, YEAR);
    expect(result.totalChances).toBe(4); // 2 base + 2 referidos
  });

  test('Socio con deuda = 0 chances', () => {
    const member = makeMember({ status: 'con_deuda' });
    const refs = [makeReferral('r1'), makeReferral('r2')];
    const result = calculateGeneralChances(member, refs, MONTH, YEAR);
    expect(result.totalChances).toBe(0);
  });

  test('Referido con deuda no genera chance', () => {
    const member = makeMember({ category: 'activo' });
    const refs = [
      makeReferral('r1', 'al_dia'),
      makeReferral('r2', 'con_deuda'), // No debe contar
    ];
    const result = calculateGeneralChances(member, refs, MONTH, YEAR);
    expect(result.totalChances).toBe(2); // 1 base + 1 referido activo
    expect(result.referralChances).toBe(1);
  });
});

// ============================================================
// CHANCES ANUALES MENSUALES
// ============================================================
describe('calculateAnnualMonthlyChances', () => {
  test('Menos de 2 referidos directos activos = 0 chances anuales ese mes', () => {
    const member = makeMember();
    const refs = [makeReferral('r1')]; // Solo 1
    const map = new Map<string, EnrichedMember[]>();
    const result = calculateAnnualMonthlyChances(member, refs, map, MONTH, YEAR);
    expect(result.chancesThisMonth).toBe(0);
  });

  test('2 referidos directos activos = 1 chance anual', () => {
    const member = makeMember();
    const refs = [makeReferral('r1'), makeReferral('r2')];
    const map = new Map<string, EnrichedMember[]>();
    const result = calculateAnnualMonthlyChances(member, refs, map, MONTH, YEAR);
    expect(result.chancesThisMonth).toBe(1);
  });

  test('2 directos activos + uno con 2 propios activos = 2 chances', () => {
    const member = makeMember();
    const refs = [makeReferral('r1'), makeReferral('r2')];
    const map = new Map<string, EnrichedMember[]>();
    map.set('r1', [makeReferral('r1a'), makeReferral('r1b')]); // r1 tiene 2 referidos activos
    const result = calculateAnnualMonthlyChances(member, refs, map, MONTH, YEAR);
    expect(result.chancesThisMonth).toBe(2); // 1 base + 1 por r1
  });

  test('2 directos activos + ambos con 2 propios activos = 3 chances', () => {
    const member = makeMember();
    const refs = [makeReferral('r1'), makeReferral('r2')];
    const map = new Map<string, EnrichedMember[]>();
    map.set('r1', [makeReferral('r1a'), makeReferral('r1b')]);
    map.set('r2', [makeReferral('r2a'), makeReferral('r2b')]);
    const result = calculateAnnualMonthlyChances(member, refs, map, MONTH, YEAR);
    expect(result.chancesThisMonth).toBe(3);
  });

  test('Socio con deuda no genera chances anuales', () => {
    const member = makeMember({ status: 'con_deuda' });
    const refs = [makeReferral('r1'), makeReferral('r2')];
    const map = new Map<string, EnrichedMember[]>();
    const result = calculateAnnualMonthlyChances(member, refs, map, MONTH, YEAR);
    expect(result.chancesThisMonth).toBe(0);
  });
});

// ============================================================
// ACUMULACIÓN ANUAL
// ============================================================
describe('calculateAnnualAccumulatedChances', () => {
  test('Las chances de cada mes se acumulan correctamente', () => {
    const history: AnnualMonthlyChancesResult[] = [
      { appUserId: 'user-test-001', month: 3, year: YEAR, chancesThisMonth: 1, breakdown: [] },
      { appUserId: 'user-test-001', month: 4, year: YEAR, chancesThisMonth: 2, breakdown: [] },
      { appUserId: 'user-test-001', month: 5, year: YEAR, chancesThisMonth: 3, breakdown: [] },
    ];
    const result = calculateAnnualAccumulatedChances('user-test-001', history, YEAR);
    expect(result.totalAccumulated).toBe(6);
    expect(result.monthlyHistory).toHaveLength(3);
  });

  test('El historial se preserva (no se destruye información anterior)', () => {
    const history: AnnualMonthlyChancesResult[] = [
      { appUserId: 'user-test-001', month: 1, year: YEAR, chancesThisMonth: 2, breakdown: [] },
      { appUserId: 'user-test-001', month: 1, year: YEAR - 1, chancesThisMonth: 5, breakdown: [] }, // año anterior
    ];
    const result = calculateAnnualAccumulatedChances('user-test-001', history, YEAR);
    expect(result.totalAccumulated).toBe(2); // Solo cuenta el año correcto
    expect(result.monthlyHistory).toHaveLength(1);
  });
});

// ============================================================
// EVALUACIÓN DEL CORTE MENSUAL
// ============================================================
describe('evaluateMonthlyCutoff', () => {
  test('Fecha antes del corte (día 15) = mismo mes', () => {
    const date = new Date(2026, 9, 15, 12, 0, 0); // 15 oct 2026
    const result = evaluateMonthlyCutoff(date);
    expect(result.effectiveMonth).toBe(10);
    expect(result.effectiveYear).toBe(2026);
    expect(result.isBeyondCutoff).toBe(false);
  });

  test('Fecha después del corte (día 21) = mes siguiente', () => {
    const date = new Date(2026, 9, 21, 10, 0, 0); // 21 oct 2026
    const result = evaluateMonthlyCutoff(date);
    expect(result.effectiveMonth).toBe(11);
    expect(result.effectiveYear).toBe(2026);
    expect(result.isBeyondCutoff).toBe(true);
  });

  test('Fecha exactamente al corte (día 20 23:59:59) = mismo mes', () => {
    const date = new Date(2026, 9, 20, 23, 59, 59);
    const result = evaluateMonthlyCutoff(date);
    expect(result.effectiveMonth).toBe(10);
    expect(result.isBeyondCutoff).toBe(false);
  });
});

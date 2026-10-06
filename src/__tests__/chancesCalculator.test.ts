// src/__tests__/chancesCalculator.test.ts
// ============================================================
// TESTS DE LÓGICA DE NEGOCIO - CÁLCULO DE CHANCES
// ============================================================

import {
  calculateGeneralChances,
  evaluateMonthlyCutoff,
} from '../lib/business/chancesCalculator';
import { EnrichedMember } from '../types';

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

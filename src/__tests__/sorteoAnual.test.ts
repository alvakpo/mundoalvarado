// src/__tests__/sorteoAnual.test.ts
// ============================================================
// SORTEO ANUAL (acumulación de las chances del sorteo general)
// ============================================================
// Acumula las chances que el socio genera mes a mes (categoría +
// referidos), y la invariante es: CADA MES CUENTA UNA SOLA VEZ.
// ============================================================

import {
  calculateAnnualGeneralChances,
  calculateGeneralChances,
} from '../lib/business/chancesCalculator';
import {
  MOCK_MEMBERS,
  PROGRAM_START_MONTH,
  buildMockMonthlyGeneralHistory,
  getMockMemberById,
} from '../lib/mock/mockData';
import { MonthlyChancesResult } from '../types';

const YEAR = 2026;
const MARCELA = 'user-marcela-001';

function mes(
  m: number,
  total: number,
  appUserId = MARCELA,
  year = YEAR
): MonthlyChancesResult {
  return {
    appUserId,
    month: m,
    year,
    baseChances: total,
    referralChances: 0,
    totalChances: total,
    breakdown: [],
  };
}

// ============================================================
// ACUMULACIÓN
// ============================================================
describe('Sorteo anual — acumulación mes a mes', () => {
  test('suma los meses del año', () => {
    const history = [mes(4, 4), mes(5, 4), mes(6, 5), mes(7, 6)];
    const result = calculateAnnualGeneralChances(MARCELA, history, YEAR);

    expect(result.totalAccumulated).toBe(19);
    expect(result.monthsCounted).toBe(4);
  });

  test('un mes repetido NO duplica el acumulado', () => {
    const history = [mes(4, 4), mes(5, 4), mes(5, 9)];
    const result = calculateAnnualGeneralChances(MARCELA, history, YEAR);

    // Gana el último registro del mes 5 (9), y el mes cuenta una vez.
    expect(result.totalAccumulated).toBe(13);
    expect(result.duplicateMonths).toEqual([5]);
    expect(result.monthlyHistory.filter((h) => h.month === 5)).toHaveLength(1);
  });

  test('los meses de otro año no se acumulan', () => {
    const history = [mes(4, 4), mes(4, 99, MARCELA, YEAR - 1)];
    const result = calculateAnnualGeneralChances(MARCELA, history, YEAR);
    expect(result.totalAccumulated).toBe(4);
  });

  test('los meses de otro usuario no se acumulan', () => {
    const history = [mes(4, 4), mes(4, 99, 'otro-user')];
    const result = calculateAnnualGeneralChances(MARCELA, history, YEAR);
    expect(result.totalAccumulated).toBe(4);
  });

  test('el mes en curso entra si no está cerrado', () => {
    const history = [mes(4, 4), mes(5, 4)];
    const live = mes(6, 5);
    const result = calculateAnnualGeneralChances(MARCELA, history, YEAR, live);

    expect(result.totalAccumulated).toBe(13);
    expect(result.liveMonthIncluded).toBe(true);
  });

  test('el mes en curso NO se suma si ese mes ya está cerrado', () => {
    const history = [mes(4, 4), mes(6, 5)];
    const live = mes(6, 99);
    const result = calculateAnnualGeneralChances(MARCELA, history, YEAR, live);

    expect(result.totalAccumulated).toBe(9);
    expect(result.liveMonthIncluded).toBe(false);
    expect(result.monthlyHistory.find((h) => h.month === 6)?.totalChances).toBe(5);
  });

  test('ignora meses fuera de rango', () => {
    const history = [mes(0, 5), mes(13, 5), mes(4, 4)];
    const result = calculateAnnualGeneralChances(MARCELA, history, YEAR);
    expect(result.totalAccumulated).toBe(4);
    expect(result.monthsCounted).toBe(1);
  });

  test('un historial vacío da 0 y no rompe', () => {
    const result = calculateAnnualGeneralChances(MARCELA, [], YEAR);
    expect(result.totalAccumulated).toBe(0);
    expect(result.monthsCounted).toBe(0);
  });

  test('no muta el historial recibido', () => {
    const history = [mes(6, 5), mes(4, 4)];
    const copia = JSON.stringify(history);
    calculateAnnualGeneralChances(MARCELA, history, YEAR);
    expect(JSON.stringify(history)).toBe(copia);
  });
});

// ============================================================
// HISTORIAL DEL MOCK
// ============================================================
describe('Sorteo anual — historial del mock respeta el corte del día 20', () => {
  test('arranca en el mes en que arrancó el programa', () => {
    const history = buildMockMonthlyGeneralHistory(MARCELA, YEAR, 9);
    expect(history[0].month).toBe(PROGRAM_START_MONTH);
    expect(history[history.length - 1].month).toBe(9);
  });

  test('un referido que llegó después del corte no cuenta en ese mes', () => {
    // Sofía tiene createdAt 2026-06-01, así que en abril no existía
    // todavía. Si el filtro por fecha estuviera mal, abril daría 5 y no 4.
    const history = buildMockMonthlyGeneralHistory(MARCELA, YEAR, 9);
    const abril = history.find((h) => h.month === 4);
    const junio = history.find((h) => h.month === 6);

    expect(abril?.referralChances).toBe(2); // Juan y Laura
    expect(junio?.referralChances).toBe(3); // + Sofía
  });

  test('cada mes = chances por categoría + referidos al día', () => {
    const history = buildMockMonthlyGeneralHistory(MARCELA, YEAR, 9);

    for (const mes of history) {
      expect(mes.totalChances).toBe(mes.baseChances + mes.referralChances);
    }
  });

  test('la categoría del socio manda las chances base', () => {
    const marcela = getMockMemberById(MARCELA);
    expect(marcela?.category).toBe('cancha_protector');

    const history = buildMockMonthlyGeneralHistory(MARCELA, YEAR, 9);
    // Regla del club: Activo = 1, cualquier otra categoría = 2
    for (const mes of history) {
      expect(mes.baseChances).toBe(2);
    }
  });

  test('los números de la demo son los esperados', () => {
    const history = buildMockMonthlyGeneralHistory(MARCELA, YEAR, 9);

    expect(history.map((h) => h.totalChances)).toEqual([4, 4, 5, 6, 6, 6]);
    expect(history.reduce((s, h) => s + h.totalChances, 0)).toBe(31);
  });

  test('el acumulado del mock coincide con el cálculo del motor', () => {
    // El historial se construye con el mismo motor, así que acá se
    // verifica que la acumulación no altere nada por el camino.
    const history = buildMockMonthlyGeneralHistory(MARCELA, YEAR, 9);
    const result = calculateAnnualGeneralChances(MARCELA, history, YEAR);

    expect(result.totalAccumulated).toBe(31);
    expect(result.duplicateMonths).toEqual([]);
    expect(result.monthsCounted).toBe(6);
  });

  test('el mes en curso de la demo da 6', () => {
    const marcela = MOCK_MEMBERS.find((m) => m.appUserId === MARCELA);
    expect(marcela).toBeDefined();

    // Octubre: sigue con 4 referidos al día (Juan, Laura, Sofía, Lucía).
    const octubre = calculateGeneralChances(
      marcela!,
      [
        MOCK_MEMBERS.find((m) => m.firstName === 'Juan')!,
        MOCK_MEMBERS.find((m) => m.firstName === 'Laura')!,
        MOCK_MEMBERS.find((m) => m.firstName === 'Sofía')!,
        MOCK_MEMBERS.find((m) => m.firstName === 'Lucía')!,
      ],
      10,
      YEAR
    );

    expect(octubre.baseChances).toBe(2);
    expect(octubre.referralChances).toBe(4);
    expect(octubre.totalChances).toBe(6);
  });
});

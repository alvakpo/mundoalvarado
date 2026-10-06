// src/__tests__/annualChances.test.ts
// ============================================================
// VERIFICACIÓN DEL PREMIO ANUAL
// ============================================================
// El sorteo anual se juega UNA VEZ AL AÑO. Las chances se calculan
// mes a mes, se congelan en el corte (día 20 a las 23:59) y se
// acumulan hasta el sorteo de fin de año.
//
// Invariantes que se verifican acá:
//   I1. Cada mes cuenta EXACTAMENTE UNA VEZ en el pozo anual.
//   I2. El pozo anual es sólo del año que se está mirando.
//   I3. El pozo anual es sólo del usuario que se está mirando.
//   I4. El mes en curso entra como provisorio, salvo que ya esté
//       congelado (ahí manda el snapshot).
//   I5. El pozo anual es independiente del sorteo general mensual.
//   I6. Un socio con deuda no genera ese mes, sin borrar los previos.
// ============================================================

import {
  calculateGeneralChances,
  calculateAnnualMonthlyChances,
  calculateAnnualAccumulatedChances,
  buildAnnualYearSeries,
  evaluateMonthlyCutoff,
} from '../lib/business/chancesCalculator';
import { EnrichedMember, AnnualMonthlyChancesResult } from '../types';
import {
  MOCK_REFERRALS,
  MOCK_ANNUAL_HISTORY,
  getMockMemberById,
  getMockDirectReferrals,
  getMockSecondLevelReferrals,
} from '../lib/mock/mockData';

const YEAR = 2026;
const USER = 'user-test-001';

// ---- HELPERS ----
function makeMember(overrides: Partial<EnrichedMember> = {}): EnrichedMember {
  return {
    appUserId: USER,
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

function makeRef(id: string, status: 'al_dia' | 'con_deuda' = 'al_dia'): EnrichedMember {
  return makeMember({ appUserId: id, firstName: id, status });
}

function month(
  m: number,
  chances: number,
  appUserId = USER,
  year = YEAR
): AnnualMonthlyChancesResult {
  return { appUserId, month: m, year, chancesThisMonth: chances, breakdown: [] };
}

// ============================================================
// I1 — CADA MES CUENTA UNA SOLA VEZ
// ============================================================
describe('Premio anual — I1: cada mes cuenta exactamente una vez', () => {
  test('un mes duplicado en el historial NO duplica el acumulado', () => {
    // La tabla tiene UNIQUE(app_user_id, month, year), pero el cálculo es
    // una función pura y no debe confiar ciegamente en su entrada:
    // un doble snapshot o un reintento del proceso de corte no puede
    // inflar el pozo del sorteo anual.
    const history = [month(3, 1), month(4, 1), month(5, 2), month(5, 3), month(6, 3)];

    const result = calculateAnnualAccumulatedChances(USER, history, YEAR);

    // 1 + 1 + 3 (el mes 5 vale una vez, gana el último) + 3 = 8, NUNCA 10
    expect(result.totalAccumulated).toBe(8);
    expect(result.monthlyHistory.filter((h) => h.month === 5)).toHaveLength(1);
  });

  test('reporta qué meses venían repetidos', () => {
    const history = [month(5, 2), month(5, 3), month(7, 1), month(7, 1)];
    const result = calculateAnnualAccumulatedChances(USER, history, YEAR);
    expect(result.duplicateMonths).toEqual([5, 7]);
    expect(result.monthsCounted).toBe(2);
  });

  test('un año completo de 12 meses suma exactamente 12 entradas', () => {
    const history = Array.from({ length: 12 }, (_, i) => month(i + 1, 2));

    const result = calculateAnnualAccumulatedChances(USER, history, YEAR);

    expect(result.monthsCounted).toBe(12);
    expect(result.monthlyHistory).toHaveLength(12);
    expect(result.totalAccumulated).toBe(24);
    expect(result.monthlyHistory.map((h) => h.month)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  test('el historial llega ordenado por mes aunque la entrada venga desordenada', () => {
    const history = [month(9, 3), month(2, 1), month(6, 2)];
    const result = calculateAnnualAccumulatedChances(USER, history, YEAR);
    expect(result.monthlyHistory.map((h) => h.month)).toEqual([2, 6, 9]);
  });
});

// ============================================================
// I2 / I3 — AISLAMIENTO POR AÑO Y POR USUARIO
// ============================================================
describe('Premio anual — I2/I3: aislamiento por año y usuario', () => {
  test('los meses de otro año no se acumulan', () => {
    const history = [month(1, 2), month(1, 5, USER, YEAR - 1), month(12, 9, USER, YEAR + 1)];
    const result = calculateAnnualAccumulatedChances(USER, history, YEAR);
    expect(result.totalAccumulated).toBe(2);
    expect(result.monthsCounted).toBe(1);
  });

  test('los meses de otro usuario no se acumulan', () => {
    const history = [month(1, 2), month(1, 9, 'otro-user')];
    const result = calculateAnnualAccumulatedChances(USER, history, YEAR);
    expect(result.totalAccumulated).toBe(2);
  });

  test('una serie de un año no arrastra nada del año anterior', () => {
    const series2025 = buildAnnualYearSeries(USER, 2025, [month(11, 4, USER, 2025)]);
    const series2026 = buildAnnualYearSeries(USER, 2026, [month(1, 2, USER, 2026)]);

    expect(series2025.totalAccumulated).toBe(4);
    expect(series2026.totalAccumulated).toBe(2);
    expect(series2026.periods.map((p) => p.month)).toEqual([1]);
  });
});

// ============================================================
// I4 — EL MES EN CURSO (provisorio vs congelado)
// ============================================================
describe('Premio anual — I4: el mes en curso', () => {
  test('entra como provisorio si ese mes todavía no está congelado', () => {
    const history = [month(3, 1), month(4, 1), month(5, 2)];
    const live = month(6, 3);

    const result = calculateAnnualAccumulatedChances(USER, history, YEAR, live);

    // 1 + 1 + 2 + 3 = 7
    expect(result.totalAccumulated).toBe(7);
    expect(result.monthsCounted).toBe(4);
    expect(result.liveMonthIncluded).toBe(true);
  });

  test('NO se suma si el mes ya está congelado (manda el snapshot)', () => {
    // Caso crítico: el mes 6 ya tiene snapshot (tomado después del corte)
    // y además llega el cálculo provisorio del mes 6. Sumar ambos
    // contaría junio dos veces en el pozo del sorteo anual.
    const history = [month(3, 1), month(4, 1), month(6, 3)];
    const live = month(6, 5);

    const result = calculateAnnualAccumulatedChances(USER, history, YEAR, live);

    expect(result.totalAccumulated).toBe(5); // 1 + 1 + 3, con junio = 3 una vez
    expect(result.liveMonthIncluded).toBe(false);
    expect(result.monthlyHistory.filter((h) => h.month === 6)).toHaveLength(1);
    expect(result.monthlyHistory.find((h) => h.month === 6)?.chancesThisMonth).toBe(3);
  });

  test('un mes en curso de otro año se descarta', () => {
    // En diciembre, después del corte, el mes en curso ya es enero del
    // año siguiente: no debe entrar en el pozo de este año.
    const history = [month(10, 3)];
    const live = month(1, 4, USER, YEAR + 1);

    const result = calculateAnnualAccumulatedChances(USER, history, YEAR, live);

    expect(result.totalAccumulated).toBe(3);
    expect(result.liveMonthIncluded).toBe(false);
  });

  test('sin historial, el mes en curso solo ya es el pozo', () => {
    const result = calculateAnnualAccumulatedChances(USER, [], YEAR, month(1, 2));
    expect(result.totalAccumulated).toBe(2);
    expect(result.monthsCounted).toBe(1);
  });
});

// ============================================================
// ROBUSTEZ DE ENTRADA
// ============================================================
describe('Premio anual — robustez de la entrada', () => {
  test('ignora meses fuera de rango o no enteros', () => {
    const history = [
      month(0, 5),
      month(13, 5),
      month(1.5, 5),
      month(NaN, 5),
      month(6, 2),
    ];
    const result = calculateAnnualAccumulatedChances(USER, history, YEAR);
    expect(result.totalAccumulated).toBe(2);
    expect(result.monthsCounted).toBe(1);
  });

  test('normaliza valores inválidos o negativos a 0 sin romper la suma', () => {
    const history = [
      month(1, -3),
      month(2, NaN),
      month(3, Infinity),
      month(4, 2),
    ];
    const result = calculateAnnualAccumulatedChances(USER, history, YEAR);
    expect(result.totalAccumulated).toBe(2);
    expect(result.monthsCounted).toBe(4);
  });

  test('un historial vacío da 0 y no rompe', () => {
    const result = calculateAnnualAccumulatedChances(USER, [], YEAR);
    expect(result.totalAccumulated).toBe(0);
    expect(result.monthsCounted).toBe(0);
    expect(result.duplicateMonths).toEqual([]);
  });

  test('no muta el historial recibido', () => {
    const history = [month(9, 3), month(2, 1)];
    const snapshot = JSON.stringify(history);

    calculateAnnualAccumulatedChances(USER, history, YEAR);

    expect(JSON.stringify(history)).toBe(snapshot);
  });
});

// ============================================================
// REGLA MENSUAL DEL PREMIO ANUAL (punto 16 del pedido)
// ============================================================
describe('Premio anual — regla mensual', () => {
  test('el ejemplo del pedido: 2 directos, cada uno con 2 propios = 3', () => {
    const member = makeMember();
    const directos = [makeRef('juan'), makeRef('laura')];
    const secondLevel = new Map<string, EnrichedMember[]>([
      ['juan', [makeRef('pedro'), makeRef('martin')]],
      ['laura', [makeRef('ana'), makeRef('pablo')]],
    ]);

    const result = calculateAnnualMonthlyChances(member, directos, secondLevel, 10, YEAR);

    expect(result.chancesThisMonth).toBe(3);
  });

  test('sin 2 directos activos no hay ninguna chance anual ese mes', () => {
    const member = makeMember();
    const secondLevel = new Map<string, EnrichedMember[]>([
      ['juan', [makeRef('pedro'), makeRef('martin')]],
    ]);

    // Un solo directo activo, aunque tenga 2 propios activos: 0.
    const result = calculateAnnualMonthlyChances(
      member,
      [makeRef('juan')],
      secondLevel,
      10,
      YEAR
    );

    expect(result.chancesThisMonth).toBe(0);
  });

  test('el 2º nivel con deuda no aporta', () => {
    const member = makeMember();
    const directos = [makeRef('juan'), makeRef('laura')];
    const secondLevel = new Map<string, EnrichedMember[]>([
      ['juan', [makeRef('pedro', 'al_dia'), makeRef('martin', 'con_deuda')]],
      ['laura', []],
    ]);

    const result = calculateAnnualMonthlyChances(member, directos, secondLevel, 10, YEAR);

    // Sólo el +1 por tener 2 directos: Juan tiene 1 activo (no 2).
    expect(result.chancesThisMonth).toBe(1);
  });

  test('un directo con deuda no aporta su bonus aunque su red esté activa', () => {
    const member = makeMember();
    const directos = [makeRef('juan'), makeRef('laura'), makeRef('carlos', 'con_deuda')];
    const secondLevel = new Map<string, EnrichedMember[]>([
      ['juan', [makeRef('pedro'), makeRef('martin')]],
      ['laura', []],
      ['carlos', [makeRef('x'), makeRef('y')]],
    ]);

    const result = calculateAnnualMonthlyChances(member, directos, secondLevel, 10, YEAR);

    // +1 directos + 1 por Juan. Carlos está con deuda: no aporta.
    expect(result.chancesThisMonth).toBe(2);
  });
});

// ============================================================
// I5 — EL POZO ANUAL ES INDEPENDIENTE DEL SORTEO GENERAL
// ============================================================
describe('Premio anual — I5: independiente del sorteo general', () => {
  test('con 1 solo referido hay chances generales pero 0 anuales', () => {
    const member = makeMember({ category: 'cancha_protector' });
    const directos = [makeRef('juan')];

    const general = calculateGeneralChances(member, directos, 10, YEAR);
    const anual = calculateAnnualMonthlyChances(member, directos, new Map(), 10, YEAR);

    // 2 base (Cancha Protector) + 1 por Juan = 3 para el sorteo del mes
    expect(general.totalChances).toBe(3);
    // pero 0 para el pozo anual
    expect(anual.chancesThisMonth).toBe(0);
  });

  test('las chances generales NO se acumulan en el pozo anual', () => {
    const member = makeMember({ category: 'cancha_protector' });
    const directos = [makeRef('juan'), makeRef('laura')];
    const secondLevel = new Map<string, EnrichedMember[]>([
      ['juan', [makeRef('pedro'), makeRef('martin')]],
      ['laura', []],
    ]);

    const general = calculateGeneralChances(member, directos, 10, YEAR);
    const anual = calculateAnnualMonthlyChances(member, directos, secondLevel, 10, YEAR);
    const pozo = calculateAnnualAccumulatedChances(USER, [], YEAR, anual);

    // General: 2 base + 2 referidos = 4 (pozo distinto, se sortea ese mes)
    expect(general.totalChances).toBe(4);
    // Anual: +1 directos +1 por Juan = 2, y el pozo es 2, no 4 ni 7
    expect(anual.chancesThisMonth).toBe(2);
    expect(pozo.totalAccumulated).toBe(2);
  });
});

// ============================================================
// I6 — SOCIO CON DEUDA
// ============================================================
describe('Premio anual — I6: socio con deuda', () => {
  test('un mes con deuda da 0 pero no borra los meses anteriores', () => {
    const conDeuda = makeMember({ status: 'con_deuda' });
    const directos = [makeRef('juan'), makeRef('laura')];
    const secondLevel = new Map<string, EnrichedMember[]>([
      ['juan', [makeRef('pedro'), makeRef('martin')]],
    ]);

    const mesConDeuda = calculateAnnualMonthlyChances(
      conDeuda,
      directos,
      secondLevel,
      10,
      YEAR
    );
    expect(mesConDeuda.chancesThisMonth).toBe(0);

    // El historial de meses al día se conserva intacto.
    const history = [month(5, 2), month(6, 3)];
    const pozo = calculateAnnualAccumulatedChances(USER, history, YEAR, mesConDeuda);
    expect(pozo.totalAccumulated).toBe(5);
  });
});

// ============================================================
// COHERENCIA: HISTORIAL MOCK vs MOTOR DE CÁLCULO
// ============================================================
// El historial que ve el socio tiene que ser exactamente lo que el
// motor produce para la red que existía ese mes. Si divergen, la
// pantalla del premio anual muestra números que la regla no respalda.
//
// Se reconstruye la red anterior al corte del día 20 de cada mes
// usando referral.createdAt, y se asume que el estado al_dia/con_deuda
// actual de cada socio se mantuvo durante todo el período (el mock no
// modela cambios de estado en el tiempo).
// ============================================================
describe('Coherencia entre el historial mock y el motor', () => {
  const MARCELA = 'user-marcela-001';
  const MOCK_YEAR = 2026;

  function networkAsOf(month: number) {
    const cutoff = new Date(MOCK_YEAR, month - 1, 20, 23, 59, 59);
    const before = (iso: string) => new Date(iso) <= cutoff;

    const resolve = (referrerId: string) =>
      MOCK_REFERRALS.filter(
        (r) => r.referrerAppUserId === referrerId && r.status === 'active' && before(r.createdAt)
      )
        .map((r) => getMockMemberById(r.referredAppUserId))
        .filter((m): m is EnrichedMember => m !== null);

    const direct = resolve(MARCELA);
    const second = new Map<string, EnrichedMember[]>(
      direct.map((d) => [d.appUserId, resolve(d.appUserId)])
    );

    return { direct, second };
  }

  test('cada mes del historial coincide con lo que calcula el motor', () => {
    const marcela = getMockMemberById(MARCELA);
    expect(marcela).not.toBeNull();

    const history = MOCK_ANNUAL_HISTORY.filter((h) => h.appUserId === MARCELA);
    expect(history.length).toBeGreaterThan(0);

    for (const entry of history) {
      const { direct, second } = networkAsOf(entry.month);
      const computed = calculateAnnualMonthlyChances(
        marcela!,
        direct,
        second,
        entry.month,
        MOCK_YEAR
      );

      expect({
        mes: entry.month,
        motor: computed.chancesThisMonth,
        historial: entry.chancesThisMonth,
      }).toEqual({
        mes: entry.month,
        motor: entry.chancesThisMonth,
        historial: entry.chancesThisMonth,
      });
    }
  });

  test('los meses previos al inicio del historial valían 0', () => {
    const marcela = getMockMemberById(MARCELA);
    const recorded = MOCK_ANNUAL_HISTORY.filter((h) => h.appUserId === MARCELA).map((h) => h.month);
    const earliest = Math.min(...recorded);

    for (let m = 1; m < earliest; m++) {
      const { direct, second } = networkAsOf(m);
      const computed = calculateAnnualMonthlyChances(marcela!, direct, second, m, MOCK_YEAR);
      expect({ mes: m, chances: computed.chancesThisMonth }).toEqual({ mes: m, chances: 0 });
    }
  });

  test('el historial no tiene meses repetidos', () => {
    const months = MOCK_ANNUAL_HISTORY.map((h) => h.month);
    expect(new Set(months).size).toBe(months.length);
  });

  test('la red completa genera 2 chances anuales por mes', () => {
    const marcela = getMockMemberById(MARCELA);
    // 4 directos al día (Juan, Laura, Sofía, Lucía; Carlos con deuda) = +1
    // Juan con Pedro y Martín al día = +1
    // Laura con Ana al día y Pablo con deuda = 0
    const computed = calculateAnnualMonthlyChances(
      marcela!,
      getMockDirectReferrals(MARCELA),
      getMockSecondLevelReferrals(MARCELA),
      10,
      MOCK_YEAR
    );

    expect(computed.chancesThisMonth).toBe(2);
  });

  test('el pozo anual de la demo es la suma de los meses, sin duplicados', () => {
    const result = calculateAnnualAccumulatedChances(MARCELA, MOCK_ANNUAL_HISTORY, MOCK_YEAR);

    expect(result.duplicateMonths).toEqual([]);
    expect(result.monthsCounted).toBe(6); // abril a septiembre
    expect(result.totalAccumulated).toBe(10);
  });

  test('con el mes en curso, el pozo de la demo es 12 (10 + 2)', () => {
    const marcela = getMockMemberById(MARCELA);
    const live = calculateAnnualMonthlyChances(
      marcela!,
      getMockDirectReferrals(MARCELA),
      getMockSecondLevelReferrals(MARCELA),
      10,
      MOCK_YEAR
    );

    const result = calculateAnnualAccumulatedChances(MARCELA, MOCK_ANNUAL_HISTORY, MOCK_YEAR, live);

    expect(result.liveMonthIncluded).toBe(true);
    expect(result.monthsCounted).toBe(7);
    expect(result.totalAccumulated).toBe(12);
  });
});

// ============================================================
// CORTE MENSUAL (día 20 a las 23:59)
// ============================================================
describe('Corte mensual — día 20 a las 23:59', () => {
  test('antes del corte: mismo mes', () => {
    const r = evaluateMonthlyCutoff(new Date(2026, 9, 15, 12, 0, 0));
    expect(r).toEqual({ effectiveMonth: 10, effectiveYear: 2026, isBeyondCutoff: false });
  });

  test('exactamente en el corte: mismo mes', () => {
    const r = evaluateMonthlyCutoff(new Date(2026, 9, 20, 23, 59, 59));
    expect(r.effectiveMonth).toBe(10);
    expect(r.isBeyondCutoff).toBe(false);
  });

  test('después del corte: mes siguiente', () => {
    const r = evaluateMonthlyCutoff(new Date(2026, 9, 21, 0, 0, 0));
    expect(r.effectiveMonth).toBe(11);
    expect(r.effectiveYear).toBe(2026);
    expect(r.isBeyondCutoff).toBe(true);
  });

  test('diciembre después del corte cae en enero del año siguiente', () => {
    const r = evaluateMonthlyCutoff(new Date(2026, 11, 25, 10, 0, 0));
    expect(r.effectiveMonth).toBe(1);
    expect(r.effectiveYear).toBe(2027);
    expect(r.isBeyondCutoff).toBe(true);
  });
});

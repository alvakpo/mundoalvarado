// src/__tests__/dailyPoints.test.ts
// ============================================================
// PUNTOS DIARIOS
// ============================================================
// Lo que se verifica acá son las dos cosas que se rompen fácil:
//   1. Que el "día" sea el día del club (Mar del Plata), no UTC.
//   2. Que reclamar dos veces el mismo día no sume puntos de nuevo.
// ============================================================

import {
  POINTS_PER_DAY,
  canClaimToday,
  claimDailyPoints,
  clubDateKey,
  emptyDailyPoints,
  formatCountdown,
  msUntilNextClubDay,
  nextStreak,
  previousDateKey,
  recentDateKeys,
} from '../lib/business/dailyPoints';

// Fechas UTC de referencia. Mar del Plata es UTC-3 todo el año.
// 2026-10-06T02:00:00Z  ->  2026-10-05 23:00 en el club
// 2026-10-06T03:00:00Z  ->  2026-10-06 00:00 en el club
const UTC = (iso: string) => new Date(iso);

describe('Puntos diarios — el día es el del club, no UTC', () => {
  test('a las 23:00 de Mar del Plata todavía es el día anterior', () => {
    expect(clubDateKey(UTC('2026-10-06T02:00:00Z'))).toBe('2026-10-05');
  });

  test('a las 00:00 de Mar del Plata ya es el día nuevo', () => {
    expect(clubDateKey(UTC('2026-10-06T03:00:00Z'))).toBe('2026-10-06');
  });

  test('el cambio de día NO ocurre a la medianoche UTC', () => {
    // Si se usara UTC, a las 21:00 locales ya sería "mañana" y el socio
    // podría reclamar dos veces en la misma noche.
    const antes = clubDateKey(UTC('2026-10-06T02:00:00Z')); // 23:00 local del 5
    const despues = clubDateKey(UTC('2026-10-06T03:00:00Z')); // 00:00 local del 6
    expect(antes).toBe('2026-10-05');
    expect(despues).toBe('2026-10-06');
    expect(antes).not.toBe(despues);
  });

  test('a la medianoche local faltan 0 segundos para el día siguiente', () => {
    const ms = msUntilNextClubDay(UTC('2026-10-06T03:00:00Z'));
    expect(ms).toBe(86400 * 1000);
  });

  test('a las 23:00 locales falta una hora', () => {
    const ms = msUntilNextClubDay(UTC('2026-10-06T02:00:00Z'));
    expect(Math.round(ms / 1000 / 60)).toBe(60);
  });
});

describe('Puntos diarios — claves de fecha', () => {
  test('la fecha anterior', () => {
    expect(previousDateKey('2026-10-06')).toBe('2026-10-05');
  });

  test('la fecha anterior cruza el cambio de mes', () => {
    expect(previousDateKey('2026-11-01')).toBe('2026-10-31');
  });

  test('la fecha anterior cruza el cambio de año', () => {
    expect(previousDateKey('2027-01-01')).toBe('2026-12-31');
  });

  test('los últimos 7 días vienen del más viejo a hoy', () => {
    const dias = recentDateKeys('2026-10-06', 7);
    expect(dias).toHaveLength(7);
    expect(dias[0]).toBe('2026-09-30');
    expect(dias[6]).toBe('2026-10-06');
  });
});

describe('Puntos diarios — la regla del reclamo', () => {
  test('sin reclamar nunca, puede reclamar', () => {
    expect(canClaimToday(null, '2026-10-06')).toBe(true);
  });

  test('si ya reclamó hoy, no puede', () => {
    expect(canClaimToday('2026-10-06', '2026-10-06')).toBe(false);
  });

  test('si reclamó ayer, sí puede', () => {
    expect(canClaimToday('2026-10-05', '2026-10-06')).toBe(true);
  });

  test('el primer reclamo suma 100 puntos y arranca la racha en 1', () => {
    const result = claimDailyPoints(emptyDailyPoints(), UTC('2026-10-06T12:00:00Z'));

    expect(result.alreadyClaimed).toBe(false);
    expect(result.awarded).toBe(POINTS_PER_DAY);
    expect(result.state.totalPoints).toBe(100);
    expect(result.state.streak).toBe(1);
    expect(result.state.lastClaimDate).toBe('2026-10-06');
  });

  test('reclamar dos veces el mismo día NO suma de nuevo', () => {
    const primero = claimDailyPoints(emptyDailyPoints(), UTC('2026-10-06T12:00:00Z'));
    const segundo = claimDailyPoints(primero.state, UTC('2026-10-06T23:30:00Z'));

    expect(segundo.alreadyClaimed).toBe(true);
    expect(segundo.awarded).toBe(0);
    expect(segundo.state.totalPoints).toBe(100);
  });

  test('dos reclamos el mismo día local, separados por la medianoche UTC, no duplican', () => {
    // 22:00 y 23:30 del 6 de octubre en Mar del Plata: son el mismo día
    // del club aunque en UTC ya sea el 7.
    const a = claimDailyPoints(emptyDailyPoints(), UTC('2026-10-07T01:00:00Z')); // 22:00 del 6
    const b = claimDailyPoints(a.state, UTC('2026-10-07T02:30:00Z')); // 23:30 del 6

    expect(b.state.totalPoints).toBe(100);
    expect(b.alreadyClaimed).toBe(true);
  });

  test('reclamar el día siguiente sí suma', () => {
    const dia1 = claimDailyPoints(emptyDailyPoints(), UTC('2026-10-06T12:00:00Z'));
    const dia2 = claimDailyPoints(dia1.state, UTC('2026-10-07T12:00:00Z'));

    expect(dia2.state.totalPoints).toBe(200);
    expect(dia2.state.streak).toBe(2);
  });

  test('un día salteado reinicia la racha, pero no borra los puntos', () => {
    const dia1 = claimDailyPoints(emptyDailyPoints(), UTC('2026-10-06T12:00:00Z'));
    const dia2 = claimDailyPoints(dia1.state, UTC('2026-10-07T12:00:00Z'));
    // Se saltea el 8 y reclama el 9
    const dia4 = claimDailyPoints(dia2.state, UTC('2026-10-09T12:00:00Z'));

    expect(dia4.state.streak).toBe(1);
    expect(dia4.state.totalPoints).toBe(300);
  });
});

describe('Puntos diarios — racha', () => {
  test('ayer reclamado: la racha sigue', () => {
    expect(nextStreak('2026-10-05', 4, '2026-10-06')).toBe(5);
  });

  test('hoy ya reclamado: la racha no cambia', () => {
    expect(nextStreak('2026-10-06', 4, '2026-10-06')).toBe(4);
  });

  test('hueco de más de un día: vuelve a 1', () => {
    expect(nextStreak('2026-10-03', 9, '2026-10-06')).toBe(1);
  });

  test('nunca reclamó: arranca en 1', () => {
    expect(nextStreak(null, 0, '2026-10-06')).toBe(1);
  });

  test('la racha no se rompe al cruzar el mes', () => {
    expect(nextStreak('2026-10-31', 3, '2026-11-01')).toBe(4);
  });
});

describe('Puntos diarios — contador', () => {
  test('formatea horas, minutos y segundos', () => {
    expect(formatCountdown(0)).toBe('00:00:00');
    expect(formatCountdown(1000)).toBe('00:00:01');
    expect(formatCountdown(61 * 1000)).toBe('00:01:01');
    expect(formatCountdown((2 * 3600 + 34 * 60 + 5) * 1000)).toBe('02:34:05');
  });

  test('nunca muestra negativo', () => {
    expect(formatCountdown(-5000)).toBe('00:00:00');
  });
});

describe('Puntos diarios — no se guarda historial infinito', () => {
  test('el historial queda acotado aunque pasen muchos días', () => {
    let state = emptyDailyPoints();
    const inicio = Date.UTC(2026, 0, 1, 12);
    for (let i = 0; i < 200; i++) {
      state = claimDailyPoints(state, new Date(inicio + i * 86400000)).state;
    }
    expect(state.totalPoints).toBe(200 * POINTS_PER_DAY);
    expect(state.claimedDates.length).toBeLessThanOrEqual(90);
  });
});

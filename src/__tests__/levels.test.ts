// src/__tests__/levels.test.ts
// ============================================================
// NIVELES
// ============================================================
// Lo que se verifica acá es que los rangos sean correlativos y sin
// superposición: cada cantidad de referidos tiene que caer en UN solo
// nivel. Es el problema que tenían los rangos originales del club.
// ============================================================

import {
  LEVELS,
  MAX_LEVEL,
  levelDefinition,
  levelForReferralCount,
  levelProgress,
  levelRangeLabel,
  stepOpacity,
} from '../lib/business/levels';

describe('Niveles — rangos', () => {
  test('los niveles son correlativos, sin saltearse ninguno', () => {
    expect(LEVELS.map((l) => l.level)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(LEVELS).toHaveLength(MAX_LEVEL + 1);
  });

  test('no hay superposición ni huecos entre 0 y 60 referidos', () => {
    // La prueba más importante: cada cantidad cae en exactamente un nivel.
    for (let count = 0; count <= 60; count++) {
      const coincidencias = LEVELS.filter(
        (l) => count >= l.minReferrals && (l.maxReferrals === null || count <= l.maxReferrals)
      );
      expect({ count, coincidencias: coincidencias.length }).toEqual({ count, coincidencias: 1 });
    }
  });

  test('el rango siguiente arranca justo después del anterior', () => {
    for (let i = 0; i < LEVELS.length - 1; i++) {
      const actual = LEVELS[i];
      const siguiente = LEVELS[i + 1];
      expect(siguiente.minReferrals).toBe((actual.maxReferrals ?? 0) + 1);
    }
  });

  test('el último nivel no tiene techo', () => {
    expect(LEVELS[LEVELS.length - 1].maxReferrals).toBeNull();
  });
});

describe('Niveles — qué nivel corresponde', () => {
  test('los cortes exactos', () => {
    const esperado: Array<[number, number]> = [
      [0, 0],
      [1, 1],
      [2, 1],
      [3, 2],
      [5, 2],
      [6, 3],
      [10, 3],
      [11, 4],
      [15, 4],
      [16, 5],
      [20, 5],
      [21, 6],
      [30, 6],
      [31, 7],
      [50, 7],
      [500, 7],
    ];
    for (const [count, level] of esperado) {
      expect({ count, nivel: levelForReferralCount(count) }).toEqual({ count, nivel: level });
    }
  });

  test('cantidades inválidas caen en el nivel 0', () => {
    expect(levelForReferralCount(-5)).toBe(0);
    expect(levelForReferralCount(NaN)).toBe(0);
    expect(levelForReferralCount(Infinity)).toBe(0);
  });

  test('el nivel nunca supera el máximo', () => {
    expect(levelForReferralCount(99999)).toBe(MAX_LEVEL);
  });

  test('levelDefinition acota valores fuera de rango', () => {
    expect(levelDefinition(-3).level).toBe(0);
    expect(levelDefinition(99).level).toBe(MAX_LEVEL);
  });

  test('las etiquetas de rango se leen bien', () => {
    expect(levelRangeLabel(0)).toBe('0');
    expect(levelRangeLabel(1)).toBe('1 a 2');
    expect(levelRangeLabel(3)).toBe('6 a 10');
    expect(levelRangeLabel(7)).toBe('31 o más');
  });
});

describe('Niveles — cuánto falta para subir', () => {
  test('con 0 referidos, faltan 1 para el nivel 1', () => {
    const p = levelProgress(0);
    expect(p.currentLevel).toBe(0);
    expect(p.nextLevel).toBe(1);
    expect(p.missingForNext).toBe(1);
  });

  test('con 4 referidos, estás en nivel 2 y faltan 2 para el 3', () => {
    const p = levelProgress(4);
    expect(p.currentLevel).toBe(2);
    expect(p.nextLevel).toBe(3);
    expect(p.missingForNext).toBe(2);
  });

  test('en el nivel máximo no hay próximo', () => {
    const p = levelProgress(40);
    expect(p.currentLevel).toBe(MAX_LEVEL);
    expect(p.nextLevel).toBeNull();
    expect(p.missingForNext).toBeNull();
    expect(p.progressInLevel).toBe(1);
  });

  test('el avance dentro del nivel va de 0 a 1', () => {
    // Nivel 1 va de 1 a 2; el 2 arranca en 3, así que el tramo es 2.
    expect(levelProgress(1).progressInLevel).toBe(0);
    expect(levelProgress(2).progressInLevel).toBe(0.5);
    expect(levelProgress(3).currentLevel).toBe(2);
  });

  test('el título acompaña al nivel', () => {
    expect(levelProgress(0).currentTitle).toBe('Sin nivel');
    expect(levelProgress(25).currentTitle).toBe('Embajador');
  });
});

describe('Niveles — la escalera se desvanece hacia arriba', () => {
  test('los niveles alcanzados se ven completos', () => {
    for (let level = 0; level <= 3; level++) {
      expect(stepOpacity(level, 3)).toBe(1);
    }
  });

  test('los que faltan se van atenuando', () => {
    const actual = 2;
    const opacidades = [3, 4, 5, 6, 7].map((l) => stepOpacity(l, actual));
    // Estrictamente decreciente
    for (let i = 1; i < opacidades.length; i++) {
      expect(opacidades[i]).toBeLessThan(opacidades[i - 1]);
    }
  });

  test('el siguiente nivel se ve claramente, no borrado', () => {
    expect(stepOpacity(3, 2)).toBeGreaterThanOrEqual(0.5);
  });

  test('los lejanos quedan casi invisibles pero presentes', () => {
    expect(stepOpacity(7, 0)).toBeGreaterThan(0);
    expect(stepOpacity(7, 0)).toBeLessThan(0.15);
  });
});

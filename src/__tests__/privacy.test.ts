// src/__tests__/privacy.test.ts
// ============================================================
// PRIVACIDAD DE LA RED
// ============================================================
// Un socio ve la ficha completa de sus referidos DIRECTOS. De los
// referidos de sus referidos, sólo el nombre de pila y el estado.
//
// Lo que se protege acá no es "que la pantalla no lo dibuje": es que el
// dato no llegue nunca al objeto. Si no está en el objeto, no hay forma
// de que se filtre por un descuido de la interfaz.
// ============================================================

import { toSecondLevelSummaries } from '../lib/business/privacy';
import { calculateAnnualMonthlyChances } from '../lib/business/chancesCalculator';
import {
  MOCK_MEMBERS,
  getMockDirectReferrals,
  getMockSecondLevelReferrals,
} from '../lib/mock/mockData';
import { EnrichedMember } from '../types';

const MARCELA = 'user-marcela-001';

function socio(overrides: Partial<EnrichedMember> = {}): EnrichedMember {
  return {
    appUserId: 'user-x',
    brioMemberId: 'brio-x',
    memberNumber: '99999',
    firstName: 'Pedro',
    lastName: 'Sánchez',
    category: 'cancha_protector',
    status: 'al_dia',
    phone: '+54 9 223 555-0000',
    photoUrl: 'https://ejemplo.com/foto.jpg',
    email: 'pedro@test.com',
    referralCode: 'PEDR9999',
    publicAlias: 'pedros',
    referredByAppUserId: 'user-juan-002',
    ...overrides,
  };
}

describe('Privacidad — el segundo nivel queda reducido al mínimo', () => {
  test('sólo devuelve nombre de pila y estado, ninguna otra propiedad', () => {
    const [resumen] = toSecondLevelSummaries([socio()]);

    // La aserción más fuerte: el conjunto EXACTO de propiedades.
    expect(Object.keys(resumen).sort()).toEqual(['firstName', 'status']);
  });

  test('no filtra el apellido', () => {
    const [resumen] = toSecondLevelSummaries([socio({ lastName: 'Sánchez' })]);
    expect(resumen.firstName).toBe('Pedro');
    expect(JSON.stringify(resumen)).not.toContain('Sánchez');
    expect(JSON.stringify(resumen)).not.toContain('Sanchez');
  });

  test('no filtra el número de socio', () => {
    const [resumen] = toSecondLevelSummaries([socio({ memberNumber: '09200' })]);
    expect(JSON.stringify(resumen)).not.toContain('09200');
  });

  test('no filtra el celular ni el email', () => {
    const [resumen] = toSecondLevelSummaries([
      socio({ phone: '+54 9 223 555-6789', email: 'pedro@test.com' }),
    ]);
    const json = JSON.stringify(resumen);
    expect(json).not.toContain('555-6789');
    expect(json).not.toContain('pedro@test.com');
  });

  test('no filtra la foto ni la categoría de socio', () => {
    const [resumen] = toSecondLevelSummaries([
      socio({ photoUrl: 'https://ejemplo.com/foto.jpg', category: 'cancha_protector' }),
    ]);
    const json = JSON.stringify(resumen);
    expect(json).not.toContain('foto.jpg');
    expect(json).not.toContain('cancha_protector');
  });

  test('no filtra ningún identificador interno', () => {
    const [resumen] = toSecondLevelSummaries([
      socio({
        appUserId: 'user-pedro-006',
        brioMemberId: 'brio-006',
        referralCode: 'PEDR9200',
        publicAlias: 'pedros',
        referredByAppUserId: 'user-juan-002',
      }),
    ]);
    const json = JSON.stringify(resumen);
    for (const dato of ['user-pedro-006', 'brio-006', 'PEDR9200', 'pedros', 'user-juan-002']) {
      expect(json).not.toContain(dato);
    }
  });

  test('conserva el estado, que es lo que el premio anual necesita', () => {
    const resumenes = toSecondLevelSummaries([
      socio({ firstName: 'AlDia', status: 'al_dia' }),
      socio({ firstName: 'ConDeuda', status: 'con_deuda' }),
    ]);
    expect(resumenes.map((r) => r.status)).toEqual(['al_dia', 'con_deuda']);
  });
});

describe('Privacidad — el cálculo anual no necesita los datos personales', () => {
  test('el premio anual se resuelve con sólo el estado del segundo nivel', () => {
    const marcela = MOCK_MEMBERS.find((m) => m.appUserId === MARCELA);
    expect(marcela).toBeDefined();

    const directos = getMockDirectReferrals(MARCELA);

    // Se calcula con los resúmenes, no con las fichas completas.
    const resumidos = new Map(
      Array.from(getMockSecondLevelReferrals(MARCELA).entries()).map(
        ([parentId, members]) => [parentId, toSecondLevelSummaries(members)]
      )
    );

    const conResumenes = calculateAnnualMonthlyChances(
      marcela!,
      directos,
      resumidos,
      10,
      2026
    );

    // Y da exactamente lo mismo que con las fichas completas.
    const conFichas = calculateAnnualMonthlyChances(
      marcela!,
      directos,
      getMockSecondLevelReferrals(MARCELA),
      10,
      2026
    );

    expect(conResumenes.chancesThisMonth).toBe(conFichas.chancesThisMonth);
    expect(conResumenes.chancesThisMonth).toBe(2);
  });
});

describe('Privacidad — sobre los datos mock reales', () => {
  test('la red indirecta de Marcela queda sin apellidos ni contactos', () => {
    const resumidos = toSecondLevelSummaries(
      Array.from(getMockSecondLevelReferrals(MARCELA).values()).flat()
    );

    // Marcela tiene 4 personas en su red indirecta.
    expect(resumidos.map((r) => r.firstName).sort()).toEqual([
      'Ana',
      'Martín',
      'Pablo',
      'Pedro',
    ]);

    for (const resumen of resumidos) {
      expect(Object.keys(resumen).sort()).toEqual(['firstName', 'status']);
    }

    // Ningún apellido real del mock debe aparecer en el resultado.
    const json = JSON.stringify(resumidos);
    for (const apellido of ['Sánchez', 'García', 'Fernández', 'Torres']) {
      expect(json).not.toContain(apellido);
    }
  });

  test('los referidos DIRECTOS sí conservan la ficha completa', () => {
    // El primer nivel es distinto a propósito: los invitó el socio.
    const directos = getMockDirectReferrals(MARCELA);
    const juan = directos.find((m) => m.firstName === 'Juan');

    expect(juan).toBeDefined();
    expect(juan!.lastName).toBe('Pérez');
    expect(juan!.memberNumber).toBe('05120');
    expect(juan!.phone).toBeTruthy();
  });
});

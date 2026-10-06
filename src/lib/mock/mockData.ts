// src/lib/mock/mockData.ts
// ============================================================
// DATOS MOCK PARA DESARROLLO Y TESTING
// ============================================================

import {
  EnrichedMember,
  Referral,
  MonthlyChancesResult,
} from '@/types';
import { calculateGeneralChances } from '@/lib/business/chancesCalculator';

/** Mes en que arrancó el programa (el club empezó a repartir chances). */
export const PROGRAM_START_MONTH = 4;

// ---- USUARIOS MOCK ----
export const MOCK_MEMBERS: EnrichedMember[] = [
  // Usuario principal de prueba (el que inicia sesión)
  {
    appUserId: 'user-marcela-001',
    brioMemberId: 'brio-001',
    memberNumber: '04827',
    firstName: 'Marcela',
    lastName: 'González',
    category: 'cancha_protector',
    status: 'al_dia',
    phone: '+54 9 223 555-1234',
    photoUrl: null,
    email: 'marcela@test.com',
    referralCode: 'MARCE4827',
    publicAlias: 'marce',
    referredByAppUserId: null,
  },
  // Referidos directos de Marcela
  {
    appUserId: 'user-juan-002',
    brioMemberId: 'brio-002',
    memberNumber: '05120',
    firstName: 'Juan',
    lastName: 'Pérez',
    category: 'cancha',
    status: 'al_dia',
    phone: '+54 9 223 555-2345',
    photoUrl: null,
    email: 'juan@test.com',
    referralCode: 'JUAN5120',
    publicAlias: 'juanp',
    referredByAppUserId: 'user-marcela-001',
  },
  {
    appUserId: 'user-laura-003',
    brioMemberId: 'brio-003',
    memberNumber: '06300',
    firstName: 'Laura',
    lastName: 'Martínez',
    category: 'activo',
    status: 'al_dia',
    phone: '+54 9 223 555-3456',
    photoUrl: null,
    email: 'laura@test.com',
    referralCode: 'LAURA6300',
    publicAlias: 'lauram',
    referredByAppUserId: 'user-marcela-001',
  },
  {
    appUserId: 'user-carlos-004',
    brioMemberId: 'brio-004',
    memberNumber: '07890',
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    category: 'activo_protector',
    status: 'con_deuda',
    phone: '+54 9 223 555-4567',
    photoUrl: null,
    email: 'carlos@test.com',
    referralCode: 'CARL7890',
    publicAlias: 'carlosr',
    referredByAppUserId: 'user-marcela-001',
  },
  {
    appUserId: 'user-sofia-005',
    brioMemberId: 'brio-005',
    memberNumber: '08150',
    firstName: 'Sofía',
    lastName: 'López',
    category: 'cancha',
    status: 'al_dia',
    phone: '+54 9 223 555-5678',
    photoUrl: null,
    email: 'sofia@test.com',
    referralCode: 'SOFI8150',
    publicAlias: 'sofil',
    referredByAppUserId: 'user-marcela-001',
  },
  // Referidos de segundo nivel (referidos de Juan)
  {
    appUserId: 'user-pedro-006',
    brioMemberId: 'brio-006',
    memberNumber: '09200',
    firstName: 'Pedro',
    lastName: 'Sánchez',
    category: 'activo',
    status: 'al_dia',
    phone: '+54 9 223 555-6789',
    photoUrl: null,
    email: 'pedro@test.com',
    referralCode: 'PEDR9200',
    publicAlias: 'pedros',
    referredByAppUserId: 'user-juan-002',
  },
  {
    appUserId: 'user-martin-007',
    brioMemberId: 'brio-007',
    memberNumber: '09450',
    firstName: 'Martín',
    lastName: 'García',
    category: 'activo',
    status: 'al_dia',
    phone: '+54 9 223 555-7890',
    photoUrl: null,
    email: 'martin@test.com',
    referralCode: 'MART9450',
    publicAlias: 'marting',
    referredByAppUserId: 'user-juan-002',
  },
  // Referidos de segundo nivel (referidos de Laura)
  {
    appUserId: 'user-ana-008',
    brioMemberId: 'brio-008',
    memberNumber: '09700',
    firstName: 'Ana',
    lastName: 'Fernández',
    category: 'activo',
    status: 'al_dia',
    phone: '+54 9 223 555-8901',
    photoUrl: null,
    email: 'ana@test.com',
    referralCode: 'ANAF9700',
    publicAlias: 'anaf',
    referredByAppUserId: 'user-laura-003',
  },
  {
    appUserId: 'user-pablo-009',
    brioMemberId: 'brio-009',
    memberNumber: '09850',
    firstName: 'Pablo',
    lastName: 'Torres',
    category: 'cancha',
    status: 'con_deuda',
    phone: '+54 9 223 555-9012',
    photoUrl: null,
    email: 'pablo@test.com',
    referralCode: 'PABL9850',
    publicAlias: 'pablot',
    referredByAppUserId: 'user-laura-003',
  },
  // Usuario sin referidos
  {
    appUserId: 'user-lucia-010',
    brioMemberId: 'brio-010',
    memberNumber: '10100',
    firstName: 'Lucía',
    lastName: 'Ramírez',
    category: 'activo',
    status: 'al_dia',
    phone: '+54 9 223 555-0123',
    photoUrl: null,
    email: 'lucia@test.com',
    referralCode: 'LUCI0100',
    publicAlias: 'luciar',
    referredByAppUserId: 'user-marcela-001',
  },
];

// ---- REFERIDOS MOCK ----
export const MOCK_REFERRALS: Referral[] = [
  // Referidos directos de Marcela
  {
    id: 'ref-001',
    referrerAppUserId: 'user-marcela-001',
    referredAppUserId: 'user-juan-002',
    status: 'active',
    createdAt: '2026-03-15T10:00:00Z',
  },
  {
    id: 'ref-002',
    referrerAppUserId: 'user-marcela-001',
    referredAppUserId: 'user-laura-003',
    status: 'active',
    createdAt: '2026-04-20T14:00:00Z',
  },
  {
    id: 'ref-003',
    referrerAppUserId: 'user-marcela-001',
    referredAppUserId: 'user-carlos-004',
    status: 'active',
    createdAt: '2026-05-10T09:00:00Z',
  },
  {
    id: 'ref-004',
    referrerAppUserId: 'user-marcela-001',
    referredAppUserId: 'user-sofia-005',
    status: 'active',
    createdAt: '2026-06-01T11:00:00Z',
  },
  {
    id: 'ref-005',
    referrerAppUserId: 'user-marcela-001',
    referredAppUserId: 'user-lucia-010',
    status: 'active',
    createdAt: '2026-07-15T16:00:00Z',
  },
  // Referidos de Juan
  {
    id: 'ref-006',
    referrerAppUserId: 'user-juan-002',
    referredAppUserId: 'user-pedro-006',
    status: 'active',
    createdAt: '2026-05-20T10:00:00Z',
  },
  {
    id: 'ref-007',
    referrerAppUserId: 'user-juan-002',
    referredAppUserId: 'user-martin-007',
    status: 'active',
    createdAt: '2026-06-10T12:00:00Z',
  },
  // Referidos de Laura
  {
    id: 'ref-008',
    referrerAppUserId: 'user-laura-003',
    referredAppUserId: 'user-ana-008',
    status: 'active',
    createdAt: '2026-06-25T08:00:00Z',
  },
  {
    id: 'ref-009',
    referrerAppUserId: 'user-laura-003',
    referredAppUserId: 'user-pablo-009',
    status: 'active',
    createdAt: '2026-07-01T13:00:00Z',
  },
];

// ---- CUENTA DE PRUEBA ----
export const TEST_ACCOUNT = {
  email: 'marcela@test.com',
  password: 'test1234',
  appUserId: 'user-marcela-001',
};

// Helper para obtener miembro por ID
export function getMockMemberById(appUserId: string): EnrichedMember | null {
  return MOCK_MEMBERS.find((m) => m.appUserId === appUserId) ?? null;
}

// Helper para obtener referidos directos de un usuario
export function getMockDirectReferrals(appUserId: string): EnrichedMember[] {
  const directReferralIds = MOCK_REFERRALS
    .filter((r) => r.referrerAppUserId === appUserId && r.status === 'active')
    .map((r) => r.referredAppUserId);

  return MOCK_MEMBERS.filter((m) => directReferralIds.includes(m.appUserId));
}

// ============================================================
// HISTORIAL DE CHANCES DEL SORTEO GENERAL (mes a mes)
// ============================================================
// Este historial NO se escribe a mano: se calcula con el MISMO motor
// que usa la pantalla de chances, sobre la red que existía antes del
// corte del día 20 de cada mes (según referral.createdAt).
//
// Se hace así a propósito. Un historial escrito a mano se desincroniza
// del motor en cuanto cambia una regla, y la pantalla termina mostrando
// números que la propia lógica no respalda. Calculándolo, es imposible.
// ============================================================

/** La red de referidos directos tal como estaba antes del corte del mes. */
function directNetworkAtCutoff(
  appUserId: string,
  year: number,
  month: number
): EnrichedMember[] {
  const cutoff = new Date(year, month - 1, 20, 23, 59, 59);
  const ids = MOCK_REFERRALS
    .filter(
      (r) =>
        r.referrerAppUserId === appUserId &&
        r.status === 'active' &&
        new Date(r.createdAt) <= cutoff
    )
    .map((r) => r.referredAppUserId);

  return MOCK_MEMBERS.filter((m) => ids.includes(m.appUserId));
}

/**
 * Las chances del sorteo general de cada mes cerrado del año.
 * `throughMonth` es el último mes ya cerrado; el mes en curso se calcula
 * aparte y se pasa como provisorio.
 */
export function buildMockMonthlyGeneralHistory(
  appUserId: string,
  year: number,
  throughMonth: number
): MonthlyChancesResult[] {
  const owner = getMockMemberById(appUserId);
  if (!owner) return [];

  const history: MonthlyChancesResult[] = [];
  for (let month = PROGRAM_START_MONTH; month <= throughMonth; month++) {
    history.push(
      calculateGeneralChances(owner, directNetworkAtCutoff(appUserId, year, month), month, year)
    );
  }
  return history;
}

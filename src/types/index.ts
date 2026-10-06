// src/types/index.ts
// ============================================================
// TIPOS PRINCIPALES DE LA APLICACIÓN - MUNDO ALVARADO
// ============================================================

// ---- IDENTIDADES ----
export type AppUserId = string;
export type BrioMemberId = string | null;
export type MemberNumber = string;
export type ReferralCode = string;
export type PublicAlias = string;

// ---- CATEGORÍAS DE SOCIO ----
export type MemberCategory =
  | 'activo'
  | 'activo_protector'
  | 'cancha'
  | 'cancha_protector';

export const MEMBER_CATEGORY_LABELS: Record<MemberCategory, string> = {
  activo: 'Socio Activo',
  activo_protector: 'Socio Activo Protector',
  cancha: 'Socio Cancha',
  cancha_protector: 'Socio Cancha Protector',
};

// Chances base por categoría para el sorteo general del mes.
// Regla del club: Socio Activo suma 1; cualquier otra categoría suma 2.
export const BASE_CHANCES: Record<MemberCategory, number> = {
  activo: 1,
  activo_protector: 2,
  cancha: 2,
  cancha_protector: 2,
};

// ---- ESTADO DEL SOCIO ----
export type MemberStatus = 'al_dia' | 'con_deuda';

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  al_dia: 'Socio al día',
  con_deuda: 'Socio con deuda',
};

// ---- PERFIL DE USUARIO DE LA APP ----
export interface AppProfile {
  appUserId: AppUserId;
  brioMemberId: BrioMemberId;
  memberNumber: MemberNumber | null;
  referralCode: ReferralCode;
  publicAlias: PublicAlias;
  referredByAppUserId: AppUserId | null;
  createdAt: string;
  updatedAt: string;
}

// ---- DATOS DE MIEMBRO (desde Brío o Mock) ----
export interface BrioMemberData {
  brioMemberId: BrioMemberId;
  memberNumber: MemberNumber | null;
  firstName: string;
  lastName: string;
  category: MemberCategory;
  status: MemberStatus;
  phone: string | null;
  photoUrl: string | null;
  email: string | null;
}

// ---- MIEMBRO ENRIQUECIDO (App + Brío) ----
export interface EnrichedMember extends BrioMemberData {
  appUserId: AppUserId;
  referralCode: ReferralCode;
  publicAlias: PublicAlias;
  referredByAppUserId: AppUserId | null;
}

// ---- REFERIDOS ----
export type ReferralStatus = 'pending' | 'active' | 'inactive';

export interface Referral {
  id: string;
  referrerAppUserId: AppUserId;
  referredAppUserId: AppUserId;
  status: ReferralStatus;
  createdAt: string;
}

// ---- REFERIDO CON DATOS DEL MIEMBRO ----
export interface ReferralWithMember extends Referral {
  referredMember: EnrichedMember;
  referredMemberReferralCount?: number;
}

// ---- CHANCES MENSUALES ----
export interface ChanceBreakdownItem {
  label: string;
  chances: number;
  reason: string;
}

export interface MonthlyChancesResult {
  appUserId: AppUserId;
  month: number;
  year: number;
  baseChances: number;
  referralChances: number;
  totalChances: number;
  breakdown: ChanceBreakdownItem[];
}

// ---- CHANCES ANUALES (ACUMULADAS) ----
export interface AnnualMonthlyChancesResult {
  appUserId: AppUserId;
  month: number;
  year: number;
  chancesThisMonth: number;
  breakdown: ChanceBreakdownItem[];
}

// Serie anual: los meses que componen el pozo del sorteo anual.
// Invariante: como máximo UNA entrada por mes. El sorteo anual se juega
// una sola vez al año, así que un mes contado dos veces infla el pozo.
export interface AnnualYearSeries {
  appUserId: AppUserId;
  year: number;
  periods: AnnualMonthlyChancesResult[];
  monthsCounted: number;
  totalAccumulated: number;
  /** Meses que venían repetidos en los snapshots (se contaron una vez). */
  duplicateMonths: number[];
  /** true si el mes en curso entró como provisorio (no estaba congelado). */
  liveMonthIncluded: boolean;
}

export interface AnnualAccumulatedResult {
  appUserId: AppUserId;
  year: number;
  totalAccumulated: number;
  monthlyHistory: AnnualMonthlyChancesResult[];
  monthsCounted: number;
  duplicateMonths: number[];
  liveMonthIncluded: boolean;
}

// ---- RED DE REFERIDOS (2 NIVELES) ----
export interface ReferralNetworkNode {
  member: EnrichedMember;
  level: 1 | 2;
  directReferrals?: EnrichedMember[]; // solo para nivel 1
}

export interface ReferralNetwork {
  owner: EnrichedMember;
  level1: ReferralNetworkNode[];
}

// ---- CONTEXTO DE AUTH ----
export interface AuthUser {
  id: AppUserId;
  email: string;
  profile: AppProfile | null;
}

// ---- CORTE MENSUAL ----
export const MONTHLY_CUTOFF_DAY = 20;
export const MONTHLY_CUTOFF_HOUR = 23;
export const MONTHLY_CUTOFF_MINUTE = 59;

// ---- RESULTADOS GENERALES ----
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

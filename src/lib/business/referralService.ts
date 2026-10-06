// src/lib/business/referralService.ts
// ============================================================
// LÓGICA DE NEGOCIO: SERVICIO DE REFERIDOS
// ============================================================

import { getMockDirectReferrals } from '@/lib/mock/mockData';

// Generar código de referido único basado en nombre + número
export function generateReferralCode(firstName: string, memberNumber: string): string {
  const namePart = firstName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
  const numPart = memberNumber.replace(/[^0-9]/g, '').slice(-4);
  return `${namePart}${numPart}`;
}

// Generar alias público
export function generatePublicAlias(firstName: string, lastName: string): string {
  const base = `${firstName}${lastName.charAt(0)}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return base;
}

// Contar referidos directos de un usuario
export function countDirectReferrals(appUserId: string): number {
  return getMockDirectReferrals(appUserId).length;
}

// Contar referidos activos directos de un usuario
export function countActiveDirectReferrals(appUserId: string): number {
  return getMockDirectReferrals(appUserId).filter((r) => r.status === 'al_dia').length;
}

// src/lib/brio/mockBrioAdapter.ts
// ============================================================
// MOCK ADAPTER DE BRÍO - Para reemplazar por la integración real
// ============================================================

import { BrioAdapter, BrioMemberRaw } from './brioTypes';
import { MemberCategory, MemberStatus } from '@/types';
import { MOCK_MEMBERS } from '@/lib/mock/mockData';

const MOCK_BRIO_DB: BrioMemberRaw[] = MOCK_MEMBERS.map((m) => ({
  brioMemberId: m.brioMemberId,
  memberNumber: m.memberNumber ?? '',
  firstName: m.firstName,
  lastName: m.lastName,
  category: m.category,
  status: m.status,
  phone: m.phone,
  photoUrl: m.photoUrl,
  email: m.email,
}));

async function simulateDelay(ms = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const MockBrioAdapter: BrioAdapter = {
  async getMemberById(brioMemberId: string): Promise<BrioMemberRaw | null> {
    await simulateDelay();
    return MOCK_BRIO_DB.find((m) => m.brioMemberId === brioMemberId) ?? null;
  },

  async getMemberByNumber(memberNumber: string): Promise<BrioMemberRaw | null> {
    await simulateDelay();
    return MOCK_BRIO_DB.find((m) => m.memberNumber === memberNumber) ?? null;
  },

  async getMemberStatus(brioMemberId: string): Promise<MemberStatus | null> {
    await simulateDelay();
    const member = MOCK_BRIO_DB.find((m) => m.brioMemberId === brioMemberId);
    return member?.status ?? null;
  },

  async getMemberCategory(brioMemberId: string): Promise<MemberCategory | null> {
    await simulateDelay();
    const member = MOCK_BRIO_DB.find((m) => m.brioMemberId === brioMemberId);
    return member?.category ?? null;
  },

  async getMemberPhone(brioMemberId: string): Promise<string | null> {
    await simulateDelay();
    const member = MOCK_BRIO_DB.find((m) => m.brioMemberId === brioMemberId);
    return member?.phone ?? null;
  },

  async getMemberPhoto(brioMemberId: string): Promise<string | null> {
    await simulateDelay();
    const member = MOCK_BRIO_DB.find((m) => m.brioMemberId === brioMemberId);
    return member?.photoUrl ?? null;
  },

  async getMemberNumber(brioMemberId: string): Promise<string | null> {
    await simulateDelay();
    const member = MOCK_BRIO_DB.find((m) => m.brioMemberId === brioMemberId);
    return member?.memberNumber ?? null;
  },

  async searchMemberByEmail(email: string): Promise<BrioMemberRaw | null> {
    await simulateDelay();
    return MOCK_BRIO_DB.find((m) => m.email === email) ?? null;
  },
};

// Exportar el adapter activo según el feature flag
// Para la integración real, crear RealBrioAdapter y reemplazar aquí
export function getBrioAdapter(): BrioAdapter {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_BRIO !== 'false';
  if (useMock) {
    return MockBrioAdapter;
  }
  // TODO: return RealBrioAdapter cuando esté disponible
  return MockBrioAdapter;
}

// src/lib/brio/brioTypes.ts
// ============================================================
// TIPOS PARA LA INTEGRACIÓN CON BRÍO
// ============================================================

import { BrioMemberId, MemberCategory, MemberStatus } from '@/types';

export interface BrioMemberRaw {
  brioMemberId: BrioMemberId;
  memberNumber: string;
  firstName: string;
  lastName: string;
  category: MemberCategory;
  status: MemberStatus;
  phone: string | null;
  photoUrl: string | null;
  email: string | null;
}

export interface BrioAdapter {
  getMemberById(brioMemberId: string): Promise<BrioMemberRaw | null>;
  getMemberByNumber(memberNumber: string): Promise<BrioMemberRaw | null>;
  getMemberStatus(brioMemberId: string): Promise<MemberStatus | null>;
  getMemberCategory(brioMemberId: string): Promise<MemberCategory | null>;
  getMemberPhone(brioMemberId: string): Promise<string | null>;
  getMemberPhoto(brioMemberId: string): Promise<string | null>;
  getMemberNumber(brioMemberId: string): Promise<string | null>;
  searchMemberByEmail(email: string): Promise<BrioMemberRaw | null>;
}

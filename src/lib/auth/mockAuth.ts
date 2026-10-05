// src/lib/auth/mockAuth.ts
// ============================================================
// AUTENTICACIÓN MOCK PARA DESARROLLO
// ============================================================

import { MOCK_MEMBERS, TEST_ACCOUNT } from '@/lib/mock/mockData';
import { EnrichedMember } from '@/types';

interface MockSession {
  user: EnrichedMember;
  token: string;
}

// Simula una sesión en localStorage
const SESSION_KEY = 'mundo_alvarado_mock_session';

export function mockLogin(email: string, password: string): MockSession | null {
  if (email === TEST_ACCOUNT.email && password === TEST_ACCOUNT.password) {
    const user = MOCK_MEMBERS.find((m) => m.appUserId === TEST_ACCOUNT.appUserId);
    if (!user) return null;

    const session: MockSession = {
      user,
      token: `mock-token-${Date.now()}`,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    return session;
  }
  return null;
}

export function mockGetSession(): MockSession | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as MockSession;
  } catch {
    return null;
  }
}

export function mockLogout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function mockRegister(
  email: string,
  _password: string,
  firstName: string,
  lastName: string,
  referralCode?: string
): MockSession {
  // En modo mock, simulamos un registro exitoso
  const newUser: EnrichedMember = {
    appUserId: `user-${Date.now()}`,
    brioMemberId: null,
    memberNumber: null,
    firstName,
    lastName,
    category: 'activo',
    status: 'al_dia',
    phone: null,
    photoUrl: null,
    email,
    referralCode: `${firstName.toUpperCase().slice(0, 4)}${Math.floor(Math.random() * 9999)}`,
    publicAlias: `${firstName.toLowerCase()}${lastName.toLowerCase().charAt(0)}`,
    referredByAppUserId: referralCode
      ? MOCK_MEMBERS.find((m) => m.referralCode === referralCode)?.appUserId ?? null
      : null,
  };

  const session: MockSession = { user: newUser, token: `mock-token-${Date.now()}` };

  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  return session;
}

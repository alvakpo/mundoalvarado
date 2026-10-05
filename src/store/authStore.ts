// src/store/authStore.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EnrichedMember } from '@/types';
import { mockLogin, mockLogout, mockRegister } from '@/lib/auth/mockAuth';

interface AuthState {
  user: EnrichedMember | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    referralCode?: string
  ) => Promise<boolean>;
  setUser: (user: EnrichedMember | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const session = mockLogin(email, password);
          if (session) {
            set({ user: session.user, isLoading: false });
            return true;
          } else {
            set({ error: 'Email o contraseña incorrectos', isLoading: false });
            return false;
          }
        } catch {
          set({ error: 'Error al iniciar sesión', isLoading: false });
          return false;
        }
      },

      logout: () => {
        mockLogout();
        set({ user: null, error: null });
      },

      register: async (email, password, firstName, lastName, referralCode) => {
        set({ isLoading: true, error: null });
        try {
          const session = mockRegister(email, password, firstName, lastName, referralCode);
          set({ user: session.user, isLoading: false });
          return true;
        } catch {
          set({ error: 'Error al registrarse', isLoading: false });
          return false;
        }
      },

      setUser: (user) => set({ user }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'mundo-alvarado-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

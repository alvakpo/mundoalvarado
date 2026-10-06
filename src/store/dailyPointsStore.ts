'use client';

// src/store/dailyPointsStore.ts
// ============================================================
// ESTADO DE PUNTOS DIARIOS (versión demo)
// ============================================================
// Guarda los puntos en el navegador, igual que el login de mentira.
//
// OJO: esto es SÓLO para la demo. Si el saldo vive en el navegador, el
// socio puede editarlo y darse los puntos que quiera. Cuando Supabase
// esté conectado, el saldo y el reclamo pasan a vivir en el servidor:
//   - el saldo se deriva del libro de movimientos (point_ledger)
//   - el reclamo lo resuelve la función claim_daily_points()
//   - la restricción UNIQUE(app_user_id, claim_date) impide reclamar
//     dos veces el mismo día
// Este store queda sólo como caché de lo que responde el servidor.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DailyPointsState,
  emptyDailyPoints,
  claimDailyPoints,
} from '@/lib/business/dailyPoints';

interface DailyPointsStore extends DailyPointsState {
  claim: () => { awarded: number; alreadyClaimed: boolean; streak: number };
  reset: () => void;
}

export const useDailyPointsStore = create<DailyPointsStore>()(
  persist(
    (set, get) => ({
      ...emptyDailyPoints(),

      claim: () => {
        const result = claimDailyPoints(get(), new Date());
        set(result.state);
        return {
          awarded: result.awarded,
          alreadyClaimed: result.alreadyClaimed,
          streak: result.streak,
        };
      },

      reset: () => set(emptyDailyPoints()),
    }),
    {
      name: 'mundo-alvarado-puntos',
      partialize: (state) => ({
        totalPoints: state.totalPoints,
        lastClaimDate: state.lastClaimDate,
        streak: state.streak,
        claimedDates: state.claimedDates,
      }),
    }
  )
);

'use client';

import { useAuthStore } from '@/store/authStore';
import {
  buildMockMonthlyGeneralHistory,
  getMockDirectReferrals,
  PROGRAM_START_MONTH,
} from '@/lib/mock/mockData';
import {
  calculateAnnualGeneralChances,
  calculateGeneralChances,
  evaluateMonthlyCutoff,
} from '@/lib/business/chancesCalculator';
import { ChanceBreakdown } from '@/components/ChanceBreakdown';
import { getMonthName } from '@/lib/utils';
import { Trophy, TrendingUp, CalendarDays } from 'lucide-react';

// ============================================================
// SORTEO ANUAL
// ============================================================
// Acumula las chances del SORTEO GENERAL mes a mes. Es un pozo distinto
// al de Premios Grupales: acá suman todas las chances que el socio
// genera (su categoría + sus referidos al día), y allá suma la regla
// de armar red.
// ============================================================

export default function SorteoAnualPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  const now = new Date();
  const currentYear = now.getFullYear();

  // El corte del día 20 define a qué mes pertenece cada evaluación.
  const cutoff = evaluateMonthlyCutoff(now);
  const month = cutoff.effectiveMonth;
  const year = cutoff.effectiveYear;

  const directReferrals = getMockDirectReferrals(user.appUserId);

  // Las chances del mes en curso, calculadas en vivo.
  const thisMonth = calculateGeneralChances(user, directReferrals, month, year);

  // Los meses ya cerrados del año. Si el corte ya nos pasó a enero del
  // año siguiente, el año en curso se considera cerrado hasta diciembre.
  const lastClosedMonth =
    year === currentYear ? Math.min(month - 1, 12) : 12;
  const closedHistory = buildMockMonthlyGeneralHistory(
    user.appUserId,
    currentYear,
    lastClosedMonth
  );

  const accumulated = calculateAnnualGeneralChances(
    user.appUserId,
    closedHistory,
    currentYear,
    year === currentYear ? thisMonth : null
  );

  const liveMonth = accumulated.liveMonthIncluded ? month : null;

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: 'rgba(59, 111, 212, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Trophy size={20} style={{ color: 'var(--alvarado-accent)' }} />
          </div>
          <h1 className="page-title" style={{ fontSize: '1.75rem' }}>SORTEO ANUAL</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Todas las chances que generás mes a mes se acumulan para el gran sorteo de fin de año.
        </p>
      </div>

      {/* Total acumulado */}
      <div
        className="animate-fade-in stagger-1"
        style={{
          background: 'var(--gradient-primary)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '1.5rem',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.1)',
          opacity: 0,
          animationFillMode: 'forwards',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
          Chances acumuladas {currentYear}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '4.5rem',
          fontWeight: 700,
          color: 'white',
          lineHeight: 1,
        }}>
          {accumulated.totalAccumulated}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem' }}>
          {accumulated.totalAccumulated === 1 ? 'Chance para el sorteo' : 'Chances para el sorteo'}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem', marginTop: '0.875rem' }}>
          {accumulated.monthsCounted} {accumulated.monthsCounted === 1 ? 'mes computado' : 'meses computados'} desde {getMonthName(PROGRAM_START_MONTH)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

        {/* Este mes */}
        <div className="animate-fade-in stagger-2" style={{ minWidth: 0, opacity: 0, animationFillMode: 'forwards' }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <CalendarDays size={15} style={{ color: 'var(--text-muted)' }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {getMonthName(month)} {year}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.75rem',
                fontWeight: 700,
                color: 'var(--alvarado-accent)',
                lineHeight: 1,
              }}>
                +{thisMonth.totalChances}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {thisMonth.totalChances === 1 ? 'chance este mes' : 'chances este mes'}
              </span>
            </div>
          </div>

          <ChanceBreakdown
            breakdown={thisMonth.breakdown}
            total={thisMonth.totalChances}
            title={`Generadas en ${getMonthName(month)}`}
          />
        </div>

        {/* Historial mes a mes */}
        <div className="animate-fade-in stagger-3" style={{ minWidth: 0, opacity: 0, animationFillMode: 'forwards' }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <TrendingUp size={15} style={{ color: 'var(--text-muted)' }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Acumulado mes a mes
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {accumulated.monthlyHistory.map((h) => {
                const isLive = liveMonth === h.month;
                return (
                  <div
                    key={h.month}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      background: isLive ? 'rgba(59, 111, 212, 0.1)' : 'var(--bg-elevated)',
                      borderRadius: '8px',
                      border: isLive ? '1px solid rgba(59, 111, 212, 0.25)' : '1px solid transparent',
                    }}
                  >
                    <div style={{
                      fontSize: '0.875rem',
                      color: isLive ? 'var(--alvarado-accent)' : 'var(--text-secondary)',
                      fontWeight: isLive ? 600 : 400,
                    }}>
                      {getMonthName(h.month)}
                      {isLive && ' (en curso)'}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: isLive ? 'var(--alvarado-accent)' : 'var(--text-primary)',
                    }}>
                      +{h.totalChances}
                    </div>
                  </div>
                );
              })}
            </div>

            {accumulated.duplicateMonths.length > 0 && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--status-pending)', lineHeight: 1.5 }}>
                ⚠️ Se detectaron meses repetidos en el historial (se contaron una sola vez).
              </div>
            )}

            {accumulated.monthlyHistory.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Todavía no hay meses computados este año.
              </div>
            )}

            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700 }}>
                {accumulated.totalAccumulated}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explicación */}
      <div
        style={{
          marginTop: '1.5rem',
          padding: '1rem 1.25rem',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: 'var(--text-secondary)' }}>Cómo funciona:</strong> cada mes sumás
        chances por tu categoría y por tus referidos al día. Esas chances no se pierden: se van
        acumulando hasta el sorteo de fin de año. Cuantos más meses participes y más referidos
        sumes, más chances tenés.
        <div style={{ marginTop: '0.625rem' }}>
          Es un pozo distinto al de <strong style={{ color: 'var(--text-secondary)' }}>Premios Grupales</strong>,
          que premia armar red y se calcula con su propia regla.
        </div>
      </div>
    </div>
  );
}

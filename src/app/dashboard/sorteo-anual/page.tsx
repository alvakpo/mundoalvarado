'use client';

import { useState } from 'react';
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
import { Trophy, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';

// ============================================================
// SORTEO ANUAL
// ============================================================
// Acumula las chances del SORTEO GENERAL mes a mes. Es un pozo distinto
// al de Premios Grupales: acá suman todas las chances que el socio
// genera (su categoría + sus referidos al día), y allá suma la regla
// de armar red.
//
// El club confirmó que se sortean LOS DOS: cada mes hay un premio
// general y además estas chances se acumulan para el de fin de año.
//
// LAYOUT: el acumulado mes a mes es el protagonista y ocupa todo el
// ancho. El detalle de cada mes vive DENTRO de su propio mes, como
// desplegable, así el socio ve el total sin ruido y abre sólo el mes
// que le interesa. El mes en curso arranca abierto.
// ============================================================

export default function SorteoAnualPage() {
  const { user } = useAuthStore();

  const now = new Date();
  const currentYear = now.getFullYear();

  // El corte del día 20 define a qué mes pertenece cada evaluación.
  const cutoff = evaluateMonthlyCutoff(now);
  const month = cutoff.effectiveMonth;
  const year = cutoff.effectiveYear;

  // Qué mes está desplegado. Arranca abierto el mes en curso.
  //
  // Este hook va ANTES del control de sesión a propósito: los hooks no
  // pueden ser condicionales, así que no puede vivir después del
  // `if (!user) return null`.
  const [mesAbierto, setMesAbierto] = useState<number | null>(month);

  if (!user) return null;

  const directReferrals = getMockDirectReferrals(user.appUserId);

  // Las chances del mes en curso, calculadas en vivo.
  const thisMonth = calculateGeneralChances(user, directReferrals, month, year);

  // Los meses ya cerrados del año. Si el corte ya nos pasó a enero del
  // año siguiente, el año en curso se considera cerrado hasta diciembre.
  const lastClosedMonth = year === currentYear ? Math.min(month - 1, 12) : 12;
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

      {/* Acumulado mes a mes: protagonista, todo el ancho */}
      <div
        className="card animate-fade-in stagger-2"
        style={{ opacity: 0, animationFillMode: 'forwards' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <TrendingUp size={15} style={{ color: 'var(--text-muted)' }} />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Acumulado mes a mes
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {accumulated.monthlyHistory.map((h) => {
            const isLive = liveMonth === h.month;
            const abierto = mesAbierto === h.month;
            return (
              <div
                key={h.month}
                style={{
                  background: 'var(--bg-elevated)',
                  borderRadius: '10px',
                  border: `1px solid ${isLive ? 'rgba(59, 111, 212, 0.3)' : 'transparent'}`,
                  overflow: 'hidden',
                }}
              >
                {/* Cabecera del mes: clickeable para desplegar el detalle */}
                <button
                  onClick={() => setMesAbierto(abierto ? null : h.month)}
                  aria-expanded={abierto}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    font: 'inherit',
                    color: 'inherit',
                  }}
                >
                  {abierto
                    ? <ChevronDown size={17} style={{ color: 'var(--alvarado-accent)', flexShrink: 0 }} />
                    : <ChevronRight size={17} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}

                  <span style={{
                    flex: 1,
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.0625rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    color: isLive ? 'var(--alvarado-accent)' : 'var(--text-primary)',
                  }}>
                    {getMonthName(h.month)}
                    {isLive && ' (en curso)'}
                  </span>

                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: isLive ? 'var(--alvarado-accent)' : 'var(--text-primary)',
                  }}>
                    +{h.totalChances}
                  </span>
                </button>

                {/* El detalle del mes, DENTRO del mes */}
                {abierto && (
                  <div style={{
                    padding: '1rem 1rem 1.25rem',
                    background: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border-subtle)',
                  }}>
                    {isLive && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        marginBottom: '1.25rem',
                        paddingBottom: '1rem',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '3rem',
                          fontWeight: 700,
                          color: 'var(--alvarado-accent)',
                          lineHeight: 1,
                        }}>
                          +{h.totalChances}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                          {h.totalChances === 1 ? 'chance este mes' : 'chances este mes'}
                        </span>
                        <span style={{
                          marginLeft: 'auto',
                          fontSize: '0.6875rem',
                          color: '#f59e0b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontWeight: 700,
                          padding: '0.1875rem 0.5rem',
                          borderRadius: '100px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                        }}>
                          En curso
                        </span>
                      </div>
                    )}

                    <ChanceBreakdown
                      breakdown={h.breakdown}
                      total={h.totalChances}
                      title={isLive ? `Generadas en ${getMonthName(h.month)}` : `Detalle de ${getMonthName(h.month)}`}
                    />
                  </div>
                )}
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
          marginTop: '1.25rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700 }}>
            {accumulated.totalAccumulated}
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
        acumulando hasta el sorteo de fin de año.
        <div style={{ marginTop: '0.625rem' }}>
          Se sortea <strong style={{ color: 'var(--text-secondary)' }}>todos los meses</strong> por el
          premio general, y <strong style={{ color: 'var(--text-secondary)' }}>además</strong> estas
          mismas chances se acumulan para el sorteo de fin de año. Es un pozo distinto al de{' '}
          <strong style={{ color: 'var(--text-secondary)' }}>Premios Grupales</strong>, que premia armar red.
        </div>
      </div>
    </div>
  );
}

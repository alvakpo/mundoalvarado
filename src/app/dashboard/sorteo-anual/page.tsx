'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { Ticket, Trophy, TrendingUp, ChevronDown, ChevronRight, Info } from 'lucide-react';

export default function SorteoAnualPage() {
  const { user } = useAuthStore();

  const now = new Date();
  const currentYear = now.getFullYear();

  const cutoff = evaluateMonthlyCutoff(now);
  const month = cutoff.effectiveMonth;
  const year = cutoff.effectiveYear;

  const [mesAbierto, setMesAbierto] = useState<number | null>(month);

  if (!user) return null;

  const directReferrals = getMockDirectReferrals(user.appUserId);
  const thisMonth = calculateGeneralChances(user, directReferrals, month, year);

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
    <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>

      {/* Switcher de Sorteos (Mensual / Anual) */}
      <div style={{
        display: 'inline-flex',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '3px',
        marginBottom: '1.75rem',
      }}>
        <Link
          href="/dashboard/sorteo-mensual"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '9px',
            textDecoration: 'none',
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: 'var(--text-muted)',
            transition: 'color var(--transition-fast)',
          }}
        >
          <Ticket size={15} />
          Sorteo Mensual
        </Link>
        <Link
          href="/dashboard/sorteo-anual"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '9px',
            textDecoration: 'none',
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: '#ffffff',
            background: 'var(--alvarado-accent)',
            boxShadow: '0 2px 10px rgba(59, 111, 212, 0.35)',
          }}
        >
          <Trophy size={15} />
          Sorteo Anual
        </Link>
      </div>

      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            background: 'rgba(59, 111, 212, 0.15)',
            border: '1px solid rgba(59, 111, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Trophy size={22} style={{ color: 'var(--alvarado-accent)' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--alvarado-accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
              Gran Premio Anual · {currentYear}
            </div>
            <h1 className="page-title" style={{ fontSize: '1.85rem' }}>SORTEO ANUAL</h1>
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Todas las chances que generás mes a mes se acumulan para el gran sorteo de fin de año.
        </p>
      </div>

      {/* Total acumulado hero integrado al fondo */}
      <div
        className="animate-fade-in stagger-1"
        style={{
          position: 'relative',
          padding: '2.5rem 1.5rem',
          marginBottom: '2.5rem',
          textAlign: 'center',
          background: 'radial-gradient(ellipse at center, rgba(59, 111, 212, 0.15) 0%, rgba(15, 32, 68, 0.05) 55%, transparent 75%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 600, marginBottom: '0.75rem' }}>
          Chances acumuladas {currentYear}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '6.5rem',
          fontWeight: 800,
          color: '#ffffff',
          lineHeight: 0.9,
          letterSpacing: '-0.02em',
          textShadow: '0 0 45px rgba(59, 111, 212, 0.5), 0 0 10px rgba(255,255,255,0.2)',
          marginBottom: '0.625rem',
        }}>
          {accumulated.totalAccumulated}
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(59, 111, 212, 0.12)',
          border: '1px solid rgba(59, 111, 212, 0.3)',
          padding: '0.35rem 1rem',
          borderRadius: '100px',
          color: '#93c5fd',
          fontSize: '0.875rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          <Trophy size={14} />
          {accumulated.totalAccumulated === 1 ? '1 CHANCE ACUMULADA' : `${accumulated.totalAccumulated} CHANCES ACUMULADAS`}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.875rem' }}>
          {accumulated.monthsCounted} {accumulated.monthsCounted === 1 ? 'mes computado' : 'meses computados'} desde {getMonthName(PROGRAM_START_MONTH)}
        </div>
      </div>

      {/* Acumulado mes a mes: Abierto y fluido */}
      <div
        className="animate-fade-in stagger-2"
        style={{ marginBottom: '2.5rem' }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{
            height: 1,
            flex: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1))',
          }} />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '0 0.5rem',
          }}>
            <TrendingUp size={14} style={{ color: 'var(--alvarado-accent)' }} />
            Acumulado mes a mes
          </div>
          <div style={{
            height: 1,
            flex: 1,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)',
          }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {accumulated.monthlyHistory.map((h) => {
            const isLive = liveMonth === h.month;
            const abierto = mesAbierto === h.month;
            return (
              <div
                key={h.month}
                style={{
                  background: isLive ? 'rgba(59, 111, 212, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '14px',
                  border: `1px solid ${isLive ? 'rgba(59, 111, 212, 0.35)' : 'rgba(255, 255, 255, 0.06)'}`,
                  overflow: 'hidden',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {/* Cabecera del mes */}
                <button
                  onClick={() => setMesAbierto(abierto ? null : h.month)}
                  aria-expanded={abierto}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.25rem',
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
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    color: isLive ? 'var(--alvarado-accent)' : 'var(--text-primary)',
                  }}>
                    +{h.totalChances}
                  </span>
                </button>

                {/* El detalle del mes */}
                {abierto && (
                  <div style={{
                    padding: '1.25rem 1.25rem 1.5rem',
                    background: 'rgba(15, 22, 33, 0.6)',
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
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
            Total Acumulado
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--alvarado-accent)' }}>
            {accumulated.totalAccumulated}
          </div>
        </div>
      </div>

      {/* Explicación en cápsula sutil */}
      <div
        className="animate-fade-in stagger-3"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          padding: '1.25rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}
      >
        <Info size={18} style={{ color: 'var(--alvarado-accent)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-secondary)' }}>Cómo funciona:</strong> cada mes sumás
          chances por tu categoría y por tus referidos al día. Esas chances no se pierden: se van
          acumulando hasta el gran sorteo de fin de año.
          <div style={{ marginTop: '0.5rem' }}>
            Participás <strong style={{ color: 'var(--text-secondary)' }}>todos los meses</strong> por el
            premio mensual, y <strong style={{ color: 'var(--text-secondary)' }}>además</strong> todas tus
            chances se suman para el sorteo anual.
          </div>
        </div>
      </div>
    </div>
  );
}

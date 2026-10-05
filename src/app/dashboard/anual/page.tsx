'use client';

import { useAuthStore } from '@/store/authStore';
import {
  getMockDirectReferrals,
  getMockSecondLevelReferrals,
  MOCK_ANNUAL_HISTORY,
} from '@/lib/mock/mockData';
import {
  calculateAnnualMonthlyChances,
  calculateAnnualAccumulatedChances,
} from '@/lib/business/chancesCalculator';
import { ChanceBreakdown } from '@/components/ChanceBreakdown';
import { ReferralNode } from '@/components/ReferralNode';
import { MemberAvatar } from '@/components/MemberAvatar';
import { getMonthName } from '@/lib/utils';
import { Trophy, TrendingUp } from 'lucide-react';

export default function AnualPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const directReferrals = getMockDirectReferrals(user.appUserId);
  const secondLevelMap = getMockSecondLevelReferrals(user.appUserId);

  const thisMonthResult = calculateAnnualMonthlyChances(
    user,
    directReferrals,
    secondLevelMap,
    month,
    year
  );

  const accumulatedResult = calculateAnnualAccumulatedChances(
    user.appUserId,
    MOCK_ANNUAL_HISTORY,
    year
  );

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Trophy size={20} style={{ color: '#f59e0b' }} />
          </div>
          <h1 className="page-title" style={{ fontSize: '1.75rem' }}>PREMIO ANUAL</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Las chances se acumulan mes a mes hasta el sorteo de fin de año.
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>

        {/* Este mes */}
        <div
          className="card animate-fade-in stagger-1"
          style={{
            opacity: 0,
            animationFillMode: 'forwards',
            background: 'var(--gradient-card)',
            border: '1px solid var(--border-medium)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            {getMonthName(month)} {year}
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3.5rem',
            fontWeight: 700,
            color: thisMonthResult.chancesThisMonth > 0 ? '#f59e0b' : 'var(--text-muted)',
            lineHeight: 1,
            marginBottom: '0.25rem',
          }}>
            {thisMonthResult.chancesThisMonth}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {thisMonthResult.chancesThisMonth === 1 ? 'Chance' : 'Chances'} generadas
          </div>
        </div>

        {/* Acumuladas */}
        <div
          className="animate-fade-in stagger-2"
          style={{
            opacity: 0,
            animationFillMode: 'forwards',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <TrendingUp size={16} style={{ color: '#f59e0b' }} />
            <div style={{ fontSize: '0.75rem', color: 'rgba(245, 158, 11, 0.8)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Acumuladas {year}
            </div>
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3.5rem',
            fontWeight: 700,
            color: '#f59e0b',
            lineHeight: 1,
            marginBottom: '0.25rem',
          }}>
            {accumulatedResult.totalAccumulated + thisMonthResult.chancesThisMonth}
          </div>
          <div style={{ color: 'rgba(245, 158, 11, 0.7)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Chances totales
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Desglose este mes */}
        <div className="animate-fade-in stagger-3" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          <ChanceBreakdown
            breakdown={thisMonthResult.breakdown}
            total={thisMonthResult.chancesThisMonth}
            title={`Generadas en ${getMonthName(month)}`}
          />
        </div>

        {/* Historial mensual */}
        <div className="animate-fade-in stagger-4" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Historial mensual
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {accumulatedResult.monthlyHistory.map((h) => (
                <div
                  key={h.month}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-elevated)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {getMonthName(h.month)}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: h.chancesThisMonth > 0 ? '#f59e0b' : 'var(--text-muted)',
                  }}>
                    +{h.chancesThisMonth}
                  </div>
                </div>
              ))}

              {/* Mes actual */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <div style={{ fontSize: '0.875rem', color: '#f59e0b', fontWeight: 600 }}>
                  {getMonthName(month)} (actual)
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: '#f59e0b',
                }}>
                  +{thisMonthResult.chancesThisMonth}
                </div>
              </div>
            </div>

            {accumulatedResult.monthlyHistory.length === 0 && thisMonthResult.chancesThisMonth === 0 && (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Aún no acumulaste chances anuales.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mapa de 2 niveles */}
      <div
        className="card animate-fade-in stagger-5"
        style={{ marginTop: '1.5rem', opacity: 0, animationFillMode: 'forwards' }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
          Tu red (2 niveles)
        </div>

        {/* Nivel raíz - Tú */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem' }}>
            <MemberAvatar member={user} size="lg" showStatus />
            <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Vos</div>
          </div>

          {/* Nivel 1 */}
          {directReferrals.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', borderTop: '2px solid var(--border-medium)', paddingTop: '1rem', width: '100%' }}>
              {directReferrals.map((ref, i) => {
                const secondLevel = secondLevelMap.get(ref.appUserId) ?? [];
                return (
                  <div key={ref.appUserId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <ReferralNode member={ref} level={1} animationDelay={i * 100} />

                    {/* Nivel 2 */}
                    {secondLevel.length > 0 && (
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '0.75rem',
                      }}>
                        {secondLevel.map((ref2, j) => (
                          <ReferralNode key={ref2.appUserId} member={ref2} level={2} animationDelay={(i * secondLevel.length + j) * 80 + 200} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {directReferrals.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <a href="/dashboard/invitar" style={{ color: 'var(--alvarado-accent)', textDecoration: 'none' }}>
                Invitá amigos para construir tu red →
              </a>
            </div>
          )}
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
        <strong style={{ color: 'var(--text-secondary)' }}>Cómo funciona:</strong> Cada mes se evalúa tu red al día 20 a las 23:59.
        Si tenés al menos 2 referidos directos al día: +1 chance. Por cada referido directo que tenga 2+ referidos propios al día: +1 chance extra. Estas chances se acumulan hasta el sorteo anual.
      </div>
    </div>
  );
}

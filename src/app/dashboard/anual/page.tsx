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
  evaluateMonthlyCutoff,
} from '@/lib/business/chancesCalculator';
import { ChanceBreakdown } from '@/components/ChanceBreakdown';
import { ReferralTree, ReferralTreeNode } from '@/components/ReferralTree';
import {
  SecondLevelSummary,
  toSecondLevelSummaries,
} from '@/lib/business/privacy';
import { getMonthName } from '@/lib/utils';
import { Trophy, TrendingUp } from 'lucide-react';

export default function AnualPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  const now = new Date();

  // El corte del día 20 a las 23:59 define a qué mes pertenece cada
  // evaluación: "la información del día 21 en adelante se considera
  // para el mes siguiente".
  const cutoff = evaluateMonthlyCutoff(now);
  const month = cutoff.effectiveMonth;
  const year = cutoff.effectiveYear;

  const directReferrals = getMockDirectReferrals(user.appUserId);

  // El segundo nivel se reduce a lo mínimo público ANTES de tocar la
  // pantalla o el cálculo: nombre de pila y estado, nada más.
  //
  // Es el espejo en el cliente de la función my_second_level() de
  // Supabase. Gracias a esto, el apellido, la foto, la categoría, el
  // número de socio y el celular de alguien que no es tu referido no
  // tienen por dónde llegar al navegador.
  const rawSecondLevel = getMockSecondLevelReferrals(user.appUserId);
  const secondLevelByParent = new Map<string, SecondLevelSummary[]>();
  for (const [parentId, members] of rawSecondLevel) {
    secondLevelByParent.set(parentId, toSecondLevelSummaries(members));
  }

  const thisMonthResult = calculateAnnualMonthlyChances(
    user,
    directReferrals,
    secondLevelByParent,
    month,
    year
  );

  // El pozo del sorteo anual se acumula para el año en curso, con una
  // sola entrada por mes. El mes en curso entra como provisorio sólo si
  // todavía no está congelado en el historial, y sólo si pertenece a
  // este año: en diciembre, después del corte, el mes en curso ya es
  // enero del año siguiente y no debe entrar en este pozo.
  const currentYear = now.getFullYear();
  const accumulatedResult = calculateAnnualAccumulatedChances(
    user.appUserId,
    MOCK_ANNUAL_HISTORY,
    currentYear,
    year === currentYear ? thisMonthResult : null
  );

  const liveMonth = accumulatedResult.liveMonthIncluded ? month : null;

  // Para cada referido directo: se cuelga su red propia (2º nivel) y se
  // marca si genera el +1 del sorteo anual, que es lo que la pantalla no
  // dejaba ver: con la fila plana, Juan y Laura se veían iguales aunque
  // sólo Juan aporta una chance.
  const treeNodes: ReferralTreeNode[] = directReferrals.map((ref) => {
    const secondLevel = secondLevelByParent.get(ref.appUserId) ?? [];
    const activeSecondLevel = secondLevel.filter((r) => r.status === 'al_dia').length;

    let badge: ReferralTreeNode['badge'];
    if (ref.status !== 'al_dia') {
      // El referido mismo no está al día: no aporta.
      badge = { label: 'no suma', variant: 'muted' };
    } else if (secondLevel.length === 0) {
      badge = { label: 'sin red', variant: 'muted' };
    } else if (activeSecondLevel >= 2) {
      badge = { label: '+1', variant: 'positive' };
    } else {
      // Tiene red, pero no llega a 2 activos.
      badge = { label: 'no suma', variant: 'muted' };
    }

    return {
      member: ref,
      badge,
      children: secondLevel,
    };
  });

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

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
            {accumulatedResult.totalAccumulated}
          </div>
          <div style={{ color: 'rgba(245, 158, 11, 0.7)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Chances totales
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            {accumulatedResult.monthsCounted} de 12 meses computados
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

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
              {accumulatedResult.monthlyHistory.map((h) => {
                const isLive = liveMonth === h.month;
                return (
                  <div
                    key={h.month}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      background: isLive ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-elevated)',
                      borderRadius: '8px',
                      border: isLive ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid transparent',
                    }}
                  >
                    <div style={{
                      fontSize: '0.875rem',
                      color: isLive ? '#f59e0b' : 'var(--text-secondary)',
                      fontWeight: isLive ? 600 : 400,
                    }}>
                      {getMonthName(h.month)}
                      {isLive && ' (en curso)'}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: isLive || h.chancesThisMonth > 0 ? '#f59e0b' : 'var(--text-muted)',
                    }}>
                      +{h.chancesThisMonth}
                    </div>
                  </div>
                );
              })}
            </div>

            {accumulatedResult.duplicateMonths.length > 0 && (
              <div style={{
                marginTop: '0.75rem',
                fontSize: '0.75rem',
                color: 'var(--status-pending)',
                lineHeight: 1.5,
              }}>
                ⚠️ Se detectaron meses repetidos en el historial (se contaron una sola vez).
              </div>
            )}

            {accumulatedResult.monthlyHistory.length === 0 && (
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
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Tu red (2 niveles)
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          Los referidos marcados <strong style={{ color: 'var(--status-active)' }}>+1</strong> te suman
          una chance al sorteo anual, porque tienen 2 o más referidos propios al día.
        </div>

        <ReferralTree
          owner={user}
          nodes={treeNodes}
          emptyMessage={
            <a href="/dashboard/invitar" style={{ color: 'var(--alvarado-accent)', textDecoration: 'none' }}>
              Invitá amigos para construir tu red →
            </a>
          }
        />

        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}>
          🔒 De tu red indirecta sólo se muestra el nombre de pila y el estado. Son socios que
          no invitaste vos, así que su apellido, su número de socio y su contacto quedan
          reservados.
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

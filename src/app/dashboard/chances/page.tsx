'use client';

import { useAuthStore } from '@/store/authStore';
import { getMockDirectReferrals } from '@/lib/mock/mockData';
import { calculateGeneralChances } from '@/lib/business/chancesCalculator';
import { ChanceBreakdown } from '@/components/ChanceBreakdown';
import { ReferralTree, ReferralTreeNode } from '@/components/ReferralTree';
import { getMonthName } from '@/lib/utils';
import { Ticket } from 'lucide-react';

export default function ChancesPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const directReferrals = getMockDirectReferrals(user.appUserId);
  const chancesResult = calculateGeneralChances(user, directReferrals, month, year);

  // Sólo se muestran referidos DIRECTOS (nunca el segundo nivel acá),
  // y cada uno indica si aporta su chance al sorteo del mes.
  const treeNodes: ReferralTreeNode[] = directReferrals.map((ref) => ({
    member: ref,
    badge:
      ref.status === 'al_dia'
        ? { label: '+1', variant: 'positive' as const }
        : { label: 'no suma', variant: 'muted' as const },
  }));

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
          }}>
            <Ticket size={20} style={{ color: 'var(--alvarado-accent)' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {getMonthName(month)} {year}
            </div>
            <h1 className="page-title" style={{ fontSize: '1.75rem' }}>PREMIO GENERAL</h1>
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Tus chances para el sorteo del mes.
        </p>
      </div>

      {/* Tarjeta total de chances */}
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
          Total de chances
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '5rem',
          fontWeight: 700,
          color: 'white',
          lineHeight: 1,
          marginBottom: '0.5rem',
        }}>
          {chancesResult.totalChances}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {chancesResult.totalChances === 1 ? 'CHANCE' : 'CHANCES'}
        </div>

        {user.status !== 'al_dia' && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.15)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ef4444',
            fontSize: '0.875rem',
          }}>
            Tu cuota no está al día. Regularizá para participar.
          </div>
        )}
      </div>

      {/* Mapa de referidos directos: es el protagonista de la pantalla,
          así que va al centro y a todo el ancho. El desglose numérico
          queda abajo, disponible pero sin competir por la atención. */}
      <div
        className="animate-fade-in stagger-2"
        style={{ opacity: 0, animationFillMode: 'forwards', marginBottom: '1.5rem' }}
      >
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '1.75rem 1.25rem 2.25rem',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '1.75rem',
            textAlign: 'center',
          }}>
            Tu red directa
          </div>

          {/* Árbol de referidos */}
          <ReferralTree
            owner={user}
            ownerCaption={`${chancesResult.baseChances} por tu categoría`}
            nodes={treeNodes}
            emptyMessage={
              <>
                Aún no tenés referidos.<br />
                <a href="/dashboard/invitar" style={{ color: 'var(--alvarado-accent)', textDecoration: 'none' }}>
                  Invitá a un amigo →
                </a>
              </>
            }
          />
        </div>
      </div>

      {/* Desglose */}
      <div className="animate-fade-in stagger-3" style={{ opacity: 0, animationFillMode: 'forwards' }}>
        <ChanceBreakdown
          breakdown={chancesResult.breakdown}
          total={chancesResult.totalChances}
          title="Desglose de chances"
        />
      </div>

      {/* Info adicional */}
      <div
        className="animate-fade-in stagger-4"
        style={{
          marginTop: '1.5rem',
          padding: '1rem 1.25rem',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          opacity: 0,
          animationFillMode: 'forwards',
        }}
      >
        <strong style={{ color: 'var(--text-secondary)' }}>Corte mensual:</strong> Las chances se evalúan al día 20 de cada mes a las 23:59.
        La información posterior se considera para el mes siguiente.
      </div>
    </div>
  );
}

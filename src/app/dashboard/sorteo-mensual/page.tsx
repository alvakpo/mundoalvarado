'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getMockDirectReferrals } from '@/lib/mock/mockData';
import { calculateGeneralChances } from '@/lib/business/chancesCalculator';
import { ChanceBreakdown } from '@/components/ChanceBreakdown';
import { ReferralTree, ReferralTreeNode } from '@/components/ReferralTree';
import { getMonthName } from '@/lib/utils';
import { Ticket, Trophy, ChevronDown, ChevronRight, Info } from 'lucide-react';

export default function ChancesPage() {
  const { user } = useAuthStore();
  const [verDesglose, setVerDesglose] = useState(false);

  if (!user) return null;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const directReferrals = getMockDirectReferrals(user.appUserId);
  const chancesResult = calculateGeneralChances(user, directReferrals, month, year);

  const treeNodes: ReferralTreeNode[] = directReferrals.map((ref) => ({
    member: ref,
    badge:
      ref.status === 'al_dia'
        ? { label: '+1', variant: 'positive' as const }
        : { label: 'no suma', variant: 'muted' as const },
  }));

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
            fontWeight: 700,
            color: '#ffffff',
            background: 'var(--alvarado-accent)',
            boxShadow: '0 2px 10px rgba(59, 111, 212, 0.35)',
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
            fontWeight: 500,
            color: 'var(--text-muted)',
            transition: 'color var(--transition-fast)',
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
          }}>
            <Ticket size={22} style={{ color: 'var(--alvarado-accent)' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--alvarado-accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
              Premio general · {getMonthName(month)} {year}
            </div>
            <h1 className="page-title" style={{ fontSize: '1.85rem' }}>SORTEO MENSUAL</h1>
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Tus chances para participar del sorteo de este mes.
        </p>
      </div>

      {/* Hero: Total de chances integrado directamente al fondo con resplandor */}
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
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          fontWeight: 600,
          marginBottom: '0.75rem',
        }}>
          Total de chances activas
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
          {chancesResult.totalChances}
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
          <Ticket size={14} />
          {chancesResult.totalChances === 1 ? '1 CHANCE EN JUEGO' : `${chancesResult.totalChances} CHANCES EN JUEGO`}
        </div>

        {user.status !== 'al_dia' && (
          <div style={{
            marginTop: '1.25rem',
            display: 'inline-block',
            padding: '0.625rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.12)',
            borderRadius: '10px',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ef4444',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}>
            Tu cuota no está al día. Regularizá para validar tus chances en el sorteo.
          </div>
        )}
      </div>

      {/* Mapa de referidos directos: Abierto, integrado al fondo */}
      <div
        className="animate-fade-in stagger-2"
        style={{ marginBottom: '2.5rem' }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '2rem',
        }}>
          <div style={{
            height: 1,
            flex: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1))',
          }} />
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '0 0.5rem',
          }}>
            Tu Red Directa
          </div>
          <div style={{
            height: 1,
            flex: 1,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)',
          }} />
        </div>

        {/* Árbol de referidos */}
        <ReferralTree
          owner={user}
          ownerCaption={`${chancesResult.baseChances} por tu categoría`}
          nodes={treeNodes}
          emptyMessage={
            <div style={{ padding: '2rem 1rem' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Aún no tenés referidos sumados a tu red.
              </p>
              <Link
                href="/dashboard/invitar"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '10px',
                  background: 'rgba(59, 111, 212, 0.15)',
                  border: '1px solid var(--alvarado-accent)',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Invitá a un amigo y sumá chances →
              </Link>
            </div>
          }
        />
      </div>

      {/* Desglose: cápsula interactiva sutil */}
      <div className="animate-fade-in stagger-3" style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => setVerDesglose((v) => !v)}
          aria-expanded={verDesglose}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            textAlign: 'left',
            font: 'inherit',
            color: 'inherit',
            transition: 'background var(--transition-fast), border-color var(--transition-fast)',
          }}
        >
          {verDesglose
            ? <ChevronDown size={18} style={{ color: 'var(--alvarado-accent)', flexShrink: 0 }} />
            : <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
          <span style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            Ver desglose detallado de chances
          </span>
          <span style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--alvarado-accent)',
          }}>
            {chancesResult.totalChances}
          </span>
        </button>

        {verDesglose && (
          <div style={{ marginTop: '0.75rem' }}>
            <ChanceBreakdown
              breakdown={chancesResult.breakdown}
              total={chancesResult.totalChances}
              title={`Cómo se arman tus ${chancesResult.totalChances} chances`}
            />
          </div>
        )}
      </div>

      {/* Info adicional: cápsula sutil */}
      <div
        className="animate-fade-in stagger-4"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}
      >
        <Info size={16} style={{ color: 'var(--alvarado-accent)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-secondary)' }}>Corte mensual:</strong> Las chances se evalúan al día 20 de cada mes a las 23:59.
          Los nuevos referidos o pagos registrados luego de esa fecha se computan para el sorteo del mes siguiente.
        </div>
      </div>
    </div>
  );
}

'use client';

// src/components/ReferralTree.tsx
// ============================================================
// ÁRBOL DE REFERIDOS DIRECTOS
// ============================================================
// Dibuja el mapa de la red con conectores reales:
//
//              VOS
//               │
//     ┌─────────┴─────────┐
//     │         │         │
//   Juan      Laura     Sofía
//
// Cada columna son hermanos de un mismo padre, y el riel horizontal se
// corta a la mitad en los extremos: así el árbol no se puede confundir
// con una jerarquía que no existe.
//
// Sólo primer nivel. Los referidos directos son personas que el socio
// invitó él mismo, así que ve su ficha completa al tocarlas.
// ============================================================

import type { ReactNode } from 'react';
import { EnrichedMember } from '@/types';
import { MemberAvatar } from './MemberAvatar';
import { ReferralNode } from './ReferralNode';

const LINE = 'var(--border-medium)';

export interface ReferralTreeBadge {
  label: string;
  variant: 'positive' | 'muted';
}

export interface ReferralTreeNode {
  member: EnrichedMember;
  badge?: ReferralTreeBadge;
}

interface ReferralTreeProps {
  owner: EnrichedMember;
  ownerCaption?: string;
  nodes: ReferralTreeNode[];
  emptyMessage?: ReactNode;
}

/**
 * Riel horizontal que une a los hermanos.
 * En el primer y último hermano se corta al medio, para que la línea
 * nazca y muera en un avatar y no en la nada.
 */
function SiblingRail({ count, index }: { count: number; index: number }) {
  const onlyChild = count === 1;
  return (
    <div style={{ position: 'relative', width: '100%', height: 14 }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          height: 2,
          background: LINE,
          left: onlyChild || index === 0 ? '50%' : 0,
          right: onlyChild || index === count - 1 ? '50%' : 0,
        }}
      />
    </div>
  );
}

function Badge({ badge }: { badge: ReferralTreeBadge }) {
  const positive = badge.variant === 'positive';
  return (
    <div
      style={{
        marginTop: '0.375rem',
        padding: '0.125rem 0.5rem',
        borderRadius: '100px',
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        color: positive ? 'var(--status-active)' : 'var(--text-muted)',
        background: positive ? 'var(--status-active-bg)' : 'var(--bg-elevated)',
        border: `1px solid ${positive ? 'rgba(34, 197, 94, 0.25)' : 'var(--border-subtle)'}`,
      }}
    >
      {badge.label}
    </div>
  );
}

export function ReferralTree({
  owner,
  ownerCaption,
  nodes,
  emptyMessage,
}: ReferralTreeProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', minWidth: 0 }}>

      {/* Raíz */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
        <MemberAvatar member={owner} size="lg" showStatus />
        <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Vos</div>
        {ownerCaption && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ownerCaption}</div>
        )}
      </div>

      {nodes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {emptyMessage}
        </div>
      ) : (
        <>
          {/* Bajada desde la raíz hasta el riel */}
          <div style={{ width: 2, height: 14, background: LINE }} />

          {/* Los hermanos nunca hacen wrap, para que uno no parezca hijo
              del de al lado. Si no entran, la fila se desliza. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              width: '100%',
              overflowX: 'auto',
              paddingBottom: 4,
            }}
          >
            {nodes.map((node, i) => (
              <div
                key={node.member.appUserId}
                style={{
                  flex: '1 1 0',
                  // 68px alcanza para el avatar (48) + el estado más
                  // largo ("Con deuda"), así entran 5 hermanos.
                  minWidth: 68,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <SiblingRail count={nodes.length} index={i} />
                <div style={{ width: 2, height: 12, background: LINE }} />
                <ReferralNode member={node.member} animationDelay={i * 90} />
                {node.badge && <Badge badge={node.badge} />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

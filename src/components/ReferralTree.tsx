'use client';

// src/components/ReferralTree.tsx
// ============================================================
// ÁRBOL DE REFERIDOS
// ============================================================
// Dibuja el mapa de la red con conectores reales:
//
//              VOS
//               │
//     ┌─────────┴─────────┐
//     │         │         │
//   Juan      Laura     Sofía
//     │
//   ┌─┴─┐
//   │   │
//  Pedro Martín
//
// Cada columna son hermanos de un mismo padre, y el riel horizontal
// se corta a la mitad en los extremos: así el árbol no se puede
// confundir con una jerarquía que no existe.
//
// PRIVACIDAD: el primer y el segundo nivel NO usan el mismo nodo.
//   - ReferralNode (nivel 1): ficha completa, con modal. Son personas
//     que el socio invitó él mismo.
//   - SecondLevelNode (nivel 2): sólo inicial, nombre de pila y estado,
//     y no es clickeable. Son personas que no invitaste y no te conocen.
// El tipo SecondLevelSummary no tiene apellido, foto, categoría,
// número de socio, celular ni identificadores: no hay forma de que se
// filtren por descuido, porque el dato no llega hasta acá.
// ============================================================

import type { ReactNode } from 'react';
import { EnrichedMember } from '@/types';
import { SecondLevelSummary } from '@/lib/business/privacy';
import { MemberAvatar } from './MemberAvatar';
import { ReferralNode } from './ReferralNode';

const LINE_STRONG = 'var(--border-medium)';
const LINE_SOFT = 'var(--border-subtle)';

export interface ReferralTreeBadge {
  label: string;
  variant: 'positive' | 'muted';
}

export interface ReferralTreeNode {
  member: EnrichedMember;
  badge?: ReferralTreeBadge;
  /** Sólo para el mapa de 2 niveles, y ya reducido al mínimo público. */
  children?: SecondLevelSummary[];
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
function SiblingRail({
  count,
  index,
  color,
  height,
}: {
  count: number;
  index: number;
  color: string;
  height: number;
}) {
  const onlyChild = count === 1;
  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          height: 2,
          background: color,
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

/**
 * Nodo del SEGUNDO nivel: lo mínimo que se puede mostrar de alguien que
 * no es tu referido. Sin apellido, sin foto, sin categoría, sin número
 * de socio, sin celular — y sin modal, porque no hay nada más que abrir.
 */
function SecondLevelNode({
  child,
  animationDelay,
}: {
  child: SecondLevelSummary;
  animationDelay: number;
}) {
  const isActive = child.status === 'al_dia';
  return (
    <div
      className="animate-scale-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.5rem',
        animationDelay: `${animationDelay}ms`,
        opacity: 0,
        animationFillMode: 'forwards',
      }}
    >
      {/* Sólo la inicial del nombre: con "PS" ya se filtraría el apellido */}
      <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.75rem' }}>
        {child.firstName.charAt(0).toUpperCase()}
      </div>
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          maxWidth: 58,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {child.firstName}
      </div>
      <div
        style={{
          fontSize: '0.6875rem',
          whiteSpace: 'nowrap',
          color: isActive ? 'var(--status-active)' : 'var(--status-inactive)',
        }}
      >
        {isActive ? 'Al día' : 'Con deuda'}
      </div>
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
          <div style={{ width: 2, height: 14, background: LINE_STRONG }} />

          {/* Nivel 1: nunca hace wrap, para que un hermano no parezca hijo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              width: '100%',
              overflowX: 'auto',
              paddingBottom: 4,
            }}
          >
            {nodes.map((node, i) => {
              const kids = node.children ?? [];
              return (
                <div
                  key={node.member.appUserId}
                  style={{
                    flex: '1 1 0',
                    // Un padre con varios hijos necesita ancho para sostenerlos.
                    // 68px alcanza para el avatar (48) + el estado más largo
                    // ("Con deuda"), así entran 5 hermanos en media tarjeta.
                    minWidth: kids.length > 1 ? 168 : 68,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <SiblingRail count={nodes.length} index={i} color={LINE_STRONG} height={14} />
                  <div style={{ width: 2, height: 12, background: LINE_STRONG }} />

                  <ReferralNode member={node.member} animationDelay={i * 90} />
                  {node.badge && <Badge badge={node.badge} />}

                  {/* Nivel 2: cuelga sólo de su padre */}
                  {kids.length > 0 && (
                    <>
                      <div style={{ width: 2, height: 14, background: LINE_SOFT, marginTop: '0.625rem' }} />
                      <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                        {kids.map((kid, j) => (
                          <div
                            key={`${kid.firstName}-${j}`}
                            style={{
                              flex: '1 1 0',
                              minWidth: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                            }}
                          >
                            <SiblingRail count={kids.length} index={j} color={LINE_SOFT} height={10} />
                            <div style={{ width: 2, height: 8, background: LINE_SOFT }} />
                            <SecondLevelNode
                              child={kid}
                              animationDelay={(i * kids.length + j) * 60 + 250}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

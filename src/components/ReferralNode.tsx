'use client';

import { useState } from 'react';
import { EnrichedMember } from '@/types';
import { MemberAvatar } from './MemberAvatar';
import { MemberCardModal } from './MemberCardModal';
import { cn } from '@/lib/utils';

interface ReferralNodeProps {
  member: EnrichedMember;
  isActive?: boolean;
  level?: 1 | 2;
  animationDelay?: number;
}

export function ReferralNode({ member, level = 1, animationDelay = 0 }: ReferralNodeProps) {
  const [showModal, setShowModal] = useState(false);
  const isActive = member.status === 'al_dia';

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="animate-scale-in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.5rem',
          borderRadius: '12px',
          transition: 'all var(--transition-base)',
          animationDelay: `${animationDelay}ms`,
          opacity: 0,
          animationFillMode: 'forwards',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-elevated)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'none';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <MemberAvatar
          member={member}
          size={level === 1 ? 'md' : 'sm'}
          showStatus
        />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: level === 1 ? '0.8125rem' : '0.75rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            maxWidth: level === 1 ? 80 : 58,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {member.firstName}
          </div>
          <div style={{
            fontSize: '0.6875rem',
            color: isActive ? 'var(--status-active)' : 'var(--status-inactive)',
            marginTop: '2px',
            whiteSpace: 'nowrap',
          }}>
            {/* Sin el glifo: el avatar ya trae el punto de estado, y así
                cada nodo es ~12px más angosto y entran 5 hermanos por fila */}
            {isActive ? 'Al día' : 'Con deuda'}
          </div>
        </div>
      </button>

      {showModal && (
        <MemberCardModal
          member={member}
          onClose={() => setShowModal(false)}
          isFirstLevel={level === 1}
        />
      )}
    </>
  );
}

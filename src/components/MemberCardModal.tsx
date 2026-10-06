'use client';

import { EnrichedMember, MEMBER_CATEGORY_LABELS } from '@/types';
import { MemberAvatar } from './MemberAvatar';
import { MemberStatusBadge } from './MemberStatusBadge';
import { X, Phone, Hash, Users } from 'lucide-react';

interface MemberCardModalProps {
  member: EnrichedMember;
  referralCount?: number;
  onClose: () => void;
}

/**
 * Ficha de un REFERIDO DIRECTO.
 *
 * Este modal existe SÓLO para el primer nivel: son personas que el socio
 * invitó él mismo, así que ve la ficha completa (incluido el celular).
 *
 * El segundo nivel no tiene modal a propósito. De esa gente sólo se
 * conoce el nombre de pila y el estado, y ya están a la vista en el mapa:
 * no hay nada más que abrir. Antes sí lo tenía, y filtraba apellido y
 * número de socio.
 */
export function MemberCardModal({ member, referralCount, onClose }: MemberCardModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <MemberAvatar member={member} size="lg" showStatus />
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, textTransform: 'uppercase' }}>
                {member.firstName} {member.lastName}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {MEMBER_CATEGORY_LABELS[member.category]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.5rem', borderRadius: '8px' }}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Estado */}
        <div className="mb-4">
          <MemberStatusBadge status={member.status} />
        </div>

        {/* Datos */}
        <div className="divider" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {member.memberNumber && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Hash size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Número de socio</div>
                <div style={{ fontWeight: 600 }}>#{member.memberNumber}</div>
              </div>
            </div>
          )}

          {member.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Celular</div>
                <div style={{ fontWeight: 600 }}>{member.phone}</div>
              </div>
            </div>
          )}

          {referralCount !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Red generada</div>
                <div style={{ fontWeight: 600 }}>{referralCount} referido{referralCount !== 1 ? 's' : ''}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="divider" />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Referido por vos
        </p>
      </div>
    </div>
  );
}

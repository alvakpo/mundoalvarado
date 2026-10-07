'use client';

import { useState } from 'react';
import { EnrichedMember, MEMBER_CATEGORY_LABELS } from '@/types';
import { MemberAvatar } from './MemberAvatar';
import { MemberStatusBadge } from './MemberStatusBadge';
import { MemberCardModal } from './MemberCardModal';
import { countDirectReferrals } from '@/lib/business/referralService';
import { Users, ChevronRight } from 'lucide-react';

interface ReferralMemberCardProps {
  member: EnrichedMember;
  showReferralCount?: boolean;
  showViewDetail?: boolean;
  className?: string;
  animationDelay?: number;
}

export function ReferralMemberCard({
  member,
  showReferralCount = true,
  showViewDetail = false,
  className,
  animationDelay = 0,
}: ReferralMemberCardProps) {
  const [showModal, setShowModal] = useState(false);
  const referralCount = countDirectReferrals(member.appUserId);

  return (
    <>
      <div
        className="card card-interactive animate-fade-in"
        style={{
          animationDelay: `${animationDelay}ms`,
          }}
        onClick={() => setShowModal(true)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <MemberAvatar member={member} size="md" showStatus />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {member.firstName} {member.lastName}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {MEMBER_CATEGORY_LABELS[member.category]}
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <MemberStatusBadge status={member.status} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            {showReferralCount && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.25rem 0.625rem',
                background: 'var(--bg-elevated)',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
              }}>
                <Users size={13} />
                <span style={{ fontWeight: 600 }}>{referralCount}</span>
              </div>
            )}
            <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        {showReferralCount && referralCount > 0 && (
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--alvarado-accent)', fontWeight: 600 }}>Red generada: {referralCount}</span>
          </div>
        )}
      </div>

      {showModal && (
        <MemberCardModal
          member={member}
          referralCount={referralCount}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

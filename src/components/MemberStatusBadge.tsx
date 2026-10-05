'use client';

import { MemberStatus, MEMBER_STATUS_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface MemberStatusBadgeProps {
  status: MemberStatus;
  className?: string;
}

export function MemberStatusBadge({ status, className }: MemberStatusBadgeProps) {
  const isActive = status === 'al_dia';

  return (
    <span
      className={cn(
        'status-badge',
        isActive ? 'status-badge-active' : 'status-badge-inactive',
        className
      )}
    >
      <span
        className={cn(
          'status-dot',
          isActive ? 'status-dot-active' : 'status-dot-inactive'
        )}
      />
      {MEMBER_STATUS_LABELS[status]}
    </span>
  );
}

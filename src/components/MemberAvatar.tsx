'use client';

import { EnrichedMember, MEMBER_STATUS_LABELS } from '@/types';
import { cn, formatInitials } from '@/lib/utils';

interface MemberAvatarProps {
  member: EnrichedMember;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  className?: string;
}

const sizeMap = {
  xs: { avatar: 28, font: '0.625rem' },
  sm: { avatar: 36, font: '0.75rem' },
  md: { avatar: 48, font: '0.9375rem' },
  lg: { avatar: 64, font: '1.25rem' },
  xl: { avatar: 88, font: '1.75rem' },
};

export function MemberAvatar({ member, size = 'md', showStatus = false, className }: MemberAvatarProps) {
  const { avatar: avatarSize, font: fontSize } = sizeMap[size];
  const isActive = member.status === 'al_dia';

  return (
    <div className={cn('relative inline-flex', className)}>
      {member.photoUrl ? (
        <img
          src={member.photoUrl}
          alt={`${member.firstName} ${member.lastName}`}
          style={{ width: avatarSize, height: avatarSize, fontSize }}
          className="avatar object-cover"
        />
      ) : (
        <div
          style={{ width: avatarSize, height: avatarSize, fontSize }}
          className="avatar"
        >
          {formatInitials(member.firstName, member.lastName)}
        </div>
      )}
      {showStatus && (
        <span
          style={{
            width: size === 'xs' ? 8 : size === 'sm' ? 10 : 12,
            height: size === 'xs' ? 8 : size === 'sm' ? 10 : 12,
          }}
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-[var(--bg-card)]',
            isActive
              ? 'bg-[var(--status-active)] shadow-[0_0_6px_var(--status-active)]'
              : 'bg-[var(--status-inactive)]'
          )}
          title={MEMBER_STATUS_LABELS[member.status]}
        />
      )}
    </div>
  );
}

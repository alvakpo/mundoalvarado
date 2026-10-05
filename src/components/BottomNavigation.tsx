'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Ticket, Trophy, Users, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/dashboard/chances', label: 'Mensual', icon: Ticket },
  { href: '/dashboard/anual', label: 'Anual', icon: Trophy },
  { href: '/dashboard/referidos', label: 'Referidos', icon: Users },
  { href: '/dashboard/invitar', label: 'Invitar', icon: LinkIcon },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="app-bottom-nav" style={{ alignItems: 'center', justifyContent: 'space-around', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '0.5rem 0.75rem',
              textDecoration: 'none',
              color: isActive ? 'var(--alvarado-accent)' : 'var(--text-muted)',
              transition: 'color var(--transition-fast)',
              flex: 1,
            }}
          >
            <div style={{
              position: 'relative',
              padding: '6px',
              borderRadius: '10px',
              background: isActive ? 'rgba(59, 111, 212, 0.12)' : 'transparent',
              transition: 'background var(--transition-fast)',
            }}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <span style={{
                  position: 'absolute',
                  top: -1,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'var(--alvarado-accent)',
                }} />
              )}
            </div>
            <span style={{ fontSize: '0.6875rem', fontWeight: isActive ? 600 : 400, letterSpacing: '0.02em' }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

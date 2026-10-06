'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Home,
  Ticket,
  Trophy,
  Award,
  Users,
  Link as LinkIcon,
  Gift,
  User,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDailyPointsStore } from '@/store/dailyPointsStore';
import { canClaimToday, clubDateKey } from '@/lib/business/dailyPoints';
import { useIsHydrated } from '@/lib/useIsHydrated';
import { MemberAvatar } from './MemberAvatar';
import { MEMBER_CATEGORY_LABELS } from '@/types';

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/dashboard/chances', label: 'Chances mensuales', icon: Ticket },
  { href: '/dashboard/sorteo-anual', label: 'Sorteo anual', icon: Trophy },
  { href: '/dashboard/grupales', label: 'Premios Grupales', icon: Award },
  { href: '/dashboard/referidos', label: 'Mis referidos', icon: Users },
  { href: '/dashboard/invitar', label: 'Invitar un amigo', icon: LinkIcon },
  { href: '/dashboard/puntos', label: 'Puntos diarios', icon: Gift },
  { href: '/dashboard/cuenta', label: 'Mi cuenta', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { lastClaimDate } = useDailyPointsStore();

  // El servidor no puede saber si el socio ya reclamó (vive en el
  // navegador), así que el indicador se dibuja recién tras hidratar.
  // Sin esto, el HTML del servidor y el del cliente no coincidirían.
  const hydrated = useIsHydrated();
  const puntosParaReclamar =
    hydrated && canClaimToday(lastClaimDate, clubDateKey(new Date()));

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div style={{ padding: '1.75rem 1.5rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: 44, height: 44, position: 'relative', flexShrink: 0 }}>
            <Image
              src="/escudo-alvarado.webp"
              sizes="44px"
              alt="Club Atlético Alvarado"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.125rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}>
              ALVARADO
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>
              Programa de Beneficios
            </div>
          </div>
        </div>
      </div>

      {/* Perfil */}
      {user && (
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MemberAvatar member={user} size="sm" showStatus />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {MEMBER_CATEGORY_LABELS[user.category]}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navegación */}
      <nav style={{ flex: 1, padding: '0.75rem 0.75rem', overflowY: 'auto' }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

          // Puntos diarios: se prende cuando hay puntos para reclamar y
          // se apaga cuando ya reclamó.
          const destacar = href === '/dashboard/puntos' && puntosParaReclamar;

          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 0.875rem',
                borderRadius: '10px',
                marginBottom: '2px',
                textDecoration: 'none',
                color: destacar
                  ? '#f59e0b'
                  : isActive
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                background: destacar
                  ? 'rgba(245, 158, 11, 0.1)'
                  : isActive
                    ? 'var(--bg-elevated)'
                    : 'transparent',
                borderLeft: isActive
                  ? '2px solid var(--alvarado-accent)'
                  : destacar
                    ? '2px solid #f59e0b'
                    : '2px solid transparent',
                transition: 'all var(--transition-fast)',
                fontSize: '0.875rem',
                fontWeight: isActive || destacar ? 600 : 400,
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {label}
              {destacar && <span className="nav-alert-dot" style={{ marginLeft: 'auto' }} />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            width: '100%',
            padding: '0.75rem 0.875rem',
            borderRadius: '10px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-elevated)';
            e.currentTarget.style.color = 'var(--status-inactive)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

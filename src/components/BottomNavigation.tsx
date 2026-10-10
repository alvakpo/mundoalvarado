'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Ticket, Trophy, Users, TrendingUp, Link as LinkIcon, Gift } from 'lucide-react';
import { useDailyPointsStore } from '@/store/dailyPointsStore';
import { canClaimToday, clubDateKey } from '@/lib/business/dailyPoints';
import { useIsHydrated } from '@/lib/useIsHydrated';

// Ítems de la barra inferior móvil. 6 ítems entran cómodos en cualquier celular.
const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: Home, matchExact: true },
  { href: '/dashboard/sorteo-mensual', label: 'Sorteos', icon: Ticket, matchPrefix: ['/dashboard/sorteo-mensual', '/dashboard/sorteo-anual'] },
  { href: '/dashboard/niveles', label: 'Niveles', icon: TrendingUp },
  { href: '/dashboard/referidos', label: 'Referidos', icon: Users },
  { href: '/dashboard/invitar', label: 'Invitar', icon: LinkIcon },
  { href: '/dashboard/puntos', label: 'Puntos', icon: Gift },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const { lastClaimDate } = useDailyPointsStore();

  // Igual que en el sidebar: el dato vive en el navegador, así que el
  // indicador se dibuja después de hidratar.
  const hydrated = useIsHydrated();
  const puntosParaReclamar =
    hydrated && canClaimToday(lastClaimDate, clubDateKey(new Date()));

  return (
    <nav
      className="app-bottom-nav"
      style={{
        alignItems: 'center',
        // overflow oculto para que el menú nunca ensanche la página
        overflow: 'hidden',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {navItems.map((item) => {
        const { href, label, icon: Icon } = item;
        const isActive = item.matchPrefix
          ? item.matchPrefix.some((prefix) => pathname.startsWith(prefix))
          : item.matchExact
            ? pathname === href
            : pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        const destacar = href === '/dashboard/puntos' && puntosParaReclamar;

        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              // minWidth: 0 es lo que deja que los ítems se achiquen en
              // vez de desbordar: sin esto cada uno pide su ancho mínimo
              // de contenido y el último queda fuera de la pantalla.
              minWidth: 0,
              flex: '1 1 0',
              padding: '0.5rem 0.125rem',
              textDecoration: 'none',
              color: destacar
                ? '#f59e0b'
                : isActive
                  ? 'var(--alvarado-accent)'
                  : 'var(--text-muted)',
              transition: 'color var(--transition-fast)',
            }}
          >
            <div style={{
              position: 'relative',
              padding: '5px',
              borderRadius: '10px',
              background: destacar
                ? 'rgba(245, 158, 11, 0.14)'
                : isActive
                  ? 'rgba(59, 111, 212, 0.12)'
                  : 'transparent',
              transition: 'background var(--transition-fast)',
            }}>
              <Icon size={21} strokeWidth={isActive || destacar ? 2.5 : 2} />
              {isActive && !destacar && (
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
              {destacar && (
                <span className="nav-alert-dot" style={{ position: 'absolute', top: 1, right: 1 }} />
              )}
            </div>
            <span style={{
              fontSize: '0.625rem',
              fontWeight: isActive || destacar ? 600 : 400,
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

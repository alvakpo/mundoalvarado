'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Ticket, Trophy, Users, Link as LinkIcon, Gift } from 'lucide-react';

// Seis ítems en el ancho de un celular. Los textos son cortos a
// propósito: "Chances mensuales" no entra, "Mensual" sí.
const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/dashboard/chances', label: 'Mensual', icon: Ticket },
  { href: '/dashboard/anual', label: 'Anual', icon: Trophy },
  { href: '/dashboard/referidos', label: 'Referidos', icon: Users },
  { href: '/dashboard/invitar', label: 'Invitar', icon: LinkIcon },
  { href: '/dashboard/puntos', label: 'Puntos', icon: Gift },
];

export function BottomNavigation() {
  const pathname = usePathname();

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
              gap: '3px',
              // minWidth: 0 es lo que deja que los ítems se achiquen en
              // vez de desbordar: sin esto cada uno pide su ancho mínimo
              // de contenido y el último queda fuera de la pantalla.
              minWidth: 0,
              flex: '1 1 0',
              padding: '0.5rem 0.125rem',
              textDecoration: 'none',
              color: isActive ? 'var(--alvarado-accent)' : 'var(--text-muted)',
              transition: 'color var(--transition-fast)',
            }}
          >
            <div style={{
              position: 'relative',
              padding: '5px',
              borderRadius: '10px',
              background: isActive ? 'rgba(59, 111, 212, 0.12)' : 'transparent',
              transition: 'background var(--transition-fast)',
            }}>
              <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
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
            <span style={{
              fontSize: '0.625rem',
              fontWeight: isActive ? 600 : 400,
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

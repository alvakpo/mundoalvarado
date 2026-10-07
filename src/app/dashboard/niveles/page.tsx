'use client';

import { useAuthStore } from '@/store/authStore';
import { getMockDirectReferrals } from '@/lib/mock/mockData';
import {
  LEVELS,
  MAX_LEVEL,
  levelProgress,
  levelRangeLabel,
  stepOpacity,
} from '@/lib/business/levels';
import { TrendingUp, Star, ArrowUp } from 'lucide-react';

// ============================================================
// NIVELES
// ============================================================
// El nivel se calcula por cuántos referidos directos trajo el socio.
//
// La escalera se lee de abajo hacia arriba: el Nivel 0 abajo y el
// máximo arriba. Los escalones que todavía no alcanzaste se van
// desvaneciendo, así se ve el camino que falta sin que la pantalla se
// sienta inalcanzable: los primeros dos o tres se leen claro, el resto
// queda insinuado.
// ============================================================

export default function NivelesPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  const directReferrals = getMockDirectReferrals(user.appUserId);
  const activeReferrals = directReferrals.filter((r) => r.status === 'al_dia').length;

  // El nivel se mide por cuántos trajiste, estén al día o no: si los
  // invitaste, los trajiste.
  const progress = levelProgress(directReferrals.length);

  return (
    <div style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>

      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: 'rgba(168, 85, 247, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <TrendingUp size={20} style={{ color: '#a855f7' }} />
          </div>
          <h1 className="page-title" style={{ fontSize: '1.75rem' }}>NIVELES</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Cada nivel se alcanza por cuántos socios sumaste al club. Cuantos más traés, más alto llegás.
        </p>
      </div>

      {/* Nivel actual */}
      <div
        className="animate-fade-in stagger-1"
        style={{
          background: 'var(--gradient-primary)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
          Tu nivel
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '4rem',
          fontWeight: 700,
          color: 'white',
          lineHeight: 1,
        }}>
          {progress.currentLevel}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'white',
          marginTop: '0.5rem',
        }}>
          {progress.currentTitle}
        </div>

        {/* Estrellas del nivel alcanzado */}
        {progress.currentLevel > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', marginTop: '0.875rem' }}>
            {Array.from({ length: progress.currentLevel }).map((_, i) => (
              <Star key={i} size={18} fill="#fbbf24" style={{ color: '#fbbf24' }} />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1.25rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
              {directReferrals.length}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Referidos
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-active)' }}>
              {activeReferrals}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Al día
            </div>
          </div>
        </div>
      </div>

      {/* Cuánto falta para el próximo nivel */}
      <div
        className="card animate-fade-in stagger-2"
        style={{ marginBottom: '1.5rem' }}
      >
        {progress.nextLevel === null ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆</div>
            <div style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.375rem' }}>
              Estás en el nivel máximo
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No hay techo: seguí sumando y vas a mantener el nivel más alto del programa.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
              <ArrowUp size={16} style={{ color: 'var(--alvarado-accent)' }} />
              <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                Te {progress.missingForNext === 1 ? 'falta' : 'faltan'}{' '}
                <span style={{ color: 'var(--alvarado-accent)', fontWeight: 700 }}>
                  {progress.missingForNext}
                </span>{' '}
                {progress.missingForNext === 1 ? 'referido' : 'referidos'} para el Nivel {progress.nextLevel}
              </div>
            </div>

            {/* Barra de avance dentro del nivel actual */}
            <div style={{ height: 8, borderRadius: '100px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.round(progress.progressInLevel * 100)}%`,
                height: '100%',
                borderRadius: '100px',
                background: 'var(--gradient-accent)',
                transition: 'width var(--transition-slow)',
              }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'right' }}>
              Nivel {progress.currentLevel} → Nivel {progress.nextLevel}
            </div>
          </>
        )}
      </div>

      {/* La escalera */}
      <div className="card animate-fade-in stagger-3">
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
          La escalera de niveles
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* De arriba hacia abajo: el nivel más alto arriba */}
          {LEVELS.slice().reverse().map((def) => {
            const alcanzado = def.level <= progress.currentLevel;
            const esActual = def.level === progress.currentLevel;
            const opacity = stepOpacity(def.level, progress.currentLevel);
            const ancho = 20 + (def.level / MAX_LEVEL) * 55;

            return (
              <div
                key={def.level}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity,
                }}
              >
                {/* Etiqueta del nivel */}
                <div style={{
                  width: 52,
                  flexShrink: 0,
                  fontSize: '0.6875rem',
                  fontWeight: esActual || alcanzado ? 700 : 400,
                  color: esActual
                    ? 'var(--alvarado-accent)'
                    : alcanzado
                      ? 'var(--text-secondary)'
                      : 'var(--text-muted)',
                  textAlign: 'right',
                }}>
                  Nivel {def.level}
                </div>

                {/* El escalón */}
                <div style={{
                  width: `${ancho}%`,
                  minWidth: 44,
                  height: 32,
                  borderRadius: '8px',
                  background: esActual
                    ? 'var(--gradient-accent)'
                    : alcanzado
                      ? 'rgba(34, 197, 94, 0.18)'
                      : 'var(--bg-elevated)',
                  border: esActual
                    ? '1px solid var(--alvarado-accent)'
                    : alcanzado
                      ? '1px solid rgba(34, 197, 94, 0.3)'
                      : '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1px',
                  flexShrink: 0,
                }}>
                  {def.level === 0 ? (
                    <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>—</span>
                  ) : (
                    Array.from({ length: def.level }).map((_, i) => (
                      <Star
                        key={i}
                        size={11}
                        fill={alcanzado ? (esActual ? '#ffffff' : '#fbbf24') : 'transparent'}
                        style={{ color: esActual ? '#ffffff' : alcanzado ? '#fbbf24' : 'var(--text-muted)' }}
                      />
                    ))
                  )}
                </div>

                {/* Rango de referidos */}
                <div style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  {def.level === 0 ? 'ninguno' : levelRangeLabel(def.level)}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}>
          Los escalones de arriba se ven más tenues porque todavía no llegaste.
          Cuentan los referidos directos que trajiste, estén al día o no.
        </div>
      </div>

      {/* Explicación */}
      <div
        style={{
          marginTop: '1.5rem',
          padding: '1rem 1.25rem',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: 'var(--text-secondary)' }}>Cómo funciona:</strong> tu nivel sube
        según cuántos socios sumaste al club. No baja si alguno se atrasa con la cuota: lo que
        cuenta es a cuántos trajiste.
      </div>
    </div>
  );
}

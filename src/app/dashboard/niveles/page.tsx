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
// Esta pantalla está armada al revés que las demás: en vez de apilar
// tarjetas del mismo peso, LA ESCALERA ES LA PÁGINA. Ocupa todo el
// ancho disponible y los escalones son grandes, para que se entienda
// de un vistazo dónde está parado el socio y cuánto le falta.
//
// Todo lo demás (cuánto falta, cómo funciona) va abajo y más chico:
// está disponible, pero no compite.
// ============================================================

export default function NivelesPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  const directReferrals = getMockDirectReferrals(user.appUserId);
  const activeReferrals = directReferrals.filter((r) => r.status === 'al_dia').length;

  // El nivel se mide por cuántos trajiste, estén al día o no: si los
  // invitaste, los trajiste.
  const progress = levelProgress(directReferrals.length);

  // De arriba hacia abajo: el nivel más alto arriba, como una escalera
  // que sube.
  const escalones = LEVELS.slice().reverse();

  return (
    <div style={{ padding: '2rem', maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: '1.75rem' }}>
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
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.6, maxWidth: 720 }}>
          Cada nivel se alcanza por cuántos socios sumaste al club. Cuantos más traés, más alto llegás.
        </p>
      </div>

      {/* ============================================================
          LA ESCALERA — protagonista, integrada al fondo
          ============================================================ */}
      <div className="animate-fade-in stagger-1" style={{ marginBottom: '2.5rem' }}>
        {/* Tu nivel, en grande integrado al lienzo */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '1.5rem',
          flexWrap: 'wrap',
          paddingBottom: '2rem',
          marginBottom: '2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
        }}>
          <div>
            <div style={{
              fontSize: '0.6875rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}>
              Estás en
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.25rem', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '5.5rem',
                fontWeight: 800,
                lineHeight: 0.85,
                color: 'var(--alvarado-accent)',
                textShadow: '0 0 35px rgba(59, 111, 212, 0.4)',
              }}>
                {progress.currentLevel}
              </span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.5rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                lineHeight: 1,
                letterSpacing: '0.04em',
                color: 'var(--text-primary)',
              }}>
                {progress.currentTitle}
              </span>
              {progress.currentLevel > 0 && (
                <span style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  {Array.from({ length: progress.currentLevel }).map((_, i) => (
                    <Star
                      key={i}
                      size={24}
                      fill="#fbbf24"
                      style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.45))' }}
                    />
                  ))}
                </span>
              )}
            </div>
          </div>

          {/* Los números del costado: cápsulas sutiles */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '0.875rem 1.25rem',
              minWidth: 110,
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>
                {directReferrals.length}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.35rem' }}>
                Referidos
              </div>
            </div>
            <div style={{
              background: 'rgba(34, 197, 94, 0.06)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: '14px',
              padding: '0.875rem 1.25rem',
              minWidth: 110,
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, lineHeight: 1, color: 'var(--status-active)' }}>
                {activeReferrals}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'rgba(34, 197, 94, 0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.35rem' }}>
                Al día
              </div>
            </div>
          </div>
        </div>

        {/* Los escalones flotando en el lienzo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {escalones.map((def) => {
            const alcanzado = def.level <= progress.currentLevel;
            const esActual = def.level === progress.currentLevel;
            const opacity = stepOpacity(def.level, progress.currentLevel);
            const ancho = 20 + (def.level / MAX_LEVEL) * 60;

            return (
              <div key={def.level} className="level-step" style={{ opacity }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: esActual || alcanzado ? 700 : 500,
                  color: esActual
                    ? 'var(--alvarado-accent)'
                    : alcanzado
                      ? 'var(--text-secondary)'
                      : 'var(--text-muted)',
                  textAlign: 'right',
                }}>
                  Nivel {def.level}
                </div>

                <div
                  className="level-step-bar"
                  style={{
                    width: `${ancho}%`,
                    background: esActual
                      ? 'linear-gradient(90deg, #1e3a6e 0%, #3b6fd4 50%, #4d82eb 100%)'
                      : alcanzado
                        ? 'rgba(34, 197, 94, 0.16)'
                        : 'rgba(255, 255, 255, 0.03)',
                    border: esActual
                      ? '1px solid rgba(59, 111, 212, 0.8)'
                      : alcanzado
                        ? '1px solid rgba(34, 197, 94, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: esActual
                      ? '0 0 24px rgba(59, 111, 212, 0.35), inset 0 1px 1px rgba(255,255,255,0.3)'
                      : 'none',
                    transition: 'all var(--transition-base)',
                  }}
                >
                  {def.level === 0 ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                  ) : (
                    Array.from({ length: def.level }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={alcanzado ? (esActual ? '#ffffff' : '#fbbf24') : 'transparent'}
                        style={{
                          color: esActual
                            ? '#ffffff'
                            : alcanzado
                              ? '#fbbf24'
                              : 'rgba(255, 255, 255, 0.2)',
                          filter: esActual ? 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))' : undefined,
                        }}
                      />
                    ))
                  )}
                </div>

                <div className="level-step-meta">
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: esActual ? 'var(--text-primary)' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                  }}>
                    {def.level === 0 ? 'ninguno' : levelRangeLabel(def.level)}
                  </div>
                  <div style={{
                    fontSize: '0.8125rem',
                    color: esActual ? 'var(--alvarado-accent)' : 'var(--text-muted)',
                    fontWeight: esActual ? 600 : 400,
                    whiteSpace: 'nowrap',
                  }}>
                    {esActual ? '← estás acá' : def.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================
          Lo secundario: cápsulas estilizadas
          ============================================================ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.5rem',
      }}>
        {/* Cuánto falta */}
        <div
          className="animate-fade-in stagger-2"
          style={{
            background: 'rgba(19, 27, 46, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          {progress.nextLevel === null ? (
            <>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🏆</div>
              <div style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.375rem' }}>
                Estás en el nivel máximo
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                No hay techo: seguí sumando y mantenés el nivel más alto del programa.
              </p>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <ArrowUp size={16} style={{ color: 'var(--alvarado-accent)', flexShrink: 0 }} />
                <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                  Te {progress.missingForNext === 1 ? 'falta' : 'faltan'}{' '}
                  <span style={{ color: 'var(--alvarado-accent)', fontWeight: 700 }}>
                    {progress.missingForNext}
                  </span>{' '}
                  {progress.missingForNext === 1 ? 'referido' : 'referidos'} para el Nivel {progress.nextLevel}
                </div>
              </div>

              <div style={{ height: 8, borderRadius: '100px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
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

        {/* Cómo funciona */}
        <div
          className="animate-fade-in stagger-3"
          style={{
            background: 'rgba(19, 27, 46, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '0.875rem',
          }}>
            Cómo funciona
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Tu nivel sube según cuántos socios sumaste al club. No baja si alguno se atrasa con la
            cuota: lo que cuenta es a cuántos trajiste.
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.7, marginTop: '0.875rem' }}>
            Los escalones de arriba se ven más tenues porque todavía no llegaste. El nivel se calcula
            con tus referidos directos.
          </p>
        </div>
      </div>
    </div>
  );
}

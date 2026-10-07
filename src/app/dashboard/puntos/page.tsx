'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useDailyPointsStore } from '@/store/dailyPointsStore';
import {
  POINTS_PER_DAY,
  REWARDS_CATALOG,
  canClaimToday,
  clubDateKey,
  formatCountdown,
  msUntilNextClubDay,
  recentDateKeys,
} from '@/lib/business/dailyPoints';
import { Sparkles, Flame, Gift, Check, Clock } from 'lucide-react';

// Se evita depender del locale del navegador para las iniciales de los
// días: dos letras fijas y listo.
const WEEKDAY_LABELS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

function weekdayLabel(dateKey: string): string {
  // Mediodía UTC: nunca se corre de día por la zona horaria.
  const day = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
  return WEEKDAY_LABELS[day];
}

function dayNumber(dateKey: string): string {
  return String(Number(dateKey.slice(8, 10)));
}

export default function PuntosPage() {
  const { user } = useAuthStore();
  const { totalPoints, lastClaimDate, streak, claimedDates, claim, reset } =
    useDailyPointsStore();

  // Reloj para el contador. Se actualiza cada segundo sólo mientras la
  // página está abierta.
  const [now, setNow] = useState<Date>(() => new Date());
  const [celebration, setCelebration] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (celebration === null) return;
    const id = setTimeout(() => setCelebration(null), 2600);
    return () => clearTimeout(id);
  }, [celebration]);

  if (!user) return null;

  const todayKey = clubDateKey(now);
  const claimable = canClaimToday(lastClaimDate, todayKey);
  const countdown = formatCountdown(msUntilNextClubDay(now));
  const days = recentDateKeys(todayKey, 7);
  const claimedSet = new Set(claimedDates);

  const handleClaim = () => {
    const result = claim();
    if (!result.alreadyClaimed) {
      setCelebration(result.awarded);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 640, margin: '0 auto' }}>

      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Sparkles size={20} style={{ color: '#f59e0b' }} />
          </div>
          <h1 className="page-title" style={{ fontSize: '1.75rem' }}>PUNTOS DIARIOS</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Entrá todos los días y sumá puntos para canjear por increíbles premios.
        </p>
      </div>

      {/* Saldo */}
      <div
        className="animate-fade-in stagger-1"
        style={{
          background: 'var(--gradient-primary)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '1.25rem',
          border: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
          }}
      >
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
          Tus puntos
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '3.5rem',
          fontWeight: 700,
          color: 'white',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {totalPoints.toLocaleString('es-AR')}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.25rem' }}>
          Puntos acumulados
        </div>

        {streak > 0 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            marginTop: '1.25rem',
            padding: '0.375rem 0.875rem',
            borderRadius: '100px',
            background: 'rgba(245, 158, 11, 0.18)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            color: '#fbbf24',
            fontSize: '0.8125rem',
            fontWeight: 700,
          }}>
            <Flame size={15} />
            {streak} {streak === 1 ? 'día seguido' : 'días seguidos'}
          </div>
        )}
      </div>

      {/* Reclamo */}
      <div
        className="card animate-fade-in stagger-2"
        style={{ marginBottom: '1.25rem' }}
      >
        {claimable ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                ¡Tenés puntos para reclamar!
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Son {POINTS_PER_DAY} puntos por entrar hoy.
              </div>
            </div>
            <button
              id="claim-daily-points"
              onClick={handleClaim}
              className="btn btn-primary btn-lg btn-full"
              style={{ fontSize: '1rem', letterSpacing: '0.04em' }}
            >
              <Sparkles size={20} />
              Reclamar puntos diarios
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--status-active-bg)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <Check size={26} style={{ color: 'var(--status-active)' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.375rem' }}>
              Ya reclamaste hoy
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Volvé mañana para sumar {POINTS_PER_DAY} puntos más.
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              borderRadius: '10px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
            }}>
              <Clock size={16} />
              Próximo reclamo en
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                {countdown}
              </strong>
            </div>
          </div>
        )}

        {/* Tira de los últimos 7 días */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem', textAlign: 'center' }}>
            Tus últimos 7 días
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.375rem' }}>
            {days.map((key) => {
              const done = claimedSet.has(key);
              const isToday = key === todayKey;
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', flex: 1 }}>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                    {weekdayLabel(key)}
                  </div>
                  <div style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    background: done ? 'var(--status-active-bg)' : 'var(--bg-elevated)',
                    border: isToday
                      ? '2px solid var(--alvarado-accent)'
                      : done
                        ? '1px solid rgba(34, 197, 94, 0.3)'
                        : '1px solid var(--border-subtle)',
                    color: done ? 'var(--status-active)' : 'var(--text-muted)',
                  }}>
                    {done ? <Check size={14} /> : dayNumber(key)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Premios */}
      <div
        className="card animate-fade-in stagger-3"
        style={{ marginBottom: '1.25rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Gift size={17} style={{ color: '#f59e0b' }} />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Increíbles premios
          </div>
        </div>

        {REWARDS_CATALOG.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
            <div style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>🎁</div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
              Estamos definiendo los premios
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>
              Junto al club vamos a elegir qué se puede canjear y cuántos puntos
              cuesta cada cosa. Mientras tanto, <strong style={{ color: 'var(--text-secondary)' }}>tus puntos se acumulan y no se vencen</strong>.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {REWARDS_CATALOG.map((reward) => {
              const canAfford = totalPoints >= reward.costPoints;
              return (
                <div key={reward.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  padding: '0.875rem',
                  borderRadius: '12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ fontSize: '1.75rem' }}>{reward.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{reward.title}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{reward.description}</div>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    color: canAfford ? 'var(--status-active)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}>
                    {reward.costPoints.toLocaleString('es-AR')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cómo funciona */}
      <div
        className="card animate-fade-in stagger-4"
        style={{ opacity: 0 }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>
          Cómo funciona
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { step: '1', title: 'Entrás una vez por día', desc: 'Todos los días vas a tener 100 puntos esperándote.' },
            { step: '2', title: 'Presionás el botón', desc: 'Un toque y los puntos se suman a tu saldo.' },
            { step: '3', title: 'Cuidás tu racha', desc: 'Si entrás varios días seguidos, tu racha crece. Si te salteás un día, vuelve a empezar.' },
            { step: '4', title: 'Canjeás por premios', desc: 'Cuando estén definidos, cambiás tus puntos por lo que más te guste.' },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'var(--gradient-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '0.9375rem',
                color: 'white',
                flexShrink: 0,
              }}>
                {step}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '2px' }}>{title}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sólo para la demo: permite volver a probar el reclamo */}
      <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <button
          onClick={reset}
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}
        >
          Reiniciar mis puntos (sólo demo)
        </button>
      </div>

      {/* Celebración */}
      {celebration !== null && (
        <div className="modal-overlay" onClick={() => setCelebration(null)}>
          <div
            className="modal-content animate-scale-in"
            style={{ textAlign: 'center', maxWidth: 320, padding: '2.5rem 2rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🎉</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '3rem',
              fontWeight: 700,
              color: 'var(--status-active)',
              lineHeight: 1,
            }}>
              +{celebration}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem' }}>
              Puntos
            </div>
            <div style={{ marginTop: '1.5rem', fontWeight: 600 }}>
              ¡Listo! Ya sumaste los puntos de hoy.
            </div>
            {streak > 1 && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                marginTop: '1rem',
                padding: '0.375rem 0.875rem',
                borderRadius: '100px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                fontSize: '0.8125rem',
                fontWeight: 700,
              }}>
                <Flame size={14} />
                {streak} días seguidos
              </div>
            )}
            <button
              onClick={() => setCelebration(null)}
              className="btn btn-secondary btn-full btn-sm"
              style={{ marginTop: '1.5rem' }}
            >
              Seguir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

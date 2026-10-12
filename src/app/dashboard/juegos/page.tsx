'use client';

import { useState, useEffect, useRef } from 'react';
import { Gamepad2, Maximize2, Minimize2, RotateCcw, Trophy, Sparkles, Flame, Volume2, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  date: string;
  isCurrentUser?: boolean;
}

const DEFAULT_RECORDS: LeaderboardEntry[] = [
  { id: '1', name: 'Marcela V.', score: 28, date: 'Hoy', isCurrentUser: true },
  { id: '2', name: 'Joaquín Alvarado', score: 24, date: 'Ayer' },
  { id: '3', name: 'Facundo Peña', score: 19, date: '10/10' },
  { id: '4', name: 'Micaela Rossi', score: 15, date: '09/10' },
  { id: '5', name: 'Lucas Mardel', score: 11, date: '08/10' },
];

export default function JuegosPage() {
  const { user } = useAuthStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bestScore, setBestScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('torino_best_score');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Escuchar mensajes desde el juego (nuevo récord o game over)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TORINO_NEW_RECORD') {
        const score = Number(event.data.score) || 0;
        setLatestScore(score);
        if (score > bestScore) {
          setBestScore(score);
          if (typeof window !== 'undefined') {
            localStorage.setItem('torino_best_score', String(score));
          }
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 4000);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [bestScore]);

  // Prevenir que la tecla Espacio haga scroll en la página web
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        // Si no estamos escribiendo en un input o textarea, evitar scroll
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          // Enfocar el iframe para asegurar que el juego reciba la pulsación
          iframeRef.current?.contentWindow?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Función para pantalla completa
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error al entrar en pantalla completa:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Reiniciar juego
  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = '/juego/index.html';
      iframeRef.current.focus();
    }
  };

  return (
    <div style={{ padding: '2rem 1rem', maxWidth: 1000, margin: '0 auto' }}>
      
      {/* Encabezado */}
      <div className="animate-fade-in" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(59, 111, 212, 0.15)',
            border: '1px solid rgba(59, 111, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--alvarado-accent)'
          }}>
            <Gamepad2 size={24} />
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              margin: 0,
              color: 'var(--text-primary)'
            }}>
              Juegos
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Torino en Avioneta — ¡Superá los obstáculos y alcanzá el récord del club!
            </p>
          </div>
        </div>
      </div>

      {/* Cartel de celebración por récord */}
      {showCelebration && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          borderRadius: 14,
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
          animation: 'bounce 0.5s ease'
        }}>
          <Sparkles size={26} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>¡NUEVO RÉCORD PERSONAL! 🎉</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.95 }}>
              Alcanzaste {latestScore} puntos en Torino en Avioneta.
            </div>
          </div>
        </div>
      )}

      {/* Grid principal: Juego + Panel lateral de récords */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: '1.75rem',
        alignItems: 'start'
      }}>
        
        {/* Contenedor central del Juego */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%'
        }}>
          
          {/* Barra de controles rápidos */}
          <div style={{
            width: '100%',
            maxWidth: 360,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px 14px 0 0',
            padding: '0.625rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Torino en Avioneta
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleReload}
                title="Reiniciar juego"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  transition: 'all 0.15s ease'
                }}
              >
                <RotateCcw size={14} />
                Reiniciar
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                style={{
                  background: 'rgba(59, 111, 212, 0.15)',
                  border: '1px solid rgba(59, 111, 212, 0.3)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  color: 'var(--alvarado-accent)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                {isFullscreen ? 'Salir' : 'Pantalla Completa'}
              </button>
            </div>
          </div>

          {/* Gabinete / Marco del juego */}
          <div
            ref={containerRef}
            style={{
              width: '100%',
              maxWidth: 360,
              height: isFullscreen ? '100vh' : 580,
              background: '#000000',
              border: isFullscreen ? 'none' : '2px solid var(--border-strong)',
              borderRadius: isFullscreen ? '0' : '0 0 16px 16px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <iframe
              ref={iframeRef}
              src="/juego/index.html"
              title="Torino en Avioneta - Club Atlético Alvarado"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
                background: '#000000'
              }}
              allow="autoplay; fullscreen"
            />
          </div>

          {/* Tarjeta de Instrucciones y Controles */}
          <div style={{
            marginTop: '1.25rem',
            width: '100%',
            maxWidth: 360,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 14,
            padding: '1rem',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🕹️</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Cómo jugar
              </span>
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: '1.25rem',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>En computadora:</strong> Presioná la <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>Barra Espaciadora</kbd> o hacé <strong>clic izquierdo</strong> con el mouse.
              </li>
              <li style={{ marginTop: '4px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>En celular:</strong> Tocá cualquier parte de la pantalla para elevar la avioneta.
              </li>
              <li style={{ marginTop: '4px' }}>
                Esquivá los obstáculos y sumá puntos pasando entre las columnas.
              </li>
            </ul>

            {bestScore > 0 && (
              <div style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px dashed var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Tu mejor puntaje:</span>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--alvarado-accent)',
                  fontFamily: 'var(--font-display)'
                }}>
                  {bestScore} pts
                </span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

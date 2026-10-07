'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await login(email, password);
    if (success) {
      router.push('/dashboard');
    }
  };

  // Rellenar datos de prueba
  const fillTestData = () => {
    setEmail('marcela@test.com');
    setPassword('test1234');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-primary)',
    }}>
      {/* Panel izquierdo - solo desktop */}
      <div style={{
        flex: 1,
        background: 'var(--gradient-primary)',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="login-hero"
      >
        {/* Círculos decorativos */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.02)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{ width: 120, height: 120, position: 'relative', margin: '0 auto 2rem' }}>
            <Image src="/escudo-alvarado.webp" alt="Club Atlético Alvarado" fill sizes="120px" style={{ objectFit: 'contain' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'white', lineHeight: 1.1, marginBottom: '1rem' }}>
            MUNDO<br />ALVARADO
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Programa de Beneficios
          </div>
          <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {['Participá por premios mensuales', 'Acumulá chances anuales', 'Crecé tu red de referidos'].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel de login */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        maxWidth: 480,
        margin: '0 auto',
        width: '100%',
      }}>
        {/* Logo mobile */}
        <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: 64, height: 64, position: 'relative', margin: '0 auto 1.25rem' }}>
            <Image src="/escudo-alvarado.webp" alt="Alvarado" fill sizes="64px" style={{ objectFit: 'contain' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            MUNDO ALVARADO
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Programa de Beneficios
          </div>
        </div>

        {/* Formulario */}
        <div
          className="card animate-fade-in stagger-1"
          style={{ width: '100%', padding: '2rem' }}
        >
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.75rem' }}>
            Iniciar sesión
          </h1>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1rem',
              background: 'var(--status-inactive-bg)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              color: 'var(--status-inactive)',
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={isLoading}
              style={{ marginTop: '0.5rem' }}
            >
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            ¿No tenés cuenta?{' '}
            <Link href="/register" style={{ color: 'var(--alvarado-accent)', textDecoration: 'none', fontWeight: 600 }}>
              Registrate
            </Link>
          </div>
        </div>

        {/* Cuenta de prueba */}
        <div
          className="animate-fade-in stagger-2"
          style={{
            marginTop: '1rem',
            padding: '1rem 1.25rem',
            background: 'rgba(59, 111, 212, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(59, 111, 212, 0.2)',
            width: '100%',
            }}
        >
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            🧪 <strong style={{ color: 'var(--text-secondary)' }}>Modo demo:</strong> Usá la cuenta de prueba
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Email: <code style={{ color: 'var(--alvarado-accent)' }}>marcela@test.com</code> / Pass: <code style={{ color: 'var(--alvarado-accent)' }}>test1234</code>
          </div>
          <button
            id="fill-test-data"
            onClick={fillTestData}
            className="btn btn-ghost btn-sm"
          >
            Rellenar datos de prueba
          </button>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .login-hero {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { MOCK_MEMBERS } from '@/lib/mock/mockData';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Suspense } from 'react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const referralCode = searchParams.get('ref');

  // Derivado, no estado: el banner se resuelve en el mismo render, sin
  // un setState dentro de un effect (que provocaba un render en cascada).
  const referrerInfo = useMemo(() => {
    if (!referralCode) return null;
    const referrer = MOCK_MEMBERS.find(
      (m) => m.referralCode === referralCode || m.publicAlias === referralCode
    );
    return referrer
      ? `Referido por: ${referrer.firstName} ${referrer.lastName}`
      : null;
  }, [referralCode]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    const success = await register(
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName,
      referralCode ?? undefined
    );

    if (success) {
      router.push('/dashboard');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, position: 'relative', margin: '0 auto 1rem' }}>
            <Image src="/escudo-alvarado.webp" alt="Alvarado" fill sizes="56px" style={{ objectFit: 'contain' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            MUNDO ALVARADO
          </div>
        </div>

        {/* Banner de referido */}
        {referrerInfo && (
          <div
            className="animate-fade-in"
            style={{
              padding: '0.875rem 1rem',
              background: 'rgba(59, 111, 212, 0.1)',
              border: '1px solid rgba(59, 111, 212, 0.25)',
              borderRadius: '10px',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              color: 'var(--alvarado-accent)',
              textAlign: 'center',
            }}
          >
            🎟️ {referrerInfo}
          </div>
        )}

        {/* Formulario */}
        <div
          className="card animate-fade-in stagger-1"
          style={{ padding: '2rem', opacity: 0, animationFillMode: 'forwards' }}
        >
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            Crear cuenta
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Nombre
                </label>
                <input
                  id="register-firstname"
                  type="text"
                  className="input"
                  value={formData.firstName}
                  onChange={handleChange('firstName')}
                  placeholder="Juan"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Apellido
                </label>
                <input
                  id="register-lastname"
                  type="text"
                  className="input"
                  value={formData.lastName}
                  onChange={handleChange('lastName')}
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Email
              </label>
              <input
                id="register-email"
                type="email"
                className="input"
                value={formData.email}
                onChange={handleChange('email')}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  value={formData.password}
                  onChange={handleChange('password')}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Confirmar contraseña
              </label>
              <input
                id="register-confirm-password"
                type="password"
                className="input"
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                placeholder="••••••••"
                required
              />
              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--status-inactive)', marginTop: '4px' }}>
                  Las contraseñas no coinciden
                </div>
              )}
            </div>

            <button
              id="register-submit"
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={isLoading || formData.password !== formData.confirmPassword}
              style={{ marginTop: '0.5rem' }}
            >
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" style={{ color: 'var(--alvarado-accent)', textDecoration: 'none', fontWeight: 600 }}>
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>Cargando...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

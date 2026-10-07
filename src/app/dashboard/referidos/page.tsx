'use client';

import { useAuthStore } from '@/store/authStore';
import { getMockDirectReferrals } from '@/lib/mock/mockData';
import { ReferralMemberCard } from '@/components/ReferralMemberCard';
import { Users } from 'lucide-react';

export default function ReferidosPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  const directReferrals = getMockDirectReferrals(user.appUserId);
  const activeReferrals = directReferrals.filter((r) => r.status === 'al_dia');

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: 'rgba(34, 197, 94, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Users size={20} style={{ color: 'var(--status-active)' }} />
          </div>
          <h1 className="page-title" style={{ fontSize: '1.75rem' }}>MIS REFERIDOS</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Personas que se sumaron gracias a vos.
        </p>
      </div>

      {/* Estadísticas */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div
          className="animate-fade-in stagger-1"
          style={{
            flex: 1,
            padding: '1.25rem',
            background: 'var(--bg-card)',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
            }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
            {directReferrals.length}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Total referidos
          </div>
        </div>

        <div
          className="animate-fade-in stagger-2"
          style={{
            flex: 1,
            padding: '1.25rem',
            background: 'var(--status-active-bg)',
            borderRadius: '14px',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            textAlign: 'center',
            }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--status-active)', lineHeight: 1 }}>
            {activeReferrals.length}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'rgba(34, 197, 94, 0.7)', marginTop: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Al día
          </div>
        </div>

        <div
          className="animate-fade-in stagger-3"
          style={{
            flex: 1,
            padding: '1.25rem',
            background: 'var(--bg-card)',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
            }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--alvarado-accent)', lineHeight: 1 }}>
            +{activeReferrals.length}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Chances extra/mes
          </div>
        </div>
      </div>

      {/* Lista de referidos */}
      {directReferrals.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {directReferrals.map((ref, i) => (
            <ReferralMemberCard
              key={ref.appUserId}
              member={ref}
              showReferralCount
              animationDelay={i * 60}
            />
          ))}
        </div>
      ) : (
        <div
          className="card animate-fade-in stagger-4"
          style={{ textAlign: 'center', padding: '3rem' }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Todavía no tenés referidos
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Invitá a tus amigos y aumentá tus chances de ganar.
          </p>
          <a href="/dashboard/invitar" className="btn btn-primary" style={{ display: 'inline-flex' }}>
            Invitar a un amigo
          </a>
        </div>
      )}
    </div>
  );
}

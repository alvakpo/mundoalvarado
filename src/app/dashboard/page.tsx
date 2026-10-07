'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { MemberStatusBadge } from '@/components/MemberStatusBadge';
import { MEMBER_CATEGORY_LABELS } from '@/types';
import { getMockDirectReferrals } from '@/lib/mock/mockData';
import { Trophy, Users, Link as LinkIcon, ChevronRight, Ticket, Star, Gift } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  const directReferrals = getMockDirectReferrals(user.appUserId);
  const activeReferrals = directReferrals.filter((r) => r.status === 'al_dia');

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ width: 52, height: 52, position: 'relative', flexShrink: 0 }}>
          <Image src="/escudo-alvarado.webp" alt="Alvarado" fill sizes="52px" style={{ objectFit: 'contain' }} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Bienvenido
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.1 }}>
            Hola, {user.firstName}
          </h1>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {MEMBER_CATEGORY_LABELS[user.category]}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <MemberStatusBadge status={user.status} />
        </div>
      </div>

      {/* Tarjeta Hero */}
      <div
        className="animate-fade-in stagger-1"
        style={{
          background: 'var(--gradient-primary)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden',
          }}
      >
        {/* Decoración */}
        <div style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -60,
          left: '30%',
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.02)',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Star size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Programa de Beneficios
            </span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            lineHeight: 1.2,
            marginBottom: '0.75rem',
            color: 'white',
          }}>
            Ser socio tiene beneficios
          </h2>

          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Participá del Programa de Beneficios y participá por importantes premios.
          </p>

          <Link
            href="/dashboard/chances"
            className="btn btn-primary"
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white',
              display: 'inline-flex',
            }}
          >
            Ver cómo participo
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      {/* Grid de tarjetas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>

        {/* Puntos diarios: va primero porque el objetivo es que el socio
            entre todos los días. El texto es fijo a propósito: mostrar
            acá "ya reclamaste" haría que el HTML del servidor y el del
            navegador no coincidan. */}
        <Link href="/dashboard/puntos" style={{ textDecoration: 'none' }}>
          <div
            className="card card-interactive animate-fade-in stagger-2"
            style={{
              height: '100%',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Gift size={22} style={{ color: '#f59e0b' }} />
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Todos los días
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Puntos diarios
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
              Reclamá tus 100 puntos de hoy
            </div>
          </div>
        </Link>

        {/* Chances mensuales */}
        <Link href="/dashboard/chances" style={{ textDecoration: 'none' }}>
          <div
            className="card card-interactive animate-fade-in stagger-3"
            style={{ height: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'rgba(59, 111, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ticket size={22} style={{ color: 'var(--alvarado-accent)' }} />
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Premio general
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Chances mensuales
            </div>
          </div>
        </Link>

        {/* Sorteo anual */}
        <Link href="/dashboard/sorteo-anual" style={{ textDecoration: 'none' }}>
          <div
            className="card card-interactive animate-fade-in stagger-4"
            style={{ height: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'rgba(59, 111, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Trophy size={22} style={{ color: 'var(--alvarado-accent)' }} />
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Fin de año
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Sorteo anual
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
              Tus chances se acumulan mes a mes
            </div>
          </div>
        </Link>

        {/* Referidos */}
        <Link href="/dashboard/referidos" style={{ textDecoration: 'none' }}>
          <div
            className="card card-interactive animate-fade-in stagger-5"
            style={{ height: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Users size={22} style={{ color: 'var(--status-active)' }} />
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Tus referidos
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--status-active)', lineHeight: 1 }}>
                {directReferrals.length}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                ({activeReferrals.length} al día)
              </span>
            </div>
          </div>
        </Link>

        {/* Invitar */}
        <Link href="/dashboard/invitar" style={{ textDecoration: 'none' }}>
          <div
            className="card card-interactive animate-fade-in stagger-6"
            style={{ height: '100%', background: 'var(--gradient-accent)', border: '1px solid var(--border-strong)' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <LinkIcon size={22} style={{ color: 'white' }} />
              </div>
              <ChevronRight size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Compartir
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase', color: 'white' }}>
              Invitá a un amigo
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
              Código: {user.referralCode}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

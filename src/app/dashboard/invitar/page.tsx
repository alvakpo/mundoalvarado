'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getReferralUrl, copyToClipboard, shareUrl } from '@/lib/utils';
import { Link as LinkIcon, Copy, Share2, Check } from 'lucide-react';
import Image from 'next/image';

export default function InvitarPage() {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const referralUrl = getReferralUrl(user.publicAlias);

  const handleCopy = async () => {
    const success = await copyToClipboard(referralUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShare = async () => {
    await shareUrl(
      referralUrl,
      'Mundo Alvarado',
      `¡Uníte al Programa de Beneficios del Club Atlético Alvarado! Usá mi enlace:`
    );
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>

      {/* Header */}
      <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ width: 72, height: 72, position: 'relative', margin: '0 auto 1.25rem' }}>
          <Image src="/escudo-alvarado.svg" alt="Alvarado" fill style={{ objectFit: 'contain' }} />
        </div>
        <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>INVITÁ A UN AMIGO</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Compartí tu enlace personal y cuando tu amigo se una como socio,
          ¡generás chances extra para vos!
        </p>
      </div>

      {/* Código de referido */}
      <div
        className="animate-fade-in stagger-1"
        style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          padding: '2rem',
          background: 'var(--gradient-primary)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          opacity: 0,
          animationFillMode: 'forwards',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
          Tu código personal
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.5rem',
          fontWeight: 700,
          color: 'white',
          letterSpacing: '0.1em',
          marginBottom: '0.5rem',
        }}>
          {user.referralCode}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
          Código único e intransferible
        </div>
      </div>

      {/* Enlace */}
      <div
        className="card animate-fade-in stagger-2"
        style={{ marginBottom: '1.5rem', opacity: 0, animationFillMode: 'forwards' }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.875rem' }}>
          Tu enlace personal
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.875rem 1rem',
          background: 'var(--bg-elevated)',
          borderRadius: '10px',
          border: '1px solid var(--border-medium)',
          marginBottom: '1.25rem',
          overflow: 'hidden',
        }}>
          <LinkIcon size={16} style={{ color: 'var(--alvarado-accent)', flexShrink: 0 }} />
          <span style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}>
            {referralUrl}
          </span>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            id="copy-link-button"
            onClick={handleCopy}
            className={`btn btn-full ${copied ? '' : 'btn-secondary'}`}
            style={{
              flex: 1,
              ...(copied ? {
                background: 'var(--status-active-bg)',
                color: 'var(--status-active)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              } : {}),
            }}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copiado' : 'Copiar enlace'}
          </button>

          <button
            id="share-link-button"
            onClick={handleShare}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            <Share2 size={18} />
            Compartir
          </button>
        </div>
      </div>

      {/* Cómo funciona */}
      <div
        className="card animate-fade-in stagger-3"
        style={{ opacity: 0, animationFillMode: 'forwards' }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>
          Cómo funciona
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { step: '1', title: 'Compartís tu enlace', desc: 'Mandás el enlace a tu amigo por WhatsApp, Instagram o como quieras.' },
            { step: '2', title: 'Tu amigo se une', desc: 'Se registra usando tu enlace y queda vinculado a tu red.' },
            { step: '3', title: 'Generás chances', desc: 'Mientras tu amigo esté al día, genera +1 chance por mes para vos.' },
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
    </div>
  );
}

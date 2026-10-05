'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { MemberStatusBadge } from '@/components/MemberStatusBadge';
import { MemberAvatar } from '@/components/MemberAvatar';
import { MEMBER_CATEGORY_LABELS } from '@/types';
import { getReferralUrl, copyToClipboard } from '@/lib/utils';
import { Hash, Phone, Mail, Link as LinkIcon, Edit2, Check, Copy } from 'lucide-react';

export default function CuentaPage() {
  const { user, setUser } = useAuthStore();
  const [editingAlias, setEditingAlias] = useState(false);
  const [newAlias, setNewAlias] = useState(user?.publicAlias ?? '');
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const referralUrl = getReferralUrl(user.publicAlias);

  const handleSaveAlias = () => {
    if (newAlias.trim() && newAlias !== user.publicAlias) {
      // En mock, actualizamos el store
      const cleanAlias = newAlias.toLowerCase().replace(/[^a-z0-9]/g, '');
      setUser({ ...user, publicAlias: cleanAlias });
    }
    setEditingAlias(false);
  };

  const handleCopyLink = async () => {
    await copyToClipboard(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 700, margin: '0 auto' }}>

      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>MI CUENTA</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Tu información como socio de Mundo Alvarado.
        </p>
      </div>

      {/* Tarjeta de perfil */}
      <div
        className="animate-fade-in stagger-1"
        style={{
          background: 'var(--gradient-primary)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255,255,255,0.1)',
          opacity: 0,
          animationFillMode: 'forwards',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <MemberAvatar member={user} size="xl" showStatus />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.1 }}>
              {user.firstName} {user.lastName}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem', marginTop: '4px' }}>
              {MEMBER_CATEGORY_LABELS[user.category]}
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <MemberStatusBadge status={user.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Datos del socio */}
      <div
        className="card animate-fade-in stagger-2"
        style={{ marginBottom: '1rem', opacity: 0, animationFillMode: 'forwards' }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>
          Datos del socio
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {user.memberNumber && (
            <DataRow
              icon={<Hash size={16} />}
              label="Número de socio"
              value={`#${user.memberNumber}`}
            />
          )}

          {user.phone && (
            <DataRow
              icon={<Phone size={16} />}
              label="Celular"
              value={user.phone}
            />
          )}

          {user.email && (
            <DataRow
              icon={<Mail size={16} />}
              label="Email"
              value={user.email}
            />
          )}
        </div>
      </div>

      {/* Datos del programa */}
      <div
        className="card animate-fade-in stagger-3"
        style={{ opacity: 0, animationFillMode: 'forwards' }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>
          Programa de beneficios
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Código de referido */}
          <DataRow
            icon={<Hash size={16} />}
            label="Código de referido"
            value={
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--alvarado-accent)',
                letterSpacing: '0.05em',
              }}>
                {user.referralCode}
              </span>
            }
          />

          {/* Alias público */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LinkIcon size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Alias público</div>
              {editingAlias ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    className="input"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveAlias()}
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.9375rem' }}
                    autoFocus
                  />
                  <button onClick={handleSaveAlias} className="btn btn-primary btn-sm">
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>/{user.publicAlias}</span>
                  <button
                    onClick={() => setEditingAlias(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', display: 'flex' }}
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Enlace */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LinkIcon size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Tu enlace de referido</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {referralUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--status-active)' : 'var(--text-muted)', padding: '4px', borderRadius: '6px', display: 'flex', flexShrink: 0 }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Nota sobre Brío */}
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
        <strong style={{ color: 'var(--text-secondary)' }}>Nota:</strong> La información de tu categoría y estado como socio es gestionada por el sistema oficial del Club (Brío).
        Para modificaciones en tus datos societarios, comunicate directamente con la administración del Club.
      </div>
    </div>
  );
}

function DataRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
      <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text-muted)' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}

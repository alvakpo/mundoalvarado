'use client';

import { ChanceBreakdownItem } from '@/types';

interface ChanceBreakdownProps {
  breakdown: ChanceBreakdownItem[];
  total: number;
  title?: string;
}

export function ChanceBreakdown({ breakdown, total, title = 'Desglose' }: ChanceBreakdownProps) {
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      borderRadius: '12px',
      padding: '1.25rem',
      border: '1px solid var(--border-subtle)',
    }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>
        {title}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {breakdown.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0',
              borderBottom: i < breakdown.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {item.reason}
              </div>
            </div>
            <div style={{
              minWidth: 32,
              height: 32,
              borderRadius: '8px',
              background: item.chances > 0 ? 'rgba(59, 111, 212, 0.15)' : 'var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1rem',
              color: item.chances > 0 ? 'var(--alvarado-accent)' : 'var(--text-muted)',
            }}>
              {item.chances > 0 ? `+${item.chances}` : '0'}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border-medium)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.9375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          TOTAL
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}>
          {total}
        </div>
      </div>
    </div>
  );
}

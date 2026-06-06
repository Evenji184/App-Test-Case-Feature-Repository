import type { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '100dvh',
        padding: 16,
        background:
          'radial-gradient(ellipse 100% 45% at 50% 0%, rgba(46, 72, 180, 0.32) 0%, transparent 68%), #080a12',
      }}
    >
      <div
        style={{
          width: 'min(100%, 400px)',
          background: '#0e1220',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '32px 20px 28px',
          boxShadow:
            '0 0 0 1px rgba(92, 120, 255, 0.07), 0 24px 64px rgba(0, 0, 0, 0.65)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="app-shell"
      style={{
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        background: 'linear-gradient(180deg, #e6f4ff 0%, #f5f7fb 100%)',
      }}
    >
      <div className="card-section" style={{ width: 'min(100%, 420px)', padding: 20 }}>
        {children}
      </div>
    </div>
  );
}

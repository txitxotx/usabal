'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, alerts } = useApp();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const unresolvedDanger = alerts.filter(a => !a.resolved && a.type === 'danger').length;

  useEffect(() => {
    if (!currentUser) router.replace('/login');
  }, [currentUser, router]);

  if (!currentUser) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="main-content">
        {/* Topbar */}
        <header style={{ height: '56px', background: '#fff', borderBottom: '1px solid #e2eaf4', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px', position: 'sticky', top: 0, zIndex: 50 }}>
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
            className="mobile-menu-btn"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 5h16M2 10h16M2 15h16" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>

          <div style={{ flex: 1 }} />

          {/* Alert badge */}
          {unresolvedDanger > 0 && (
            <button
              onClick={() => router.push('/dashboard/alertas')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#991b1b' }}
            >
              <span style={{ width: '6px', height: '6px', background: '#dc2626', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
              {unresolvedDanger} alerta{unresolvedDanger > 1 ? 's' : ''} crítica{unresolvedDanger > 1 ? 's' : ''}
            </button>
          )}

          {/* Date */}
          <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </header>

        <main style={{ flex: 1, padding: '24px 24px 40px' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .main-content { margin-left: 0 !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

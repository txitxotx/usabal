'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import Sidebar from '@/components/Sidebar';
import LoadingWrapper from '@/components/LoadingWrapper';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, alerts, loading } = useApp();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const unresolvedDanger = alerts.filter(a => !a.resolved && a.type === 'danger').length;

  useEffect(() => {
    if (!loading && !currentUser) router.replace('/login');
  }, [currentUser, router, loading]);

  // Restaurar preferencia guardada
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aquadash-dark');
      if (saved === '1') setDark(true);
    } catch { /* ignorar */ }
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    try { localStorage.setItem('aquadash-dark', next ? '1' : '0'); } catch { /* ignorar */ }
  };

  if (loading || !currentUser) return <LoadingWrapper />;

  return (
    <div
      data-theme={dark ? 'dark' : 'light'}
      style={{
        display: 'flex', minHeight: '100vh',
        background: dark ? '#0d1117' : '#f0f4f8',
        color: dark ? '#e2e8f0' : '#1a2332',
      }}
    >
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} dark={dark} />
      <div style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="main-content">
        <header style={{
          height: '56px',
          background: dark ? '#161b22' : '#fff',
          borderBottom: `1px solid ${dark ? '#30363d' : '#e2eaf4'}`,
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
            className="mobile-menu-btn"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 5h16M2 10h16M2 15h16" stroke={dark ? '#8b949e' : '#64748b'} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
          <div style={{ flex: 1 }} />
          {unresolvedDanger > 0 && (
            <button
              onClick={() => router.push('/dashboard/alertas')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#991b1b' }}
            >
              <span style={{ width: '6px', height: '6px', background: '#dc2626', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
              {unresolvedDanger} alerta{unresolvedDanger > 1 ? 's' : ''} crítica{unresolvedDanger > 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={toggleDark}
            title={dark ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
            style={{
              background: dark ? '#21262d' : '#f1f5f9',
              border: `1px solid ${dark ? '#30363d' : '#e2eaf4'}`,
              borderRadius: '20px', padding: '5px 13px', cursor: 'pointer',
              fontSize: '13px', color: dark ? '#e2e8f0' : '#334155',
              display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500',
            }}
          >
            {dark ? '☀️ Día' : '🌙 Noche'}
          </button>
          <span style={{ fontSize: '12px', color: dark ? '#6e7681' : '#94a3b8', whiteSpace: 'nowrap' }}>
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
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        /* Dark mode via data-theme en vez de body.dark */
        [data-theme="dark"] .card { background: #161b22; border-color: #30363d; box-shadow: 0 1px 3px rgba(0,0,0,0.4); }
        [data-theme="dark"] .metric-card { background: #161b22; border-color: #30363d; }
        [data-theme="dark"] .metric-label { color: #6e7681; }
        [data-theme="dark"] .metric-value { color: #e2e8f0; }
        [data-theme="dark"] .metric-sub { color: #8b949e; }
        [data-theme="dark"] .data-table th { background: #1c2128; color: #8b949e; border-color: #30363d; }
        [data-theme="dark"] .data-table td { color: #c9d1d9; border-color: #21262d; }
        [data-theme="dark"] .data-table tr:hover td { background: #1c2128; }
        [data-theme="dark"] .input-field { background: #1c2128; border-color: #30363d; color: #e2e8f0; }
        [data-theme="dark"] .input-field:focus { border-color: #58a6ff; }
        [data-theme="dark"] .btn-secondary { background: #21262d; color: #c9d1d9; border-color: #30363d; }
        [data-theme="dark"] .btn-secondary:hover { background: #30363d; }
        [data-theme="dark"] .sidebar-link { color: #8b949e; }
        [data-theme="dark"] .sidebar-link:hover { background: #21262d; color: #58a6ff; }
        [data-theme="dark"] .sidebar-link.active { background: #1f3358; color: #58a6ff; }
        [data-theme="dark"] .alert-danger  { background: #3d1515; border-color: #8b1a1a; color: #fca5a5; }
        [data-theme="dark"] .alert-warning { background: #3d2e00; border-color: #b45309; color: #fcd34d; }
        [data-theme="dark"] .alert-info    { background: #1a2d4d; border-color: #1e40af; color: #93c5fd; }
        [data-theme="dark"] .badge-ok      { background: #1a3a2a; color: #4ade80; }
        [data-theme="dark"] .badge-danger  { background: #3d1515; color: #fca5a5; }
        [data-theme="dark"] .badge-warning { background: #3d2e00; color: #fcd34d; }
        [data-theme="dark"] .badge-info    { background: #1a2d4d; color: #93c5fd; }
        [data-theme="dark"] .badge-gray    { background: #21262d; color: #8b949e; }
        [data-theme="dark"] h1, [data-theme="dark"] h2, [data-theme="dark"] h3 { color: #e2e8f0; }
        [data-theme="dark"] p { color: #8b949e; }
        [data-theme="dark"] strong { color: #c9d1d9; }
        [data-theme="dark"] select.input-field option { background: #1c2128; }
      `}</style>
    </div>
  );
}

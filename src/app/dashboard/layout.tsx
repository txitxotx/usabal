'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { LangProvider, useLang } from '@/lib/langContext';
import Sidebar from '@/components/Sidebar';
import LoadingWrapper from '@/components/LoadingWrapper';

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { currentUser, alerts, loading } = useApp();
  const { lang, setLang, t } = useLang();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const unresolvedDanger = alerts.filter(a => !a.resolved && a.type === 'danger').length;

  useEffect(() => {
    if (!loading && !currentUser) router.replace('/login');
  }, [currentUser, router, loading]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aquadash-dark');
      if (saved === '1') setDark(true);
    } catch { /* ignorar */ }
  }, []);

  // Aplicar dark al html/body para cubrir el overscroll en móvil
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (dark) {
      root.setAttribute('data-theme', 'dark');
      body.setAttribute('data-theme', 'dark');
      body.style.background = '#0d1117';
    } else {
      root.removeAttribute('data-theme');
      body.removeAttribute('data-theme');
      body.style.background = '#f0f4f8';
    }
  }, [dark]);

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
        display: 'flex',
        minHeight: '100vh',
        minWidth: 0,
        background: dark ? '#0d1117' : '#f0f4f8',
        color: dark ? '#e2e8f0' : '#1a2332',
      }}
    >
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} dark={dark} />
      <div
        style={{
          flex: 1,
          marginLeft: '240px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
          overflow: 'hidden',
        }}
        className="main-content"
      >
        {/* ── HEADER ── */}
        <header style={{
          height: '56px',
          background: dark ? '#161b22' : '#fff',
          borderBottom: `1px solid ${dark ? '#30363d' : '#e2eaf4'}`,
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px',
          position: 'sticky', top: 0, zIndex: 50, flexShrink: 0,
        }}>
          {/* Botón menú móvil */}
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', flexShrink: 0 }}
            className="mobile-menu-btn"
            aria-label="Abrir menú"
          >
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <path d="M2 5h16M2 10h16M2 15h16" stroke={dark ? '#8b949e' : '#64748b'} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>

          <div style={{ flex: 1 }} />

          {/* Alerta crítica */}
          {unresolvedDanger > 0 && (
            <button
              onClick={() => router.push('/dashboard/alertas')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#991b1b', flexShrink: 0 }}
            >
              <span style={{ width: '6px', height: '6px', background: '#dc2626', borderRadius: '50%', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
              <span className="hide-mobile">{unresolvedDanger} {unresolvedDanger > 1 ? t('critical_alerts') : t('critical_alert')}</span>
              <span className="show-mobile">⚠ {unresolvedDanger}</span>
            </button>
          )}

          {/* ── SELECTOR DE IDIOMA ── */}
          <div style={{ display: 'flex', gap: '2px', background: dark ? '#21262d' : '#f1f5f9', border: `1px solid ${dark ? '#30363d' : '#e2eaf4'}`, borderRadius: '20px', padding: '3px', flexShrink: 0 }}>
            {(['es', 'eu'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                title={l === 'es' ? 'Español' : 'Euskera'}
                style={{
                  padding: '3px 10px',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '700',
                  letterSpacing: '0.03em',
                  background: lang === l
                    ? (dark ? '#388bfd' : '#0057a8')
                    : 'transparent',
                  color: lang === l
                    ? '#fff'
                    : (dark ? '#8b949e' : '#64748b'),
                  transition: 'all 0.15s',
                }}
              >
                {l === 'es' ? 'ES' : 'EU'}
              </button>
            ))}
          </div>

          {/* Botón modo oscuro */}
          <button
            onClick={toggleDark}
            title={dark ? t('day_mode') : t('night_mode')}
            style={{
              background: dark ? '#21262d' : '#f1f5f9',
              border: `1px solid ${dark ? '#30363d' : '#e2eaf4'}`,
              borderRadius: '20px', padding: '5px 12px', cursor: 'pointer',
              fontSize: '13px', color: dark ? '#e2e8f0' : '#334155',
              display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500',
              flexShrink: 0,
            }}
          >
            {dark ? '☀️' : '🌙'}
            <span className="hide-mobile">{dark ? t('day_mode') : t('night_mode')}</span>
          </button>

          {/* Fecha — solo desktop */}
          <span className="hide-mobile" style={{ fontSize: '12px', color: dark ? '#6e7681' : '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {new Date().toLocaleDateString(lang === 'eu' ? 'es-ES' : 'es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </header>

        {/* ── CONTENIDO ── */}
        <main style={{ flex: 1, padding: '20px 16px 40px', minWidth: 0, overflow: 'hidden' }}>
          {children}
        </main>
      </div>

      <style>{`
        /* ── Mobile ─────────────────────────────────────────────── */
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
          }
          .mobile-menu-btn { display: flex !important; }
          .hide-mobile { display: none !important; }
          .show-mobile { display: inline !important; }
          main { padding: 14px 12px 32px !important; overflow-x: hidden !important; }
          main > div { max-width: 100% !important; overflow-x: hidden !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }

        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        /* ── Dark mode ───────────────────────────────────────────── */
        html[data-theme="dark"], body[data-theme="dark"] {
          background: #0d1117 !important;
          color: #e2e8f0 !important;
        }
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
        [data-theme="dark"] .btn-primary { background: #1f6feb; color: #fff; }
        [data-theme="dark"] .btn-primary:hover { background: #388bfd; }
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
        [data-theme="dark"] h1,[data-theme="dark"] h2,[data-theme="dark"] h3 { color: #e2e8f0; }
        [data-theme="dark"] p { color: #8b949e; }
        [data-theme="dark"] strong { color: #c9d1d9; }
        [data-theme="dark"] select.input-field option { background: #1c2128; }
        [data-theme="dark"] header { background: #161b22 !important; border-color: #30363d !important; }
        [data-theme="dark"] aside  { background: #161b22 !important; border-color: #30363d !important; }
        [data-theme="dark"] .main-content { background: #0d1117; }
      `}</style>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <DashboardInner>{children}</DashboardInner>
    </LangProvider>
  );
}

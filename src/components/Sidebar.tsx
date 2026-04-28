'use client';
// src/components/Sidebar.tsx

import { useApp } from '@/lib/store';
import { useLang } from '@/lib/langContext';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  dark?: boolean;
}

export default function Sidebar({ open, onClose, dark = false }: SidebarProps) {
  const { currentUser, hasPermission, logout, alerts } = useApp();
  const { t, lang } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const unresolvedAlerts = alerts.filter(a => !a.resolved && a.type === 'danger').length;

  const NAV_ITEMS = [
    { labelKey: 'nav_panel',        path: '/dashboard',                  icon: '⊞', perm: null },
    { labelKey: 'nav_piscinas',     path: '/dashboard/piscinas',         icon: '🏊', perm: 'view_piscinas' },
    { labelKey: 'nav_recirculacion',path: '/dashboard/recirculacion',    icon: '🔄', perm: 'view_recirculacion' },
    { labelKey: 'nav_contadores',   path: '/dashboard/contadores',       icon: '📊', perm: 'view_contadores' },
    { labelKey: 'nav_legionella',   path: '/dashboard/legionella',       icon: '🧫', perm: 'view_legionella' },
    { labelKey: 'nav_incendios',    path: '/dashboard/incendios',        icon: '🔥', perm: 'view_incendios' },
    { labelKey: 'nav_alertas',      path: '/dashboard/alertas',          icon: '🔔', perm: 'view_alerts' },
    { labelKey: 'nav_usuarios',     path: '/dashboard/usuarios',         icon: '👥', perm: 'manage_users' },
  ] as const;

  const bg        = dark ? '#161b22' : '#fff';
  const border    = dark ? '#30363d' : '#e2eaf4';
  const textMuted = dark ? '#8b949e' : '#94a3b8';
  const textMain  = dark ? '#e2e8f0' : '#0f1f3d';

  const handleNav = (path: string) => { router.push(path); onClose(); };

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
          className="md:hidden"
        />
      )}

      <aside
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: '240px',
          background: bg, borderRight: `1px solid ${border}`,
          zIndex: 100, display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : undefined,
          transition: 'transform 0.3s ease',
        }}
        className={`sidebar ${open ? 'open' : ''}`}
      >
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: '#0057a8', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3 C7 3 5 6 5 10 C5 14 7 17 10 17 C13 17 15 14 15 10" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                <circle cx="10" cy="10" r="2" fill="#fff"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: textMain }}>Aqua Dashboard</p>
              <p style={{ margin: 0, fontSize: '11px', color: textMuted }}>2026</p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          <p style={{
            fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em',
            color: dark ? '#484f58' : '#cbd5e1',
            padding: '0 8px', marginBottom: '6px', textTransform: 'uppercase',
          }}>
            {t('nav_menu')}
          </p>
          {NAV_ITEMS.map(item => {
            if (item.perm && !hasPermission(item.perm as any)) return null;
            const isActive = pathname === item.path;
            const label = t(item.labelKey as any);
            return (
              <button
                key={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => handleNav(item.path)}
              >
                <span style={{ fontSize: '15px' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{label}</span>
                {item.labelKey === 'nav_alertas' && unresolvedAlerts > 0 && (
                  <span style={{
                    background: '#dc2626', color: '#fff',
                    borderRadius: '10px', padding: '1px 6px',
                    fontSize: '11px', fontWeight: '700',
                  }}>
                    {unresolvedAlerts}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Usuario */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: '#0057a8', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#fff',
            }}>
              {currentUser?.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser?.name}
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: textMuted, textTransform: 'capitalize' }}>
                {currentUser?.role}
              </p>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
            onClick={() => { logout(); router.push('/login'); }}
          >
            {t('logout')}
          </button>
        </div>
      </aside>
    </>
  );
}

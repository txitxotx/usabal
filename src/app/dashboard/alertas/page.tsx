'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';

const SECTION_LABELS: Record<string, string> = {
  piscinas: '🏊 Piscinas', legionella: '🧫 Legionella', contadores: '📊 Contadores', incendios: '🔥 Incendios',
};

export default function AlertasPage() {
  const { hasPermission, alerts, resolveAlert } = useApp();
  const [filter, setFilter] = useState<'all' | 'danger' | 'warning' | 'resolved'>('all');
  const [sectionFilter, setSectionFilter] = useState('');

  if (!hasPermission('view_alerts')) {
    return <div className="alert-banner alert-danger"><span>⛔</span> Sin permiso.</div>;
  }

  const filtered = alerts.filter(a => {
    if (filter === 'resolved') return a.resolved;
    if (filter === 'danger') return !a.resolved && a.type === 'danger';
    if (filter === 'warning') return !a.resolved && a.type === 'warning';
    return !a.resolved;
  }).filter(a => !sectionFilter || a.section === sectionFilter);

  const counts = {
    danger: alerts.filter(a => !a.resolved && a.type === 'danger').length,
    warning: alerts.filter(a => !a.resolved && a.type === 'warning').length,
    resolved: alerts.filter(a => a.resolved).length,
  };

  const sections = Array.from(new Set(alerts.map(a => a.section)));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f1f3d', margin: '0 0 4px' }}>🔔 Alertas y Notificaciones</h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Valores fuera de rango detectados automáticamente</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="metric-card" style={{ borderTop: '3px solid #ef4444' }}>
          <div className="metric-label">Críticas</div>
          <div className="metric-value" style={{ fontSize: '28px', color: '#dc2626' }}>{counts.danger}</div>
          <div className="metric-sub">activas</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #f59e0b' }}>
          <div className="metric-label">Avisos</div>
          <div className="metric-value" style={{ fontSize: '28px', color: '#d97706' }}>{counts.warning}</div>
          <div className="metric-sub">activos</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #22c55e' }}>
          <div className="metric-label">Resueltas</div>
          <div className="metric-value" style={{ fontSize: '28px', color: '#15803d' }}>{counts.resolved}</div>
          <div className="metric-sub">gestionadas</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          {[
            { key: 'all', label: `Activas (${counts.danger + counts.warning})` },
            { key: 'danger', label: `Críticas (${counts.danger})` },
            { key: 'warning', label: `Avisos (${counts.warning})` },
            { key: 'resolved', label: `Resueltas (${counts.resolved})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)} style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', background: filter === f.key ? '#fff' : 'transparent', color: filter === f.key ? '#0f1f3d' : '#64748b', boxShadow: filter === f.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {f.label}
            </button>
          ))}
        </div>
        <select className="input-field" style={{ width: 'auto' }} value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
          <option value="">Todas las secciones</option>
          {sections.map(s => <option key={s} value={s}>{SECTION_LABELS[s] || s}</option>)}
        </select>
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
          <p style={{ fontSize: '15px', fontWeight: '500' }}>Sin alertas en esta categoría</p>
          <p style={{ fontSize: '13px' }}>Todos los valores están dentro del rango permitido</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(a => (
            <div
              key={a.id}
              className="card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                borderLeft: `4px solid ${a.resolved ? '#e2eaf4' : a.type === 'danger' ? '#ef4444' : a.type === 'warning' ? '#f59e0b' : '#60a5fa'}`,
                opacity: a.resolved ? 0.65 : 1,
              }}
            >
              <span style={{ fontSize: '20px', flex: 'none' }}>
                {a.resolved ? '✅' : a.type === 'danger' ? '🚨' : '⚠️'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '14px', color: '#0f1f3d' }}>{a.message}</strong>
                  <span className={`badge ${a.type === 'danger' ? 'badge-danger' : a.type === 'warning' ? 'badge-warning' : 'badge-info'}`}>
                    {a.type === 'danger' ? 'Crítica' : a.type === 'warning' ? 'Aviso' : 'Info'}
                  </span>
                  <span className="badge badge-gray">{SECTION_LABELS[a.section] || a.section}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {a.value !== undefined && (
                    <span>Valor registrado: <strong style={{ color: '#0f1f3d' }}>{a.value}</strong></span>
                  )}
                  {a.threshold && (
                    <span>Límite: <strong style={{ color: '#0f1f3d' }}>{a.threshold}</strong></span>
                  )}
                  <span>Fecha: {a.timestamp}</span>
                </div>
              </div>
              {!a.resolved && hasPermission('view_alerts') && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => resolveAlert(a.id)}
                  style={{ flex: 'none', whiteSpace: 'nowrap' }}
                >
                  Resolver
                </button>
              )}
              {a.resolved && (
                <span className="badge badge-ok" style={{ flex: 'none' }}>Resuelta</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

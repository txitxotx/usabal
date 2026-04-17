'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';

const SECTION_LABELS: Record<string, string> = {
  piscinas: '🏊 Piscinas', legionella: '🧫 Legionella', contadores: '📊 Contadores', incendios: '🔥 Incendios',
};

export default function AlertasPage() {
  const { hasPermission, alerts, alertHistory, resolveAlert, currentUser } = useApp();
  const [filter, setFilter] = useState<'all' | 'danger' | 'warning' | 'resolved'>('all');
  const [sectionFilter, setSectionFilter] = useState('');
  const [poolFilter, setPoolFilter] = useState('');
  const [tab, setTab] = useState<'activas' | 'historico'>('activas');
  const [resolveModal, setResolveModal] = useState<{ id: string; message: string; currentValue?: number | string } | null>(null);
  const [newValue, setNewValue] = useState('');

  if (!hasPermission('view_alerts')) {
    return <div className="alert-banner alert-danger"><span>⛔</span> Sin permiso.</div>;
  }

  const filtered = alerts.filter(a => {
    if (filter === 'resolved') return a.resolved;
    if (filter === 'danger') return !a.resolved && a.type === 'danger';
    if (filter === 'warning') return !a.resolved && a.type === 'warning';
    return !a.resolved;
  })
    .filter(a => !sectionFilter || a.section === sectionFilter)
    .filter(a => !poolFilter || a.pool === poolFilter);

  const counts = {
    danger: alerts.filter(a => !a.resolved && a.type === 'danger').length,
    warning: alerts.filter(a => !a.resolved && a.type === 'warning').length,
    resolved: alerts.filter(a => a.resolved).length,
  };

  const sections = Array.from(new Set(alerts.map(a => a.section)));
  const pools = Array.from(new Set(alerts.filter(a => a.pool).map(a => a.pool as string)));

  // History grouped by pool
  const historyByPool: Record<string, typeof alertHistory> = {};
  for (const a of alertHistory) {
    const key = a.pool || a.section;
    if (!historyByPool[key]) historyByPool[key] = [];
    historyByPool[key].push(a);
  }

  const handleResolve = () => {
    if (!resolveModal || !newValue.trim()) return;
    resolveAlert(resolveModal.id, newValue, currentUser?.name || 'Admin');
    setResolveModal(null);
    setNewValue('');
  };

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
        <div className="metric-card" style={{ borderTop: '3px solid #6366f1' }}>
          <div className="metric-label">Historial total</div>
          <div className="metric-value" style={{ fontSize: '28px', color: '#4f46e5' }}>{alertHistory.length}</div>
          <div className="metric-sub">registros</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {(['activas', 'historico'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0f1f3d' : '#64748b', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
            {t === 'activas' ? '🔔 Activas' : '📚 Histórico por piscina'}
          </button>
        ))}
      </div>

      {tab === 'activas' && (
        <>
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
            {pools.length > 0 && (
              <select className="input-field" style={{ width: 'auto' }} value={poolFilter} onChange={e => setPoolFilter(e.target.value)}>
                <option value="">Todas las piscinas</option>
                {pools.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
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
                <div key={a.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px', borderLeft: `4px solid ${a.resolved ? '#e2eaf4' : a.type === 'danger' ? '#ef4444' : a.type === 'warning' ? '#f59e0b' : '#60a5fa'}`, opacity: a.resolved ? 0.75 : 1 }}>
                  <span style={{ fontSize: '20px', flex: 'none' }}>{a.resolved ? '✅' : a.type === 'danger' ? '🚨' : '⚠️'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px', color: '#0f1f3d' }}>{a.message}</strong>
                      <span className={`badge ${a.type === 'danger' ? 'badge-danger' : a.type === 'warning' ? 'badge-warning' : 'badge-info'}`}>
                        {a.type === 'danger' ? 'Crítica' : a.type === 'warning' ? 'Aviso' : 'Info'}
                      </span>
                      <span className="badge badge-gray">{SECTION_LABELS[a.section] || a.section}</span>
                      {a.pool && <span className="badge badge-gray">🏊 {a.pool}</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {a.value !== undefined && (
                        <span>Valor registrado: <strong style={{ color: '#0f1f3d' }}>{a.value}</strong></span>
                      )}
                      {a.resolved && a.resolvedValue !== undefined && (
                        <span>✅ Nuevo valor: <strong style={{ color: '#15803d' }}>{a.resolvedValue}</strong></span>
                      )}
                      {a.threshold && <span>Límite: <strong style={{ color: '#0f1f3d' }}>{a.threshold}</strong></span>}
                      <span>Fecha: {a.timestamp}</span>
                      {a.resolved && a.resolvedBy && <span>Resuelto por: <strong>{a.resolvedBy}</strong></span>}
                    </div>
                  </div>
                  {!a.resolved && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setResolveModal({ id: a.id, message: a.message, currentValue: a.value }); setNewValue(''); }} style={{ flex: 'none', whiteSpace: 'nowrap' }}>
                      Resolver
                    </button>
                  )}
                  {a.resolved && <span className="badge badge-ok" style={{ flex: 'none' }}>Resuelta</span>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'historico' && (
        <div>
          {Object.keys(historyByPool).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <p style={{ fontSize: '15px', fontWeight: '500' }}>Sin historial aún</p>
              <p style={{ fontSize: '13px' }}>Las alertas resueltas aparecerán aquí agrupadas por piscina</p>
            </div>
          ) : (
            Object.entries(historyByPool).map(([pool, poolAlerts]) => (
              <div key={pool} className="card" style={{ marginBottom: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f1f3d' }}>🏊 {pool}</h3>
                  <span className="badge badge-gray">{poolAlerts.length} incidencias</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Incidencia</th>
                        <th>Valor original</th>
                        <th>Límite</th>
                        <th>Valor corregido</th>
                        <th>Resuelto por</th>
                        <th>Fecha resolución</th>
                      </tr>
                    </thead>
                    <tbody>
                      {poolAlerts.map(a => (
                        <tr key={a.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>{a.timestamp}</td>
                          <td>{a.message}</td>
                          <td className="val-danger" style={{ fontFamily: 'var(--font-mono)' }}>{a.value ?? '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: '#64748b' }}>{a.threshold ?? '—'}</td>
                          <td className="val-ok" style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{a.resolvedValue ?? '—'}</td>
                          <td>{a.resolvedBy ?? '—'}</td>
                          <td style={{ whiteSpace: 'nowrap', color: '#64748b' }}>{a.resolvedAt ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Resolve modal */}
      {resolveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '440px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f1f3d', marginBottom: '8px' }}>Resolver incidencia</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>{resolveModal.message}</p>
            {resolveModal.currentValue !== undefined && (
              <p style={{ fontSize: '13px', marginBottom: '16px' }}>
                Valor problemático: <strong style={{ color: '#dc2626' }}>{resolveModal.currentValue}</strong>
              </p>
            )}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Nuevo valor corregido *
              </label>
              <input
                className="input-field"
                type="text"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder="Introduce el valor tras la corrección"
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setResolveModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleResolve} disabled={!newValue.trim()}>
                ✅ Confirmar resolución
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

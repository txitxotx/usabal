'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';

const SECTION_LABELS: Record<string, string> = {
  piscinas: '🏊 Piscinas', legionella: '🧫 Legionella', contadores: '📊 Contadores', incendios: '🔥 Incendios',
};

const PARAM_LABELS: Record<string, string> = {
  cloroLibre: 'Cloro libre (mg/L)', cloroCombinado: 'Cloro combinado (mg/L)',
  ph: 'pH', temperatura: 'Temperatura (°C)', turbidez: 'Turbidez (NTU)', co2Delta: 'ΔCO₂ (ppm)',
};

export default function AlertasPage() {
  const { hasPermission, alerts, alertHistory, alertRepairs, resolveAlertWithRepair, currentUser } = useApp();
  const [filter, setFilter] = useState<'all' | 'danger' | 'warning' | 'resolved'>('all');
  const [sectionFilter, setSectionFilter] = useState('');
  const [tab, setTab] = useState<'activas' | 'historico' | 'reparaciones'>('activas');
  const [resolveModal, setResolveModal] = useState<{
    id: string; message: string; currentValue?: number | string;
    pool?: string; paramDate?: string; paramSession?: string; parameterKey?: string;
  } | null>(null);
  const [correctedValue, setCorrectedValue] = useState('');
  const [saveRepair, setSaveRepair] = useState(true); // whether to also overwrite the stored measurement
  const [saving, setSaving] = useState(false);

  if (!hasPermission('view_alerts')) {
    return <div className="alert-banner alert-danger"><span>⛔</span> Sin permiso.</div>;
  }

  const filtered = alerts
    .filter(a => {
      if (filter === 'danger')  return !a.resolved && a.type === 'danger';
      if (filter === 'warning') return !a.resolved && a.type === 'warning';
      return !a.resolved;
    })
    .filter(a => !sectionFilter || a.section === sectionFilter);

  const counts = {
    danger:   alerts.filter(a => !a.resolved && a.type === 'danger').length,
    warning:  alerts.filter(a => !a.resolved && a.type === 'warning').length,
    resolved: alertHistory.length,
  };

  const historyByPool: Record<string, typeof alertHistory> = {};
  for (const a of alertHistory) {
    const key = a.pool || a.section;
    if (!historyByPool[key]) historyByPool[key] = [];
    historyByPool[key].push(a);
  }

  const handleResolve = async () => {
    if (!resolveModal || !correctedValue.trim()) return;
    setSaving(true);
    try {
      const numVal = parseFloat(correctedValue);
      const repair = (saveRepair && resolveModal.paramDate && resolveModal.paramSession && resolveModal.parameterKey && resolveModal.pool && !isNaN(numVal))
        ? {
            date: resolveModal.paramDate,
            session: resolveModal.paramSession,
            pool: resolveModal.pool,
            paramKey: resolveModal.parameterKey,
            oldValue: typeof resolveModal.currentValue === 'number' ? resolveModal.currentValue : parseFloat(String(resolveModal.currentValue ?? '')),
            correctedValue: numVal,
          }
        : undefined;

      await resolveAlertWithRepair(
        resolveModal.id, correctedValue, currentUser?.name || 'Admin', repair
      );
      setResolveModal(null);
      setCorrectedValue('');
    } catch (e) {
      console.error(e);
      alert('Error al guardar la reparación.');
    } finally {
      setSaving(false);
    }
  };

  const hasRepairData = resolveModal?.paramDate && resolveModal?.paramSession && resolveModal?.parameterKey && resolveModal?.pool;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f1f3d', margin: '0 0 4px' }}>🔔 Alertas y Notificaciones</h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Valores fuera de rango detectados automáticamente · Corrección y trazabilidad de incidencias</p>
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
          <div className="metric-label">Reparaciones</div>
          <div className="metric-value" style={{ fontSize: '28px', color: '#4f46e5' }}>{alertRepairs.length}</div>
          <div className="metric-sub">con valor corregido</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {(['activas', 'historico', 'reparaciones'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0f1f3d' : '#64748b', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
            {t === 'activas' ? `⚡ Activas (${counts.danger + counts.warning})` : t === 'historico' ? '📋 Historial' : `🔧 Reparaciones (${alertRepairs.length})`}
          </button>
        ))}
      </div>

      {/* ── ALERTAS ACTIVAS ── */}
      {tab === 'activas' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {([['all','Todas'], ['danger','Críticas'], ['warning','Avisos']] as const).map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val)}
                style={{ padding: '6px 14px', borderRadius: '20px', border: `2px solid ${filter === val ? (val === 'danger' ? '#ef4444' : val === 'warning' ? '#f59e0b' : '#0077cc') : '#e2eaf4'}`, background: filter === val ? (val === 'danger' ? '#fee2e2' : val === 'warning' ? '#fef3c7' : '#dbeafe') : '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                {lbl}
              </button>
            ))}
            <select className="input-field" style={{ width: 'auto', fontSize: '12px' }} value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
              <option value="">Todas las secciones</option>
              {Object.entries(SECTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ fontSize: '36px', margin: '0 0 12px' }}>✅</p>
              <p style={{ fontSize: '15px', fontWeight: '600', color: '#0f1f3d', margin: '0 0 4px' }}>Sin alertas activas</p>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Todos los parámetros están dentro de los rangos establecidos</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map(a => (
                <div key={a.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px', borderLeft: `4px solid ${a.type === 'danger' ? '#ef4444' : '#f59e0b'}` }}>
                  <span style={{ fontSize: '22px', flex: 'none', marginTop: '2px' }}>{a.type === 'danger' ? '🚨' : '⚠️'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '14px', color: '#0f1f3d' }}>{a.message}</strong>
                      <span className={`badge ${a.type === 'danger' ? 'badge-danger' : 'badge-warning'}`}>{a.type === 'danger' ? 'Crítica' : 'Aviso'}</span>
                      <span className="badge badge-gray">{SECTION_LABELS[a.section] || a.section}</span>
                      {a.pool && <span className="badge badge-gray">🏊 {a.pool}</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {a.value !== undefined && <span>Valor: <strong style={{ color: '#dc2626' }}>{a.value}</strong></span>}
                      {a.threshold && <span>Límite: <strong>{a.threshold}</strong></span>}
                      <span>Fecha: {a.timestamp}</span>
                      {a.paramDate && <span style={{ color: '#0077cc' }}>📅 Medición: {a.paramDate} · {a.paramSession === 'morning' ? '☀ Mañana' : '🌆 Tarde'}</span>}
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => {
                    setResolveModal({ id: a.id, message: a.message, currentValue: a.value, pool: a.pool, paramDate: a.paramDate, paramSession: a.paramSession, parameterKey: a.parameterKey });
                    setCorrectedValue('');
                    setSaveRepair(true);
                  }} style={{ flex: 'none', whiteSpace: 'nowrap' }}>
                    🔧 Resolver
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── HISTORIAL ── */}
      {tab === 'historico' && (
        <div>
          {Object.keys(historyByPool).length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>Sin historial de alertas resueltas</p>
            </div>
          ) : (
            Object.entries(historyByPool).map(([key, items]) => (
              <div key={key} style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>{key}</h3>
                <div className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead><tr>
                        <th>Mensaje</th><th>Valor</th><th>Límite</th><th>Valor corregido</th><th>Resuelto por</th><th>Fecha resolución</th>
                      </tr></thead>
                      <tbody>
                        {items.map(a => (
                          <tr key={a.id}>
                            <td style={{ maxWidth: '280px' }}><strong>{a.message}</strong></td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: '#dc2626' }}>{a.value ?? '—'}</td>
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
              </div>
            ))
          )}
        </div>
      )}

      {/* ── REPARACIONES ── */}
      {tab === 'reparaciones' && (
        <div>
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '13px', color: '#1e40af' }}>
            <strong>📋 Trazabilidad de correcciones:</strong> Registro de todas las mediciones que fueron corregidas al resolver una alerta. El valor original queda guardado para auditoría.
          </div>
          {alertRepairs.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>No se han registrado reparaciones con valor corregido</p>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead><tr>
                    <th>Fecha medición</th><th>Sesión</th><th>Piscina</th><th>Parámetro</th>
                    <th>Valor original</th><th>Valor corregido</th><th>Corregido por</th><th>Fecha corrección</th>
                  </tr></thead>
                  <tbody>
                    {alertRepairs.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{r.parametroDate}</td>
                        <td>{r.parametroSession === 'morning' ? '☀ Mañana' : '🌆 Tarde'}</td>
                        <td style={{ fontWeight: '600' }}>{r.pool ?? '—'}</td>
                        <td>{PARAM_LABELS[r.parameterKey] ?? r.parameterKey}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#dc2626', fontWeight: '600' }}>{r.oldValue?.toFixed(3) ?? '—'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#15803d', fontWeight: '600' }}>{r.newValue?.toFixed(3) ?? '—'}</td>
                        <td>{r.repairedBy}</td>
                        <td style={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: '11px' }}>{new Date(r.repairedAt).toLocaleDateString('es-ES')} {new Date(r.repairedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL RESOLUCIÓN ── */}
      {resolveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f1f3d', marginBottom: '6px' }}>🔧 Resolver incidencia</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>{resolveModal.message}</p>

            {/* Info del registro afectado */}
            {resolveModal.paramDate && (
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px', fontSize: '12px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {resolveModal.pool && <span><strong>Piscina:</strong> {resolveModal.pool}</span>}
                  {resolveModal.paramDate && <span><strong>Fecha medición:</strong> {resolveModal.paramDate}</span>}
                  {resolveModal.paramSession && <span><strong>Sesión:</strong> {resolveModal.paramSession === 'morning' ? '☀ Mañana' : '🌆 Tarde'}</span>}
                  {resolveModal.parameterKey && <span><strong>Parámetro:</strong> {PARAM_LABELS[resolveModal.parameterKey] ?? resolveModal.parameterKey}</span>}
                  {resolveModal.currentValue !== undefined && <span><strong style={{ color: '#dc2626' }}>Valor anómalo:</strong> <span style={{ color: '#dc2626', fontWeight: '700' }}>{resolveModal.currentValue}</span></span>}
                </div>
              </div>
            )}

            {/* Valor corregido */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Valor correcto (tras la corrección en la instalación) *
              </label>
              <input className="input-field" type="number" step="0.01" value={correctedValue} onChange={e => setCorrectedValue(e.target.value)} placeholder="Introduce el valor real medido" autoFocus />
            </div>

            {/* Opción de sobreescribir medición */}
            {hasRepairData && (
              <div style={{ marginBottom: '20px', padding: '12px 14px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={saveRepair} onChange={e => setSaveRepair(e.target.checked)} style={{ marginTop: '2px', width: '16px', height: '16px', cursor: 'pointer' }} />
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e40af', display: 'block' }}>
                      ✏️ Sobreescribir la medición original con el valor corregido
                    </span>
                    <span style={{ fontSize: '12px', color: '#3b82f6' }}>
                      El registro de {resolveModal.paramDate} · {resolveModal.paramSession === 'morning' ? 'Mañana' : 'Tarde'} se actualizará con el nuevo valor. El valor original quedará guardado en el historial de reparaciones.
                    </span>
                  </div>
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setResolveModal(null)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleResolve} disabled={!correctedValue.trim() || saving}>
                {saving ? 'Guardando…' : '✅ Confirmar y guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

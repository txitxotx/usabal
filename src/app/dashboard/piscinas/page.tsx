'use client';
import { useState, useMemo } from 'react';
import { useApp, THRESHOLDS } from '@/lib/store';
import type { PoolName } from '@/types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

const POOLS = ['P. Grande', 'P. Peq.-Med.', 'SPA', 'Pileta'] as const;
const POOL_COLORS: Record<string, string> = {
  'P. Grande': '#0077cc', 'P. Peq.-Med.': '#0f6e56', 'SPA': '#7c3aed', 'Pileta': '#c2410c',
};

const PARAMS_META = [
  { key: 'cloroLibre', label: 'Cloro Libre', unit: 'mg/L', min: THRESHOLDS.cloroLibre.min, max: THRESHOLDS.cloroLibre.max, color: '#0077cc' },
  { key: 'cloroCombinado', label: 'Cloro Combinado', unit: 'mg/L', min: THRESHOLDS.cloroCombinado.min, max: THRESHOLDS.cloroCombinado.max, color: '#e67e22' },
  { key: 'ph', label: 'pH', unit: '', min: THRESHOLDS.ph.min, max: THRESHOLDS.ph.max, color: '#7c3aed' },
  { key: 'temperatura', label: 'Temperatura', unit: '°C', min: 24, max: 30, color: '#ef4444' },
  { key: 'turbidez', label: 'Turbidez', unit: 'NTU', min: 0, max: THRESHOLDS.turbidez.max, color: '#6b7280' },
] as const;

function valueClass(v: number | null, min: number, max: number) {
  if (v === null) return '';
  if (v < min || v > max) return Math.abs(v - (v < min ? min : max)) / (max - min) > 0.3 ? 'val-danger' : 'val-warning';
  return 'val-ok';
}

export default function PiscinasPage() {
  const { hasPermission, parametros, alerts } = useApp();
  const [selectedPool, setSelectedPool] = useState<string>('P. Grande');
  const [selectedParam, setSelectedParam] = useState<string>('cloroLibre');
  const [tab, setTab] = useState<'resumen' | 'graficos' | 'tabla'>('resumen');
  const [formOpen, setFormOpen] = useState(false);

  if (!hasPermission('view_piscinas')) {
    return <div className="alert-banner alert-danger"><span>⛔</span> Sin permiso para ver esta sección.</div>;
  }

  const canEdit = hasPermission('edit_piscinas');
  const paramMeta = PARAMS_META.find(p => p.key === selectedParam)!;

  const chartData = parametros.slice(-30).map(rec => ({
    date: rec.date.slice(5),
    value: (rec.params as any)[selectedParam]?.[selectedPool] ?? null,
  })).filter(d => d.value !== null);

  const poolAlerts = alerts.filter(a => a.section === 'piscinas' && !a.resolved);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="card" style={{ padding: '10px 14px', fontSize: '12px' }}>
        <p style={{ margin: '0 0 4px', fontWeight: '600' }}>{label}</p>
        <p style={{ margin: 0 }}>
          <strong style={{ color: paramMeta.color }}>{payload[0]?.value?.toFixed(2)}</strong> {paramMeta.unit}
          {(payload[0]?.value < paramMeta.min || payload[0]?.value > paramMeta.max) && (
            <span style={{ marginLeft: '6px', color: '#dc2626', fontWeight: '600' }}>⚠ Fuera de rango</span>
          )}
        </p>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f1f3d', margin: '0 0 4px' }}>🏊 Piscinas</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Control de calidad del agua por instalación</p>
        </div>
        {canEdit && <button className="btn btn-primary" onClick={() => setFormOpen(true)}>+ Nueva medición</button>}
      </div>

      {/* Pool alerts */}
      {poolAlerts.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {poolAlerts.slice(0, 3).map(a => (
            <div key={a.id} className={`alert-banner alert-${a.type === 'danger' ? 'danger' : 'warning'}`} style={{ marginBottom: '8px' }}>
              <span>{a.type === 'danger' ? '🚨' : '⚠️'}</span>
              <div><strong>{a.message}</strong> — Valor: <strong>{a.value}</strong> (límite: {a.threshold}) · {a.timestamp}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {(['resumen', 'graficos', 'tabla'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0f1f3d' : '#64748b', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
            {t === 'resumen' ? '🏠 Resumen' : t === 'graficos' ? '📈 Gráficos' : '📋 Tabla'}
          </button>
        ))}
      </div>

      {/* Resumen */}
      {tab === 'resumen' && (
        <div>
          {/* Last measurement for all pools */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {POOLS.map(pool => {
              const last = parametros[parametros.length - 1];
              if (!last) return null;
              const params = last.params;
              const issues: string[] = [];
              const cl = params.cloroLibre[pool as PoolName];
              const cc = params.cloroCombinado[pool as PoolName];
              const ph = params.ph[pool as PoolName];
              if (cl !== null && (cl < THRESHOLDS.cloroLibre.min || cl > THRESHOLDS.cloroLibre.max)) issues.push('Cloro libre');
              if (cc !== null && cc > THRESHOLDS.cloroCombinado.max) issues.push('Cloro combinado');
              if (ph !== null && (ph < THRESHOLDS.ph.min || ph > THRESHOLDS.ph.max)) issues.push('pH');

              return (
                <div key={pool} className="card" style={{ padding: '20px', borderTop: `3px solid ${POOL_COLORS[pool]}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#0f1f3d' }}>{pool}</h3>
                    <span className={`badge ${issues.length === 0 ? 'badge-ok' : 'badge-danger'}`}>
                      {issues.length === 0 ? '✓ OK' : `${issues.length} incidencia${issues.length > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {PARAMS_META.map(pm => {
                      const val = (params as any)[pm.key]?.[pool as PoolName];
                      return (
                        <div key={pm.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{pm.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={valueClass(val, pm.min, pm.max)} style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                              {val?.toFixed(2) ?? '—'} {pm.unit}
                            </span>
                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>({pm.min}–{pm.max})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {issues.length > 0 && (
                    <div style={{ marginTop: '12px', padding: '8px 10px', background: '#fff0f0', borderRadius: '6px', fontSize: '11px', color: '#991b1b' }}>
                      ⚠ Parámetros fuera de rango: {issues.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gráficos */}
      {tab === 'graficos' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '5px' }}>Piscina</label>
              <select className="input-field" style={{ width: 'auto' }} value={selectedPool} onChange={e => setSelectedPool(e.target.value)}>
                {POOLS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '5px' }}>Parámetro</label>
              <select className="input-field" style={{ width: 'auto' }} value={selectedParam} onChange={e => setSelectedParam(e.target.value)}>
                {PARAMS_META.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f1f3d' }}>
                {paramMeta.label} — {selectedPool} (últimos 30 días)
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Rango: {paramMeta.min}–{paramMeta.max} {paramMeta.unit}</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={45} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                {paramMeta.min > 0 && <ReferenceLine y={paramMeta.min} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `Min ${paramMeta.min}`, fontSize: 10, fill: '#d97706', position: 'left' }} />}
                <ReferenceLine y={paramMeta.max} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `Max ${paramMeta.max}`, fontSize: 10, fill: '#dc2626', position: 'left' }} />
                <Line type="monotone" dataKey="value" stroke={paramMeta.color} dot={{ r: 3, fill: paramMeta.color }} strokeWidth={2} name={paramMeta.label} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Mini charts for all params of this pool */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginTop: '16px' }}>
            {PARAMS_META.filter(p => p.key !== selectedParam).map(pm => {
              const data = parametros.slice(-21).map(rec => ({
                date: rec.date.slice(5),
                value: (rec.params as any)[pm.key]?.[selectedPool] ?? null,
              })).filter(d => d.value !== null);
              return (
                <div key={pm.key} className="card" style={{ padding: '16px' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{pm.label}</p>
                  <ResponsiveContainer width="100%" height={100}>
                    <LineChart data={data}>
                      {pm.min > 0 && <ReferenceLine y={pm.min} stroke="#f59e0b" strokeDasharray="3 3" />}
                      <ReferenceLine y={pm.max} stroke="#ef4444" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="value" stroke={pm.color} dot={false} strokeWidth={1.8} connectNulls />
                      <Tooltip content={<CustomTooltip />} />
                      <YAxis hide domain={['auto', 'auto']} />
                      <XAxis hide />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabla */}
      {tab === 'tabla' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  {POOLS.map(p => (
                    <>
                      <th key={`${p}-cl`} colSpan={5} style={{ textAlign: 'center', borderLeft: '2px solid #e2eaf4', color: POOL_COLORS[p] }}>{p}</th>
                    </>
                  ))}
                </tr>
                <tr>
                  <th></th>
                  {POOLS.map(p => (
                    <>
                      <th key={`${p}-cl`} style={{ borderLeft: '2px solid #e2eaf4' }}>Cl Libre</th>
                      <th key={`${p}-cc`}>Cl Comb.</th>
                      <th key={`${p}-ph`}>pH</th>
                      <th key={`${p}-temp`}>Tª</th>
                      <th key={`${p}-turb`}>Turb.</th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...parametros].reverse().map(rec => (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{rec.date}</td>
                    {POOLS.map(pool => (
                      <>
                        <td key={`${pool}-cl`} className={valueClass(rec.params.cloroLibre[pool as PoolName], 0.5, 2.0)} style={{ borderLeft: '2px solid #f1f5f9', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{rec.params.cloroLibre[pool as PoolName]?.toFixed(2) ?? '—'}</td>
                        <td key={`${pool}-cc`} className={valueClass(rec.params.cloroCombinado[pool as PoolName], 0, 0.6)} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{rec.params.cloroCombinado[pool as PoolName]?.toFixed(2) ?? '—'}</td>
                        <td key={`${pool}-ph`} className={valueClass(rec.params.ph[pool as PoolName], 7.2, 7.8)} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{rec.params.ph[pool as PoolName]?.toFixed(2) ?? '—'}</td>
                        <td key={`${pool}-temp`} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{rec.params.temperatura[pool as PoolName]?.toFixed(1) ?? '—'}</td>
                        <td key={`${pool}-turb`} className={valueClass(rec.params.turbidez[pool as PoolName], 0, 0.5)} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{rec.params.turbidez[pool as PoolName]?.toFixed(2) ?? '—'}</td>
                      </>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add form modal */}
      {formOpen && canEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f1f3d', margin: 0 }}>Nueva medición de piscinas</h2>
              <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Fecha</label>
              <input className="input-field" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            {POOLS.map(pool => (
              <div key={pool} style={{ marginBottom: '16px', padding: '14px', background: '#f8fafc', borderRadius: '8px', borderLeft: `3px solid ${POOL_COLORS[pool]}` }}>
                <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#0f1f3d' }}>{pool}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {PARAMS_META.map(pm => (
                    <div key={pm.key}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' }}>{pm.label} {pm.unit && `(${pm.unit})`}</label>
                      <input className="input-field" type="number" step="0.01" placeholder={`${pm.min}–${pm.max}`} style={{ fontSize: '13px' }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => { alert('Medición guardada (demo)'); setFormOpen(false); }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

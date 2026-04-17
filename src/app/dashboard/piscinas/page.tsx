'use client';
import { useState, useMemo } from 'react';
import { useApp, THRESHOLDS } from '@/lib/store';
import { SEASONAL_POOLS } from '@/types';
import type { PoolName } from '@/types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

const POOL_COLORS: Record<string, string> = {
  'P. Grande': '#0077cc', 'P. Peq.-Med.': '#0f6e56', 'SPA': '#7c3aed', 'Pileta': '#c2410c',
  'P. Ext. Grande': '#0891b2', 'P. Ext. Pequeña': '#059669', 'Splash': '#d97706',
};

const PARAMS_META = [
  { key: 'cloroLibre', label: 'Cloro Libre', unit: 'mg/L', min: THRESHOLDS.cloroLibre.min, max: THRESHOLDS.cloroLibre.max, color: '#0077cc' },
  { key: 'cloroCombinado', label: 'Cloro Combinado', unit: 'mg/L', min: THRESHOLDS.cloroCombinado.min, max: THRESHOLDS.cloroCombinado.max, color: '#e67e22' },
  { key: 'ph', label: 'pH', unit: '', min: THRESHOLDS.ph.min, max: THRESHOLDS.ph.max, color: '#7c3aed' },
  { key: 'temperatura', label: 'Temperatura Agua', unit: '°C', min: 24, max: 30, color: '#ef4444' },
  { key: 'turbidez', label: 'Turbidez', unit: 'NTU', min: 0, max: THRESHOLDS.turbidez.max, color: '#6b7280' },
] as const;

const AMBIENT_META = [
  { key: 'tempAmbiente', label: 'Temp. Ambiente', unit: '°C', min: THRESHOLDS.tempAmbiente.min, max: THRESHOLDS.tempAmbiente.max, color: '#f97316' },
  { key: 'humedadRelativa', label: 'Humedad Relativa', unit: '%', min: THRESHOLDS.humedadRelativa.min, max: THRESHOLDS.humedadRelativa.max, color: '#06b6d4' },
  { key: 'co2Interior', label: 'CO₂ Interior', unit: 'ppm', min: 0, max: 1500, color: '#84cc16' },
  { key: 'co2Exterior', label: 'CO₂ Exterior', unit: 'ppm', min: 0, max: 1500, color: '#22c55e' },
] as const;

function valueClass(v: number | null, min: number, max: number) {
  if (v === null) return '';
  if (v < min || v > max) return Math.abs(v - (v < min ? min : max)) / (max - min) > 0.3 ? 'val-danger' : 'val-warning';
  return 'val-ok';
}

// Excel export helper (CSV that Excel can open)
function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => {
    const v = row[h];
    return typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v ?? '');
  }).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function PiscinasPage() {
  const { hasPermission, parametros, alerts, activePools, toggleSeasonalPool, currentUser } = useApp();
  const [selectedPool, setSelectedPool] = useState<string>('P. Grande');
  const [selectedParam, setSelectedParam] = useState<string>('cloroLibre');
  const [tab, setTab] = useState<'resumen' | 'ambiente' | 'graficos' | 'tabla'>('resumen');
  const [formOpen, setFormOpen] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [exportOpen, setExportOpen] = useState(false);

  if (!hasPermission('view_piscinas')) {
    return <div className="alert-banner alert-danger"><span>⛔</span> Sin permiso para ver esta sección.</div>;
  }

  const canEdit = hasPermission('edit_piscinas');
  const isAdmin = currentUser?.role === 'admin';
  const paramMeta = PARAMS_META.find(p => p.key === selectedParam)!;

  const filteredParametros = useMemo(() =>
    sessionFilter === 'all' ? parametros : parametros.filter(r => r.session === sessionFilter),
    [parametros, sessionFilter]
  );

  const chartData = filteredParametros.slice(-30).map(rec => ({
    date: `${rec.date.slice(5)} ${rec.session === 'morning' ? '☀' : '🌆'}`,
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

  // Export handlers
  const handleExport = (type: 'agua' | 'ambiente' | 'recirculacion') => {
    if (type === 'agua') {
      const rows = filteredParametros.flatMap(rec =>
        activePools.map(pool => ({
          Fecha: rec.date,
          Sesion: rec.session === 'morning' ? 'Mañana' : 'Tarde',
          Piscina: pool,
          'Cloro Libre (mg/L)': rec.params.cloroLibre[pool] ?? '',
          'Cloro Combinado (mg/L)': rec.params.cloroCombinado[pool] ?? '',
          'pH': rec.params.ph[pool] ?? '',
          'Temperatura Agua (°C)': rec.params.temperatura[pool] ?? '',
          'Turbidez (NTU)': rec.params.turbidez[pool] ?? '',
        }))
      );
      exportToCSV(rows, `piscinas_agua_${new Date().toISOString().slice(0,10)}.csv`);
    } else if (type === 'ambiente') {
      const rows = filteredParametros.map(rec => ({
        Fecha: rec.date,
        Sesion: rec.session === 'morning' ? 'Mañana' : 'Tarde',
        'Temp. Ambiente (°C)': rec.params.tempAmbiente ?? '',
        'Humedad Relativa (%)': rec.params.humedadRelativa ?? '',
        'CO2 Interior (ppm)': rec.params.co2Interior ?? '',
        'CO2 Exterior (ppm)': rec.params.co2Exterior ?? '',
        'Delta CO2 (ppm)': rec.params.co2Interior != null && rec.params.co2Exterior != null
          ? Math.round(rec.params.co2Interior - rec.params.co2Exterior) : '',
      }));
      exportToCSV(rows, `piscinas_ambiente_${new Date().toISOString().slice(0,10)}.csv`);
    }
    setExportOpen(false);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f1f3d', margin: '0 0 4px' }}>🏊 Piscinas</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Control de calidad del agua · Mañana y tarde (domingos/festivos solo mañana)</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isAdmin && (
            <button className="btn btn-secondary" onClick={() => setExportOpen(true)}>📥 Exportar Excel</button>
          )}
          {canEdit && <button className="btn btn-primary" onClick={() => setFormOpen(true)}>+ Nueva medición</button>}
        </div>
      </div>

      {/* Admin: seasonal pool toggles */}
      {isAdmin && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🌞 Piscinas de temporada (solo verano)
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {SEASONAL_POOLS.map(pool => {
              const active = activePools.includes(pool);
              return (
                <button
                  key={pool}
                  onClick={() => toggleSeasonalPool(pool)}
                  style={{ padding: '7px 14px', borderRadius: '20px', border: `2px solid ${active ? POOL_COLORS[pool] : '#e2eaf4'}`, background: active ? POOL_COLORS[pool] + '18' : '#f8fafc', color: active ? POOL_COLORS[pool] : '#94a3b8', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  {active ? '✅' : '⭕'} {pool}
                </button>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Session filter */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {([['all','Todas'], ['morning','☀ Mañana'], ['afternoon','🌆 Tarde']] as const).map(([val, lbl]) => (
          <button key={val} onClick={() => setSessionFilter(val)} style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', background: sessionFilter === val ? '#fff' : 'transparent', color: sessionFilter === val ? '#0f1f3d' : '#64748b', boxShadow: sessionFilter === val ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content', flexWrap: 'wrap' }}>
        {(['resumen', 'ambiente', 'graficos', 'tabla'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0f1f3d' : '#64748b', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
            {t === 'resumen' ? '🏠 Resumen' : t === 'ambiente' ? '🌡️ Ambiente' : t === 'graficos' ? '📈 Gráficos' : '📋 Tabla'}
          </button>
        ))}
      </div>

      {/* Resumen */}
      {tab === 'resumen' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {activePools.map(pool => {
            const last = filteredParametros[filteredParametros.length - 1];
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
              <div key={pool} className="card" style={{ padding: '20px', borderTop: `3px solid ${POOL_COLORS[pool] ?? '#94a3b8'}` }}>
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
                <div style={{ marginTop: '10px', fontSize: '11px', color: '#94a3b8' }}>
                  {last.session === 'morning' ? '☀ Mañana' : '🌆 Tarde'} · {last.date}
                </div>
                {issues.length > 0 && (
                  <div style={{ marginTop: '10px', padding: '8px 10px', background: '#fff0f0', borderRadius: '6px', fontSize: '11px', color: '#991b1b' }}>
                    ⚠ Fuera de rango: {issues.join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ambiente */}
      {tab === 'ambiente' && (() => {
        const last = filteredParametros[filteredParametros.length - 1];
        const co2Delta = last ? (last.params.co2Interior ?? 0) - (last.params.co2Exterior ?? 0) : null;
        return (
          <div>
            {last && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                {AMBIENT_META.map(m => {
                  const val = (last.params as any)[m.key] as number | null;
                  const isOk = val === null || (val >= m.min && val <= m.max);
                  return (
                    <div key={m.key} className="metric-card" style={{ borderTop: `3px solid ${m.color}` }}>
                      <div className="metric-label">{m.label}</div>
                      <div className="metric-value" style={{ color: isOk ? '#0f1f3d' : '#dc2626' }}>
                        {val?.toFixed(1) ?? '—'} <span style={{ fontSize: '13px', fontWeight: '400', color: '#94a3b8' }}>{m.unit}</span>
                      </div>
                      <div className="metric-sub">Rango: {m.min}–{m.max}</div>
                    </div>
                  );
                })}
                <div className="metric-card" style={{ borderTop: `3px solid ${co2Delta !== null && co2Delta > 500 ? '#ef4444' : '#22c55e'}` }}>
                  <div className="metric-label">ΔCO₂ Interior–Exterior</div>
                  <div className="metric-value" style={{ color: co2Delta !== null && co2Delta > 500 ? '#dc2626' : '#15803d' }}>
                    {co2Delta !== null ? Math.round(co2Delta) : '—'} <span style={{ fontSize: '13px', fontWeight: '400', color: '#94a3b8' }}>ppm</span>
                  </div>
                  <div className="metric-sub">Máximo: 500 ppm</div>
                </div>
              </div>
            )}
            {/* Tabla histórico ambiente */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Sesión</th>
                      <th>Temp. Amb. (°C)</th>
                      <th>Humedad (%)</th>
                      <th>CO₂ Int. (ppm)</th>
                      <th>CO₂ Ext. (ppm)</th>
                      <th>ΔCO₂ (ppm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredParametros].reverse().map(rec => {
                      const delta = rec.params.co2Interior != null && rec.params.co2Exterior != null
                        ? Math.round(rec.params.co2Interior - rec.params.co2Exterior) : null;
                      return (
                        <tr key={rec.id}>
                          <td style={{ whiteSpace: 'nowrap', fontWeight: '500' }}>{rec.date}</td>
                          <td>{rec.session === 'morning' ? '☀ Mañana' : '🌆 Tarde'}</td>
                          <td className={valueClass(rec.params.tempAmbiente, 26, 33)} style={{ fontFamily: 'var(--font-mono)' }}>{rec.params.tempAmbiente?.toFixed(1) ?? '—'}</td>
                          <td className={valueClass(rec.params.humedadRelativa, 50, 70)} style={{ fontFamily: 'var(--font-mono)' }}>{rec.params.humedadRelativa?.toFixed(1) ?? '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{rec.params.co2Interior?.toFixed(0) ?? '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{rec.params.co2Exterior?.toFixed(0) ?? '—'}</td>
                          <td className={delta !== null ? (delta > 500 ? 'val-danger' : 'val-ok') : ''} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{delta ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Gráficos */}
      {tab === 'graficos' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '5px' }}>Piscina</label>
              <select className="input-field" style={{ width: 'auto' }} value={selectedPool} onChange={e => setSelectedPool(e.target.value)}>
                {activePools.map(p => <option key={p}>{p}</option>)}
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
                {paramMeta.label} — {selectedPool} (últimas 30 mediciones)
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Rango: {paramMeta.min}–{paramMeta.max} {paramMeta.unit}</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={45} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                {paramMeta.min > 0 && <ReferenceLine y={paramMeta.min} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `Min ${paramMeta.min}`, fontSize: 10, fill: '#d97706', position: 'left' }} />}
                <ReferenceLine y={paramMeta.max} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `Max ${paramMeta.max}`, fontSize: 10, fill: '#dc2626', position: 'left' }} />
                <Line type="monotone" dataKey="value" stroke={paramMeta.color} dot={{ r: 3, fill: paramMeta.color }} strokeWidth={2} name={paramMeta.label} connectNulls />
              </LineChart>
            </ResponsiveContainer>
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
                  <th>Sesión</th>
                  {activePools.map(p => (
                    <th key={p} colSpan={5} style={{ textAlign: 'center', borderLeft: '2px solid #e2eaf4', color: POOL_COLORS[p] ?? '#64748b' }}>{p}</th>
                  ))}
                </tr>
                <tr>
                  <th></th>
                  <th></th>
                  {activePools.map(p => (
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
                {[...filteredParametros].reverse().map(rec => (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{rec.date}</td>
                    <td style={{ fontSize: '11px', color: '#64748b' }}>{rec.session === 'morning' ? '☀' : '🌆'}</td>
                    {activePools.map(pool => (
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

      {/* Export modal */}
      {exportOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '440px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f1f3d', marginBottom: '8px' }}>📥 Exportar datos</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Selecciona el conjunto de datos a exportar en formato Excel (CSV)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button className="btn btn-primary" style={{ justifyContent: 'flex-start', gap: '10px' }} onClick={() => handleExport('agua')}>
                💧 Parámetros del agua (cloro, pH, turbidez, temperatura)
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: '10px' }} onClick={() => handleExport('ambiente')}>
                🌡️ Parámetros ambientales (temp. ambiente, humedad, CO₂)
              </button>
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setExportOpen(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Add form modal */}
      {formOpen && canEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f1f3d', margin: 0 }}>Nueva medición de piscinas</h2>
              <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Fecha</label>
                <input className="input-field" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Sesión</label>
                <select className="input-field">
                  <option value="morning">☀ Mañana</option>
                  <option value="afternoon">🌆 Tarde</option>
                </select>
              </div>
            </div>
            {/* Ambient params */}
            <div style={{ marginBottom: '16px', padding: '14px', background: '#f0f9ff', borderRadius: '8px', borderLeft: '3px solid #0891b2' }}>
              <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#0f1f3d' }}>🌡️ Parámetros ambientales</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {AMBIENT_META.map(m => (
                  <div key={m.key}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' }}>{m.label} ({m.unit})</label>
                    <input className="input-field" type="number" step="0.1" placeholder={`${m.min}–${m.max}`} style={{ fontSize: '13px' }} />
                  </div>
                ))}
              </div>
            </div>
            {activePools.map(pool => (
              <div key={pool} style={{ marginBottom: '14px', padding: '14px', background: '#f8fafc', borderRadius: '8px', borderLeft: `3px solid ${POOL_COLORS[pool] ?? '#94a3b8'}` }}>
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

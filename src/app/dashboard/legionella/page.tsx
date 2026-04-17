'use client';
import { useState } from 'react';
import { useApp, THRESHOLDS } from '@/lib/store';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, BarChart, Bar } from 'recharts';

function valueClass(v: number | null, min: number, max: number) {
  if (v === null) return '';
  if (v < min || v > max) return 'val-danger';
  return 'val-ok';
}

export default function LegionellaPage() {
  const { hasPermission, legionellaTemps, legionellaBiocida, alerts } = useApp();
  const [tab, setTab] = useState<'temperaturas' | 'biocida' | 'tabla'>('temperaturas');
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<'temp' | 'biocida'>('temp');

  if (!hasPermission('view_legionella')) {
    return <div className="alert-banner alert-danger"><span>⛔</span> Sin permiso.</div>;
  }
  const canEdit = hasPermission('edit_legionella');
  const legAlerts = alerts.filter(a => a.section === 'legionella' && !a.resolved);

  const last = legionellaTemps[legionellaTemps.length - 1];
  const lastBio = legionellaBiocida[legionellaBiocida.length - 1];

  const tempChartData = legionellaTemps.slice(-31).map(e => ({
    date: e.date.slice(5),
    retorno: e.tempRetorno,
    dep1: e.tempDeposito1,
    dep2: e.tempDeposito2,
  }));
  const biocidaData = legionellaBiocida.slice(-31).map(e => ({
    date: e.date.slice(5),
    biocida: e.biocida,
    ph: e.ph,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="card" style={{ padding: '10px 14px', fontSize: '12px' }}>
        <p style={{ margin: '0 0 6px', fontWeight: '600' }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ margin: '2px 0', color: p.color }}>{p.name}: <strong>{p.value?.toFixed(2)}</strong></p>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f1f3d', margin: '0 0 4px' }}>🧫 Legionella</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Control ACS: temperaturas, biocida y pH en instalación</p>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={() => { setFormType('temp'); setFormOpen(true); }}>+ Temperatura</button>
            <button className="btn btn-secondary" onClick={() => { setFormType('biocida'); setFormOpen(true); }}>+ Biocida/pH</button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {legAlerts.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {legAlerts.slice(0, 3).map(a => (
            <div key={a.id} className="alert-banner alert-danger" style={{ marginBottom: '8px' }}>
              <span>🚨</span>
              <div><strong>{a.message}</strong> — Valor: <strong>{a.value}°C</strong> (límite: {a.threshold}) · {a.timestamp}</div>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="metric-card" style={{ borderTop: `3px solid ${last?.tempRetorno && last.tempRetorno >= 50 ? '#22c55e' : '#ef4444'}` }}>
          <div className="metric-label">Temp. Retorno</div>
          <div className="metric-value" style={{ fontSize: '22px', color: last?.tempRetorno && last.tempRetorno >= 50 ? '#15803d' : '#dc2626' }}>
            {last?.tempRetorno ?? '—'}°C
          </div>
          <div className="metric-sub">mínimo 50°C</div>
        </div>
        <div className="metric-card" style={{ borderTop: `3px solid ${last?.tempDeposito1 && last.tempDeposito1 >= 60 ? '#22c55e' : '#ef4444'}` }}>
          <div className="metric-label">Depósito 1 (5000L)</div>
          <div className="metric-value" style={{ fontSize: '22px', color: last?.tempDeposito1 && last.tempDeposito1 >= 60 ? '#15803d' : '#dc2626' }}>
            {last?.tempDeposito1 ?? '—'}°C
          </div>
          <div className="metric-sub">mínimo 60°C</div>
        </div>
        <div className="metric-card" style={{ borderTop: `3px solid ${last?.tempDeposito2 && last.tempDeposito2 >= 60 ? '#22c55e' : '#ef4444'}` }}>
          <div className="metric-label">Depósito 2 (5000L)</div>
          <div className="metric-value" style={{ fontSize: '22px', color: last?.tempDeposito2 && last.tempDeposito2 >= 60 ? '#15803d' : '#dc2626' }}>
            {last?.tempDeposito2 ?? '—'}°C
          </div>
          <div className="metric-sub">mínimo 60°C</div>
        </div>
        <div className="metric-card" style={{ borderTop: `3px solid ${lastBio?.biocida && lastBio.biocida >= 0.2 ? '#22c55e' : '#ef4444'}` }}>
          <div className="metric-label">Biocida (Cloro)</div>
          <div className="metric-value" style={{ fontSize: '22px', color: lastBio?.biocida && lastBio.biocida >= 0.2 ? '#15803d' : '#dc2626' }}>
            {lastBio?.biocida?.toFixed(2) ?? '—'}
          </div>
          <div className="metric-sub">mín 0.2 mg/L</div>
        </div>
        <div className="metric-card" style={{ borderTop: `3px solid ${lastBio?.ph && lastBio.ph >= 7.0 && lastBio.ph <= 8.0 ? '#22c55e' : '#f59e0b'}` }}>
          <div className="metric-label">pH ACS</div>
          <div className="metric-value" style={{ fontSize: '22px' }}>{lastBio?.ph?.toFixed(2) ?? '—'}</div>
          <div className="metric-sub">rango 7.0–8.0</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {(['temperaturas', 'biocida', 'tabla'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0f1f3d' : '#64748b', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s', textTransform: 'capitalize' }}>
            {t === 'temperaturas' ? '🌡 Temperaturas' : t === 'biocida' ? '🧪 Biocida/pH' : '📋 Tabla'}
          </button>
        ))}
      </div>

      {/* Temperaturas chart */}
      {tab === 'temperaturas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f1f3d' }}>Temperaturas diarias ACS (últimos 30 días)</h3>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '2px', background: '#0077cc', display: 'inline-block' }} /> Retorno</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '2px', background: '#7c3aed', display: 'inline-block' }} /> Depósito 1</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '2px', background: '#0f6e56', display: 'inline-block' }} /> Depósito 2</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={tempChartData} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={35} domain={[45, 70]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Mín. retorno 50°C', fontSize: 10, fill: '#dc2626', position: 'right' }} />
                <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Mín. depósito 60°C', fontSize: 10, fill: '#d97706', position: 'right' }} />
                <Line type="monotone" dataKey="retorno" stroke="#0077cc" dot={false} strokeWidth={2} name="Retorno (°C)" />
                <Line type="monotone" dataKey="dep1" stroke="#7c3aed" dot={false} strokeWidth={2} name="Depósito 1 (°C)" />
                <Line type="monotone" dataKey="dep2" stroke="#0f6e56" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="Depósito 2 (°C)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Min/max stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {(['tempRetorno', 'tempDeposito1', 'tempDeposito2'] as const).map(key => {
              const vals = legionellaTemps.slice(-30).map(e => e[key]).filter(v => v !== undefined && v !== null) as number[];
              const mn = Math.min(...vals), mx = Math.max(...vals), avg = vals.reduce((a, b) => a + b, 0) / vals.length;
              const minLimit = key === 'tempRetorno' ? 50 : 60;
              const violations = vals.filter(v => v < minLimit).length;
              return (
                <div key={key} className="card" style={{ padding: '16px' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {key === 'tempRetorno' ? 'Retorno' : key === 'tempDeposito1' ? 'Depósito 1' : 'Depósito 2'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Mínimo</span>
                    <span className={mn < minLimit ? 'val-danger' : 'val-ok'} style={{ fontFamily: 'var(--font-mono)' }}>{mn.toFixed(1)}°C</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Máximo</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{mx.toFixed(1)}°C</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Media</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{avg.toFixed(1)}°C</span>
                  </div>
                  {violations > 0 && (
                    <div style={{ padding: '4px 8px', background: '#fee2e2', borderRadius: '6px', fontSize: '11px', color: '#991b1b', fontWeight: '600' }}>
                      ⚠ {violations} días bajo {minLimit}°C
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Biocida chart */}
      {tab === 'biocida' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: '#0f1f3d' }}>Biocida y pH diario (últimos 30 días)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={biocidaData} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={35} domain={[0, 3]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={35} domain={[6, 9]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine yAxisId="left" y={0.2} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Mín 0.2', fontSize: 10, fill: '#dc2626' }} />
                <Bar yAxisId="left" dataKey="biocida" fill="#0077cc" radius={[3, 3, 0, 0]} name="Biocida (mg/L)" opacity={0.8} />
                <Line yAxisId="right" type="monotone" dataKey="ph" stroke="#7c3aed" dot={false} strokeWidth={2} name="pH" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Biocida table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Fecha</th><th>Biocida (mg/L)</th><th>pH</th><th>Punto de medida</th><th>Responsable</th><th>Estado</th></tr></thead>
                <tbody>
                  {[...legionellaBiocida].reverse().map(e => {
                    const bioOk = e.biocida !== null && e.biocida >= THRESHOLDS.biocida.min && e.biocida <= THRESHOLDS.biocida.max;
                    const phOk = e.ph !== null && e.ph >= THRESHOLDS.phLegionella.min && e.ph <= THRESHOLDS.phLegionella.max;
                    return (
                      <tr key={e.id}>
                        <td style={{ fontWeight: '500' }}>{e.date}</td>
                        <td className={valueClass(e.biocida, THRESHOLDS.biocida.min, THRESHOLDS.biocida.max)} style={{ fontFamily: 'var(--font-mono)' }}>{e.biocida?.toFixed(2) ?? '—'}</td>
                        <td className={valueClass(e.ph, THRESHOLDS.phLegionella.min, THRESHOLDS.phLegionella.max)} style={{ fontFamily: 'var(--font-mono)' }}>{e.ph?.toFixed(2) ?? '—'}</td>
                        <td>{e.puntoDeMedida}</td>
                        <td>{e.nombre}</td>
                        <td><span className={`badge ${bioOk && phOk ? 'badge-ok' : 'badge-danger'}`}>{bioOk && phOk ? '✓ OK' : '✗ Revisar'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Full table */}
      {tab === 'tabla' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Fecha</th><th>Mes</th><th>Temp. Retorno</th><th>Depósito 1</th><th>Depósito 2</th><th>Estado retorno</th><th>Estado depósitos</th></tr></thead>
              <tbody>
                {[...legionellaTemps].reverse().map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: '500' }}>{e.date}</td>
                    <td>{e.month}</td>
                    <td className={valueClass(e.tempRetorno, 50, 65)} style={{ fontFamily: 'var(--font-mono)' }}>{e.tempRetorno}°C</td>
                    <td className={valueClass(e.tempDeposito1, 60, 70)} style={{ fontFamily: 'var(--font-mono)' }}>{e.tempDeposito1}°C</td>
                    <td className={valueClass(e.tempDeposito2, 60, 70)} style={{ fontFamily: 'var(--font-mono)' }}>{e.tempDeposito2}°C</td>
                    <td><span className={`badge ${e.tempRetorno >= 50 ? 'badge-ok' : 'badge-danger'}`}>{e.tempRetorno >= 50 ? '✓ OK' : '✗ Bajo'}</span></td>
                    <td><span className={`badge ${e.tempDeposito1 >= 60 && e.tempDeposito2 >= 60 ? 'badge-ok' : 'badge-danger'}`}>{e.tempDeposito1 >= 60 && e.tempDeposito2 >= 60 ? '✓ OK' : '✗ Bajo'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {formOpen && canEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f1f3d', margin: 0 }}>
                {formType === 'temp' ? 'Registro temperatura ACS' : 'Registro biocida / pH'}
              </h2>
              <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Fecha</label>
                <input className="input-field" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              {formType === 'temp' ? (
                <>
                  {[['Temperatura Retorno (°C)', 'mín. 50°C'], ['Temperatura Depósito 1 (°C)', 'mín. 60°C'], ['Temperatura Depósito 2 (°C)', 'mín. 60°C']].map(([label, hint]) => (
                    <div key={label}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>{label} <span style={{ color: '#94a3b8', fontWeight: '400' }}>({hint})</span></label>
                      <input className="input-field" type="number" step="0.1" placeholder="ej. 57.5" />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Biocida / Cloro (mg/L) <span style={{ color: '#94a3b8', fontWeight: '400' }}>(rango 0.2–2.0)</span></label>
                    <input className="input-field" type="number" step="0.01" placeholder="ej. 0.5" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>pH <span style={{ color: '#94a3b8', fontWeight: '400' }}>(rango 7.0–8.0)</span></label>
                    <input className="input-field" type="number" step="0.01" placeholder="ej. 7.5" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Punto de medida</label>
                    <input className="input-field" type="text" defaultValue="ENTRADA DE AGUA" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Responsable</label>
                    <input className="input-field" type="text" placeholder="Nombre" />
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => { alert('Guardado (demo)'); setFormOpen(false); }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

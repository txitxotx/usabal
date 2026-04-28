'use client';
export const dynamic = 'force-dynamic';
import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import type { PoolName } from '@/types';

const POOL_COLORS: Record<string, string> = {
  'P. Grande': '#0077cc', 'P. Peq.-Med.': '#0f6e56', 'SPA': '#7c3aed', 'Pileta': '#c2410c',
  'P. Ext. Grande': '#0891b2', 'P. Ext. Pequeña': '#059669', 'Splash': '#d97706',
};

const POOL_VOLUME: Record<string, number> = {
  'P. Grande': 881, 'P. Peq.-Med.': 110, 'SPA': 265, 'Pileta': 4,
  'P. Ext. Grande': 641, 'P. Ext. Pequeña': 85, 'Splash': 5,
};

const DELTA_WARN: Record<string, { recircMin: number; renovadaMax: number; horasMin: number }> = {
  'P. Grande':       { recircMin: 4700, renovadaMax: 75,  horasMin: 15 },
  'P. Peq.-Med.':   { recircMin: 950,  renovadaMax: 40,  horasMin: 15 },
  'SPA':             { recircMin: 1900, renovadaMax: 45,  horasMin: 15 },
  'Pileta':          { recircMin: 50,   renovadaMax: 15,  horasMin: 10 },
  'P. Ext. Grande':  { recircMin: 4700, renovadaMax: 75,  horasMin: 15 },
  'P. Ext. Pequeña': { recircMin: 950,  renovadaMax: 40,  horasMin: 15 },
  'Splash':          { recircMin: 50,   renovadaMax: 15,  horasMin: 10 },
};

function deltaClass(v: number | null, threshold: number, isMin: boolean) {
  if (v === null || v === undefined) return '';
  if (v < 0) return 'val-danger';
  if (isMin && v < threshold) return 'val-warning';
  if (!isMin && v > threshold) return 'val-warning';
  return 'val-ok';
}

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('es-ES');
}

function fmtDelta(d: number | null) {
  if (d === null) return '—';
  return `${d >= 0 ? '+' : ''}${d.toLocaleString('es-ES')}`;
}

function calcTiempoRecirc(volumen: number, deltaRecirc: number | null, deltaHoras: number | null): string {
  if (!deltaRecirc || !deltaHoras || deltaHoras <= 0 || deltaRecirc <= 0) return '—';
  const caudalMh = deltaRecirc / deltaHoras;
  if (caudalMh <= 0) return '—';
  const horas = volumen / caudalMh;
  if (horas > 999) return '>999 h';
  return `${horas.toFixed(1)} h`;
}

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  pool: '',
  contadorRecirculacion: '',
  contadorDepuracion: '',
  horasFiltraje: '',
  presionFiltros: '',
};

export default function RecirculacionPage() {
  const { hasPermission, recirculacion, activePools, addRecirculacion, deleteRecirculacion, currentUser } = useApp();
  const [selectedPool, setSelectedPool] = useState<string>(activePools[0] ?? 'P. Grande');
  const [tab, setTab] = useState<'resumen' | 'tabla'>('resumen');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM, pool: activePools[0] ?? '' });
  const [saving, setSaving] = useState(false);

  if (!hasPermission('view_recirculacion')) {
    return <div className="alert-banner alert-danger"><span>⛔</span> Sin permiso para ver esta sección.</div>;
  }

  const canEdit = hasPermission('edit_recirculacion');
  const isAdmin = currentUser?.role === 'admin';

  const latestByPool: Record<string, typeof recirculacion[0]> = {};
  for (const e of recirculacion) {
    if (!latestByPool[e.pool] || e.date > latestByPool[e.pool].date) latestByPool[e.pool] = e;
  }

  const poolEntries = useMemo(() =>
    recirculacion.filter(e => e.pool === selectedPool).sort((a, b) => b.date.localeCompare(a.date)),
    [recirculacion, selectedPool]
  );

  const entriesAsc = [...poolEntries].reverse();
  const withDeltas = poolEntries.map((e, idx) => {
    const ascIdx = entriesAsc.length - 1 - idx;
    const prev = ascIdx > 0 ? entriesAsc[ascIdx - 1] : null;
    const deltaRecirc   = prev ? Math.round(e.contadorRecirculacion - prev.contadorRecirculacion) : null;
    const deltaRenovada = prev ? Math.round(e.contadorDepuracion - prev.contadorDepuracion) : null;
    const deltaHoras    = prev ? Math.round((e.horasFiltraje - prev.horasFiltraje) * 10) / 10 : null;
    return { ...e, deltaRecirc, deltaRenovada, deltaHoras };
  });

  const last = latestByPool[selectedPool];
  const warn = DELTA_WARN[selectedPool] ?? { recircMin: 0, renovadaMax: 9999, horasMin: 0 };
  const vol  = POOL_VOLUME[selectedPool];

  const handleSave = async () => {
    if (!form.pool || !form.date || !form.contadorRecirculacion || !form.contadorDepuracion || !form.horasFiltraje) return;
    setSaving(true);
    try {
      await addRecirculacion({
        date: form.date,
        pool: form.pool as any,
        contadorRecirculacion: parseFloat(form.contadorRecirculacion),
        contadorDepuracion: parseFloat(form.contadorDepuracion),
        horasFiltraje: parseFloat(form.horasFiltraje),
        presionFiltros: form.presionFiltros ? parseFloat(form.presionFiltros) : null,
      });
      setFormOpen(false);
      setForm({ ...EMPTY_FORM, pool: activePools[0] ?? '' });
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof form, label: string, placeholder: string, type = 'number') => (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>{label}</label>
      <input
        type={type}
        step={type === 'number' ? '0.01' : undefined}
        className="input-field"
        placeholder={placeholder}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f1f3d', margin: '0 0 4px' }}>🔄 Recirculación</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Contadores de recirculación, agua renovada, horas de filtraje y tiempo de recirculación</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setFormOpen(true)}>+ Nueva lectura</button>
        )}
      </div>

      {/* ── MODAL FORMULARIO ── */}
      {formOpen && canEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f1f3d', margin: 0 }}>Nueva lectura de recirculación</h2>
              <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Fecha</label>
                <input type="date" className="input-field" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Piscina</label>
                <select className="input-field" value={form.pool} onChange={e => setForm(f => ({ ...f, pool: e.target.value }))}>
                  {activePools.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {field('contadorRecirculacion', 'Contador Recirculación (m³)', 'Lectura actual del contador')}
              {field('contadorDepuracion', 'Contador Agua Renovada (m³)', 'Lectura actual del contador')}
              {field('horasFiltraje', 'Horas de Filtraje (h)', 'Horas acumuladas')}
              {field('presionFiltros', 'Presión Filtros (bar) — opcional', 'ej. 1.20')}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas resumen por piscina */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {activePools.map(pool => {
          const entry = latestByPool[pool];
          const poolEntriesAsc = recirculacion.filter(e => e.pool === pool).sort((a, b) => a.date.localeCompare(b.date));
          const prevEntry = poolEntriesAsc.length > 1 ? poolEntriesAsc[poolEntriesAsc.length - 2] : null;
          const dR = entry && prevEntry ? Math.round(entry.contadorRecirculacion - prevEntry.contadorRecirculacion) : null;
          const dA = entry && prevEntry ? Math.round(entry.contadorDepuracion - prevEntry.contadorDepuracion) : null;
          const dH = entry && prevEntry ? Math.round((entry.horasFiltraje - prevEntry.horasFiltraje) * 10) / 10 : null;
          const pw = DELTA_WARN[pool] ?? { recircMin: 0, renovadaMax: 9999, horasMin: 0 };
          const pVol = POOL_VOLUME[pool];
          const tiempoRecirc = calcTiempoRecirc(pVol, dR, dH);

          return (
            <div key={pool} className="card"
              style={{ padding: '18px', borderTop: `3px solid ${POOL_COLORS[pool] ?? '#94a3b8'}`, cursor: 'pointer', outline: selectedPool === pool ? `2px solid ${POOL_COLORS[pool] ?? '#94a3b8'}` : 'none' }}
              onClick={() => setSelectedPool(pool)}>
              <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#0f1f3d' }}>{pool}</h3>
              <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#94a3b8' }}>Volumen: {pVol} m³</p>
              {entry ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>🔄 Recirculación</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{fmt(entry.contadorRecirculacion)} m³</span>
                  </div>
                  {dR !== null && <div style={{ display: 'flex', justifyContent: 'flex-end' }}><span className={deltaClass(dR, pw.recircMin, true)} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{fmtDelta(dR)} m³/día</span></div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>💧 Agua renovada</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{fmt(entry.contadorDepuracion)} m³</span>
                  </div>
                  {dA !== null && <div style={{ display: 'flex', justifyContent: 'flex-end' }}><span className={deltaClass(dA, pw.renovadaMax, false)} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{fmtDelta(dA)} m³/día</span></div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>⏱️ Horas filtraje</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{entry.horasFiltraje} h</span>
                  </div>
                  {dH !== null && <div style={{ display: 'flex', justifyContent: 'flex-end' }}><span className={deltaClass(dH, pw.horasMin, true)} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{fmtDelta(dH)} h/día</span></div>}
                  {entry.presionFiltros != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>🔵 Presión filtros</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{entry.presionFiltros.toFixed(2)} bar</span>
                    </div>
                  )}
                  {tiempoRecirc !== '—' && (
                    <div style={{ marginTop: '4px', padding: '8px 10px', background: '#f0f9ff', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#0077cc', fontWeight: '600' }}>🕐 Tiempo recirculación</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#0077cc' }}>{tiempoRecirc}</span>
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Última lectura: {entry.date}</div>
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Sin datos</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda colores delta */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Variación diaria (Δ/día):</span>
        <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '600' }}>● Verde: cumple el umbral</span>
        <span style={{ fontSize: '11px', color: '#d97706', fontWeight: '600' }}>● Naranja: no cumple el umbral (revisar)</span>
        <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>● Rojo: valor negativo (revisar lectura)</span>
      </div>

      {/* Umbrales actuales */}
      <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569' }}>
        <strong>Umbrales para {selectedPool}:</strong> &nbsp;
        Recirculación mín. {fmt(warn.recircMin)} m³/día · Agua renovada máx. {fmt(warn.renovadaMax)} m³/día · Horas filtraje mín. {warn.horasMin} h/día
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {(['resumen', 'tabla'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0f1f3d' : '#64748b', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
            {t === 'resumen' ? '📊 Últimos valores' : '📋 Histórico con deltas'}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', marginRight: '8px' }}>Piscina:</label>
        <select className="input-field" style={{ width: 'auto' }} value={selectedPool} onChange={e => setSelectedPool(e.target.value)}>
          {activePools.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Resumen detallado */}
      {tab === 'resumen' && last && (() => {
        const d = withDeltas[0];
        return (
          <div className="card" style={{ padding: '20px', maxWidth: '560px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f1f3d', marginBottom: '4px', borderLeft: `4px solid ${POOL_COLORS[selectedPool] ?? '#94a3b8'}`, paddingLeft: '12px' }}>
              {selectedPool} — {last.date}
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px', paddingLeft: '16px' }}>Volumen: {vol} m³</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Contador Recirculación', value: fmt(last.contadorRecirculacion), unit: 'm³', icon: '🔄', deltaKey: 'deltaRecirc' as const, threshold: warn.recircMin, isMin: true },
                { label: 'Contador Agua Renovada',  value: fmt(last.contadorDepuracion),   unit: 'm³', icon: '💧', deltaKey: 'deltaRenovada' as const, threshold: warn.renovadaMax, isMin: false },
                { label: 'Horas de Filtraje',       value: String(last.horasFiltraje),      unit: 'h',  icon: '⏱️', deltaKey: 'deltaHoras' as const, threshold: warn.horasMin, isMin: true },
              ].map(item => {
                const delta = d ? d[item.deltaKey] : null;
                const dc = deltaClass(delta, item.threshold, item.isMin);
                return (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2eaf4' }}>
                    <span style={{ fontSize: '22px' }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{item.label}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                        {item.isMin ? `Mínimo: ${fmt(item.threshold)}` : `Máximo: ${fmt(item.threshold)}`} {item.unit}/día
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#0f1f3d' }}>{item.value} <span style={{ fontSize: '13px', fontWeight: '400', color: '#94a3b8' }}>{item.unit}</span></p>
                      {delta !== null && <p className={dc} style={{ margin: 0, fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{fmtDelta(delta)} {item.unit}/día</p>}
                    </div>
                  </div>
                );
              })}

              {last.presionFiltros != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '22px' }}>🔵</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#0077cc', fontWeight: '600' }}>Presión Filtros</p>
                  </div>
                  <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#0077cc' }}>{last.presionFiltros.toFixed(2)} <span style={{ fontSize: '13px', fontWeight: '400', color: '#94a3b8' }}>bar</span></p>
                </div>
              )}

              {(() => {
                const d2 = withDeltas[0];
                if (!d2) return null;
                const tr = calcTiempoRecirc(vol, d2.deltaRecirc, d2.deltaHoras);
                if (tr === '—') return null;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', background: '#e6f4ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                    <span style={{ fontSize: '22px' }}>🕐</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#0077cc', fontWeight: '600' }}>Tiempo de recirculación estimado</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Volumen ({vol} m³) / Caudal medio</p>
                    </div>
                    <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#0077cc' }}>{tr}</p>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {tab === 'resumen' && !last && (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8' }}>No hay datos para {selectedPool}</p>
        </div>
      )}

      {/* Tabla histórico */}
      {tab === 'tabla' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {isAdmin && (
            <div style={{ padding: '9px 14px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe', fontSize: '12px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔑 <strong>Modo admin:</strong> Puedes borrar registros individuales con el botón de cada fila.
            </div>
          )}
          <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Recirculación (m³)</th><th>Δ Recirc./día</th>
                  <th>Agua Renovada (m³)</th><th>Δ Renovada/día</th>
                  <th>Horas Filtraje</th><th>Δ Horas/día</th>
                  <th>Presión Filtros (bar)</th>
                  <th>Tº Recirculación</th>
                  {isAdmin && <th style={{ width: '90px' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {withDeltas.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{e.date}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(e.contadorRecirculacion)}</td>
                    <td className={deltaClass(e.deltaRecirc, warn.recircMin, true)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{fmtDelta(e.deltaRecirc)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(e.contadorDepuracion)}</td>
                    <td className={deltaClass(e.deltaRenovada, warn.renovadaMax, false)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{fmtDelta(e.deltaRenovada)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{e.horasFiltraje}</td>
                    <td className={deltaClass(e.deltaHoras, warn.horasMin, true)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{fmtDelta(e.deltaHoras)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: e.presionFiltros != null ? '#0077cc' : '#94a3b8', fontWeight: e.presionFiltros != null ? '600' : '400' }}>
                      {e.presionFiltros != null ? `${e.presionFiltros.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#0077cc', fontWeight: '600' }}>
                      {calcTiempoRecirc(vol, e.deltaRecirc, e.deltaHoras)}
                    </td>
                    {isAdmin && (
                      <td>
                        <button
                          onClick={() => {
                            if (confirm(`¿Borrar el registro del ${e.date}?`)) deleteRecirculacion(e.id);
                          }}
                          style={{
                            background: 'none', border: '1px solid #fca5a5', borderRadius: '6px',
                            color: '#dc2626', cursor: 'pointer', fontSize: '11px', padding: '3px 8px',
                            fontWeight: '600',
                          }}
                          title="Borrar este registro"
                        >
                          🗑 Borrar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

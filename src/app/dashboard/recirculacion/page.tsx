'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import type { PoolName } from '@/types';

const POOL_COLORS: Record<string, string> = {
  'P. Grande': '#0077cc', 'P. Peq.-Med.': '#0f6e56', 'SPA': '#7c3aed', 'Pileta': '#c2410c',
  'P. Ext. Grande': '#0891b2', 'P. Ext. Pequeña': '#059669', 'Splash': '#d97706',
};

// Umbrales de variación diaria "razonable" (para alertar si hay algo raro)
// Si la diferencia entre dos días consecutivos supera el máximo, se marca
const DELTA_WARN: Record<string, { recircMax: number; renovadaMax: number; horasMax: number }> = {
  'P. Grande':       { recircMax: 60000, renovadaMax: 2000, horasMax: 26 },
  'P. Peq.-Med.':   { recircMax: 50000, renovadaMax: 1500, horasMax: 26 },
  'SPA':             { recircMax: 20000, renovadaMax: 500,  horasMax: 25 },
  'Pileta':          { recircMax: 5000,  renovadaMax: 300,  horasMax: 25 },
  'P. Ext. Grande':  { recircMax: 60000, renovadaMax: 2000, horasMax: 26 },
  'P. Ext. Pequeña': { recircMax: 40000, renovadaMax: 1500, horasMax: 26 },
  'Splash':          { recircMax: 20000, renovadaMax: 500,  horasMax: 25 },
};

function deltaClass(v: number | null, max: number) {
  if (v === null || v === undefined) return '';
  if (v < 0) return 'val-danger';           // negativo = error de lectura
  if (v > max) return 'val-warning';
  return 'val-ok';
}

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('es-ES');
}

function fmtDelta(d: number | null) {
  if (d === null) return '—';
  const sign = d >= 0 ? '+' : '';
  return `${sign}${d.toLocaleString('es-ES')}`;
}

export default function RecirculacionPage() {
  const { hasPermission, recirculacion, activePools } = useApp();
  const [selectedPool, setSelectedPool] = useState<string>(activePools[0] ?? 'P. Grande');
  const [tab, setTab] = useState<'resumen' | 'tabla'>('resumen');

  if (!hasPermission('view_recirculacion')) {
    return <div className="alert-banner alert-danger"><span>⛔</span> Sin permiso para ver esta sección.</div>;
  }

  // Última lectura por piscina
  const latestByPool: Record<string, typeof recirculacion[0]> = {};
  for (const e of recirculacion) {
    if (!latestByPool[e.pool] || e.date > latestByPool[e.pool].date) latestByPool[e.pool] = e;
  }

  // Entradas de la piscina seleccionada, ordenadas descendente (más reciente primero)
  const poolEntries = useMemo(() =>
    recirculacion.filter(e => e.pool === selectedPool).sort((a, b) => b.date.localeCompare(a.date)),
    [recirculacion, selectedPool]
  );

  const last = latestByPool[selectedPool];
  const warn = DELTA_WARN[selectedPool] ?? { recircMax: 99999, renovadaMax: 9999, horasMax: 26 };

  // Calcular deltas diarios (diferencia con la entrada anterior, en orden cronológico)
  const entriesAsc = [...poolEntries].reverse(); // cronológico para calcular deltas
  const withDeltas = poolEntries.map((e, idx) => {
    // idx en poolEntries (desc) → idx en entriesAsc (asc) es (entriesAsc.length - 1 - idx)
    const ascIdx = entriesAsc.length - 1 - idx;
    const prev = ascIdx > 0 ? entriesAsc[ascIdx - 1] : null;
    return {
      ...e,
      deltaRecirc:   prev ? Math.round(e.contadorRecirculacion - prev.contadorRecirculacion) : null,
      deltaRenovada: prev ? Math.round(e.contadorDepuracion - prev.contadorDepuracion) : null,
      deltaHoras:    prev ? Math.round((e.horasFiltraje - prev.horasFiltraje) * 10) / 10 : null,
    };
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f1f3d', margin: '0 0 4px' }}>🔄 Recirculación</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Contadores de recirculación, agua renovada y horas de filtraje</p>
        </div>
      </div>

      {/* Tarjetas resumen por piscina */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {activePools.map(pool => {
          const entry = latestByPool[pool];
          // Penúltima entrada para calcular delta del día
          const poolEntriesAsc = recirculacion.filter(e => e.pool === pool).sort((a, b) => a.date.localeCompare(b.date));
          const prevEntry = poolEntriesAsc.length > 1 ? poolEntriesAsc[poolEntriesAsc.length - 2] : null;
          const dR = entry && prevEntry ? Math.round(entry.contadorRecirculacion - prevEntry.contadorRecirculacion) : null;
          const dA = entry && prevEntry ? Math.round(entry.contadorDepuracion - prevEntry.contadorDepuracion) : null;
          const dH = entry && prevEntry ? Math.round((entry.horasFiltraje - prevEntry.horasFiltraje) * 10) / 10 : null;
          const pw = DELTA_WARN[pool] ?? { recircMax: 99999, renovadaMax: 9999, horasMax: 26 };

          return (
            <div key={pool} className="card"
              style={{ padding: '18px', borderTop: `3px solid ${POOL_COLORS[pool] ?? '#94a3b8'}`, cursor: 'pointer', outline: selectedPool === pool ? `2px solid ${POOL_COLORS[pool] ?? '#94a3b8'}` : 'none' }}
              onClick={() => setSelectedPool(pool)}>
              <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '600', color: '#0f1f3d' }}>{pool}</h3>
              {entry ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Contador recirculación */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>🔄 Recirculación</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{fmt(entry.contadorRecirculacion)} m³</span>
                    </div>
                    {dR !== null && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span className={deltaClass(dR, pw.recircMax)} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                          {fmtDelta(dR)} m³/día
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Agua renovada */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>💧 Agua renovada</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{fmt(entry.contadorDepuracion)} m³</span>
                    </div>
                    {dA !== null && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span className={deltaClass(dA, pw.renovadaMax)} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                          {fmtDelta(dA)} m³/día
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Horas filtraje */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>⏱️ Horas filtraje</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{entry.horasFiltraje} h</span>
                    </div>
                    {dH !== null && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span className={deltaClass(dH, pw.horasMax)} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                          {fmtDelta(dH)} h/día
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Última lectura: {entry.date}</div>
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Sin datos</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda de colores de delta */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Variación diaria:</span>
        <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '600' }}>● Verde: normal</span>
        <span style={{ fontSize: '11px', color: '#d97706', fontWeight: '600' }}>● Naranja: supera umbral</span>
        <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>● Rojo: valor negativo (revisar)</span>
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

      {/* Resumen detallado de la piscina seleccionada */}
      {tab === 'resumen' && last && (
        <div className="card" style={{ padding: '20px', maxWidth: '520px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f1f3d', marginBottom: '16px', borderLeft: `4px solid ${POOL_COLORS[selectedPool] ?? '#94a3b8'}`, paddingLeft: '12px' }}>
            {selectedPool} — {last.date}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Contador Recirculación', value: fmt(last.contadorRecirculacion), unit: 'm³', icon: '🔄', deltaKey: 'deltaRecirc' as const },
              { label: 'Contador Agua Renovada', value: fmt(last.contadorDepuracion),    unit: 'm³', icon: '💧', deltaKey: 'deltaRenovada' as const },
              { label: 'Horas de Filtraje',      value: String(last.horasFiltraje),       unit: 'h',  icon: '⏱️', deltaKey: 'deltaHoras' as const },
            ].map(item => {
              const deltaEntry = withDeltas[0]; // primer item = más reciente
              const delta = deltaEntry ? (deltaEntry as any)[item.deltaKey] : null;
              return (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px' }}>
                  <span style={{ fontSize: '22px' }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#64748b' }}>{item.label}</p>
                    <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f1f3d', fontFamily: 'var(--font-mono)' }}>
                      {item.value} <span style={{ fontSize: '13px', fontWeight: '400', color: '#94a3b8' }}>{item.unit}</span>
                    </p>
                  </div>
                  {delta !== null && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#94a3b8' }}>variación/día</p>
                      <p className={deltaClass(delta, 99999)} style={{ margin: 0, fontSize: '14px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                        {fmtDelta(delta)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabla histórico con deltas */}
      {tab === 'tabla' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Recirculación (m³)</th>
                  <th>Δ Recirc./día</th>
                  <th>Agua Renovada (m³)</th>
                  <th>Δ Renovada/día</th>
                  <th>Horas Filtraje</th>
                  <th>Δ Horas/día</th>
                </tr>
              </thead>
              <tbody>
                {withDeltas.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{e.date}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(e.contadorRecirculacion)}</td>
                    <td className={deltaClass(e.deltaRecirc, warn.recircMax)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                      {fmtDelta(e.deltaRecirc)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(e.contadorDepuracion)}</td>
                    <td className={deltaClass(e.deltaRenovada, warn.renovadaMax)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                      {fmtDelta(e.deltaRenovada)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{e.horasFiltraje}</td>
                    <td className={deltaClass(e.deltaHoras, warn.horasMax)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                      {fmtDelta(e.deltaHoras)}
                    </td>
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

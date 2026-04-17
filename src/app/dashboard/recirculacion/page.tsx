'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import type { PoolName } from '@/types';

const POOL_COLORS: Record<string, string> = {
  'P. Grande': '#0077cc', 'P. Peq.-Med.': '#0f6e56', 'SPA': '#7c3aed', 'Pileta': '#c2410c',
  'P. Ext. Grande': '#0891b2', 'P. Ext. Pequeña': '#059669', 'Splash': '#d97706',
};

export default function RecirculacionPage() {
  const { hasPermission, recirculacion, activePools } = useApp();
  const [selectedPool, setSelectedPool] = useState<string>(activePools[0] ?? 'P. Grande');
  const [tab, setTab] = useState<'resumen' | 'tabla'>('resumen');

  if (!hasPermission('view_recirculacion')) {
    return <div className="alert-banner alert-danger"><span>⛔</span> Sin permiso para ver esta sección.</div>;
  }

  // Latest entry per pool
  const latestByPool: Record<string, typeof recirculacion[0]> = {};
  for (const e of recirculacion) {
    if (!latestByPool[e.pool] || e.date > latestByPool[e.pool].date) latestByPool[e.pool] = e;
  }

  // Entries for selected pool
  const poolEntries = recirculacion.filter(e => e.pool === selectedPool).sort((a, b) => b.date.localeCompare(a.date));
  const last = latestByPool[selectedPool];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f1f3d', margin: '0 0 4px' }}>🔄 Recirculación</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Contadores de recirculación, depuración y horas de filtraje</p>
        </div>
      </div>

      {/* Resumen cards per pool */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {activePools.map(pool => {
          const entry = latestByPool[pool];
          return (
            <div key={pool} className="card" style={{ padding: '18px', borderTop: `3px solid ${POOL_COLORS[pool] ?? '#94a3b8'}`, cursor: 'pointer', outline: selectedPool === pool ? `2px solid ${POOL_COLORS[pool] ?? '#94a3b8'}` : 'none' }} onClick={() => setSelectedPool(pool)}>
              <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '600', color: '#0f1f3d' }}>{pool}</h3>
              {entry ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Recirculación</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{entry.contadorRecirculacion.toLocaleString('es-ES')} m³</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Depuración</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{entry.contadorDepuracion.toLocaleString('es-ES')} m³</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Horas filtraje</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{entry.horasFiltraje} h</span>
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

      {/* Tabs for detail */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {(['resumen', 'tabla'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0f1f3d' : '#64748b', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
            {t === 'resumen' ? '📊 Últimos valores' : '📋 Histórico tabla'}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', marginRight: '8px' }}>Piscina:</label>
        <select className="input-field" style={{ width: 'auto' }} value={selectedPool} onChange={e => setSelectedPool(e.target.value)}>
          {activePools.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {tab === 'resumen' && last && (
        <div className="card" style={{ padding: '20px', maxWidth: '500px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f1f3d', marginBottom: '16px', borderLeft: `4px solid ${POOL_COLORS[selectedPool] ?? '#94a3b8'}`, paddingLeft: '12px' }}>
            {selectedPool} — {last.date}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Contador Recirculación', value: last.contadorRecirculacion.toLocaleString('es-ES'), unit: 'm³', icon: '🔄' },
              { label: 'Contador Depuración', value: last.contadorDepuracion.toLocaleString('es-ES'), unit: 'm³', icon: '🧹' },
              { label: 'Horas de Filtraje', value: last.horasFiltraje.toString(), unit: 'h', icon: '⏱️' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px' }}>
                <span style={{ fontSize: '22px' }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#64748b' }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f1f3d', fontFamily: 'var(--font-mono)' }}>
                    {item.value} <span style={{ fontSize: '13px', fontWeight: '400', color: '#94a3b8' }}>{item.unit}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'tabla' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Recirculación (m³)</th>
                  <th>Depuración (m³)</th>
                  <th>Horas Filtraje</th>
                </tr>
              </thead>
              <tbody>
                {poolEntries.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{e.date}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{e.contadorRecirculacion.toLocaleString('es-ES')}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{e.contadorDepuracion.toLocaleString('es-ES')}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{e.horasFiltraje}</td>
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

'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useApp } from '@/lib/store';

const ZONAS = ['Zona Piscinas', 'Vestuarios', 'Sala Máquinas', 'Recepción', 'Almacén'];
const TIPOS = ['Extintor', 'BIE', 'Detector humos', 'Salida emergencia', 'Rociador'];

export default function IncendiosPage() {
  const { hasPermission, incendios } = useApp();
  const [filterZona, setFilterZona] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterResult, setFilterResult] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], tipo: TIPOS[0], zona: ZONAS[0], resultado: 'OK', observaciones: '', responsable: '' });

  if (!hasPermission('view_incendios')) {
    return <div className="alert-banner alert-danger"><span>⛔</span> Sin permiso.</div>;
  }
  const canEdit = hasPermission('edit_incendios');

  const filtered = incendios.filter(i =>
    (!filterZona || i.zona === filterZona) &&
    (!filterTipo || i.tipo === filterTipo) &&
    (!filterResult || i.resultado === filterResult)
  );

  const totals = {
    ok: incendios.filter(i => i.resultado === 'OK').length,
    fallo: incendios.filter(i => i.resultado === 'FALLO').length,
    pendiente: incendios.filter(i => i.resultado === 'PENDIENTE').length,
  };

  // Group by zona for summary cards
  const zonaStatus = ZONAS.map(zona => {
    const zItems = incendios.filter(i => i.zona === zona);
    const fallos = zItems.filter(i => i.resultado === 'FALLO').length;
    const pendientes = zItems.filter(i => i.resultado === 'PENDIENTE').length;
    return { zona, total: zItems.length, fallos, pendientes, ok: zItems.filter(i => i.resultado === 'OK').length };
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f1f3d', margin: '0 0 4px' }}>🔥 Sistemas Contra Incendios</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Revisiones periódicas de extintores, BIE, detectores y salidas</p>
        </div>
        {canEdit && <button className="btn btn-primary" onClick={() => setFormOpen(true)}>+ Nueva revisión</button>}
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div className="metric-card" style={{ borderTop: '3px solid #22c55e' }}>
          <div className="metric-label">Revisiones OK</div>
          <div className="metric-value" style={{ fontSize: '24px', color: '#15803d' }}>{totals.ok}</div>
          <div className="metric-sub">{((totals.ok / incendios.length) * 100).toFixed(0)}% del total</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #ef4444' }}>
          <div className="metric-label">Fallos detectados</div>
          <div className="metric-value" style={{ fontSize: '24px', color: '#dc2626' }}>{totals.fallo}</div>
          <div className="metric-sub">requieren actuación</div>
        </div>
        <div className="metric-card" style={{ borderTop: '3px solid #f59e0b' }}>
          <div className="metric-label">Pendientes</div>
          <div className="metric-value" style={{ fontSize: '24px', color: '#d97706' }}>{totals.pendiente}</div>
          <div className="metric-sub">por revisar</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total revisiones</div>
          <div className="metric-value" style={{ fontSize: '24px' }}>{incendios.length}</div>
          <div className="metric-sub">registradas en 2026</div>
        </div>
      </div>

      {/* Alert for fallos */}
      {totals.fallo > 0 && (
        <div className="alert-banner alert-danger" style={{ marginBottom: '20px' }}>
          <span>🚨</span>
          <div>
            <strong>{totals.fallo} elemento{totals.fallo > 1 ? 's' : ''} con FALLO detectado{totals.fallo > 1 ? 's' : ''}</strong> — Requiere{totals.fallo > 1 ? 'n' : ''} revisión y actuación inmediata.
            Los equipos con fallos están marcados en rojo en la tabla.
          </div>
        </div>
      )}

      {/* Zone status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {zonaStatus.map(z => (
          <div key={z.zona} className="card" style={{ padding: '16px', borderLeft: `4px solid ${z.fallos > 0 ? '#ef4444' : z.pendientes > 0 ? '#f59e0b' : '#22c55e'}` }}>
            <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', color: '#0f1f3d' }}>{z.zona}</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span className="badge badge-ok">✓ {z.ok}</span>
              {z.fallos > 0 && <span className="badge badge-danger">✗ {z.fallos}</span>}
              {z.pendientes > 0 && <span className="badge badge-warning">⏳ {z.pendientes}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
        <select className="input-field" style={{ width: 'auto' }} value={filterZona} onChange={e => setFilterZona(e.target.value)}>
          <option value="">Todas las zonas</option>
          {ZONAS.map(z => <option key={z}>{z}</option>)}
        </select>
        <select className="input-field" style={{ width: 'auto' }} value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="input-field" style={{ width: 'auto' }} value={filterResult} onChange={e => setFilterResult(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="OK">OK</option>
          <option value="FALLO">Fallo</option>
          <option value="PENDIENTE">Pendiente</option>
        </select>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{filtered.length} registros</span>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Zona</th>
                <th>Tipo</th>
                <th>Resultado</th>
                <th>Observaciones</th>
                <th>Responsable</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id} style={{ background: i.resultado === 'FALLO' ? '#fff8f8' : undefined }}>
                  <td style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{i.date}</td>
                  <td>{i.zona}</td>
                  <td>{i.tipo}</td>
                  <td>
                    <span className={`badge ${i.resultado === 'OK' ? 'badge-ok' : i.resultado === 'FALLO' ? 'badge-danger' : 'badge-warning'}`}>
                      {i.resultado === 'OK' ? '✓ OK' : i.resultado === 'FALLO' ? '✗ Fallo' : '⏳ Pendiente'}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>{i.observaciones || '—'}</td>
                  <td>{i.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {formOpen && canEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f1f3d', margin: 0 }}>Nueva revisión contra incendios</h2>
              <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Fecha</label>
                <input className="input-field" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Zona</label>
                <select className="input-field" value={form.zona} onChange={e => setForm(p => ({ ...p, zona: e.target.value }))}>
                  {ZONAS.map(z => <option key={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Tipo</label>
                <select className="input-field" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Resultado</label>
                <select className="input-field" value={form.resultado} onChange={e => setForm(p => ({ ...p, resultado: e.target.value }))}>
                  <option>OK</option><option>FALLO</option><option>PENDIENTE</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Responsable</label>
                <input className="input-field" type="text" value={form.responsable} onChange={e => setForm(p => ({ ...p, responsable: e.target.value }))} placeholder="Nombre" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Observaciones</label>
                <textarea className="input-field" rows={2} value={form.observaciones} onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))} placeholder="Notas opcionales..." style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => { alert('Revisión guardada (demo)'); setFormOpen(false); }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

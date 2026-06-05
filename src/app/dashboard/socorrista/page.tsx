'use client';
export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import type { IntervencionSocorrista, AforoEntry, PoolName } from '@/types';
import { AFORO_SAUNAS, AFORO_HOURS } from '@/types';

type TabKey = 'intervenciones' | 'aforo';

const POOL_COLORS: Record<string, string> = {
  'P. Grande':       '#0077cc',
  'P. Peq.-Med.':    '#0f6e56',
  'SPA':             '#7c3aed',
  'Pileta':          '#c2410c',
  'P. Ext. Grande':  '#0891b2',
  'P. Ext. Pequeña': '#059669',
  'Splash':          '#d97706',
  'Sauna Seca 1':    '#92400e',
  'Sauna Seca 2':    '#a16207',
  'Sauna Húmeda':    '#7e22ce',
  'Terma':           '#be123c',
};

const today = () => new Date().toISOString().slice(0, 10);
const nowDateTimeLocal = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ──────────────────────────────────────────────────────────────────────────────
export default function SocorristaPage() {
  const { currentUser, hasPermission } = useApp();
  const [tab, setTab] = useState<TabKey>('intervenciones');

  if (!hasPermission('view_socorrista') && currentUser?.role !== 'admin' && currentUser?.role !== 'socorrista') {
    return (
      <div style={{ maxWidth: '500px' }}>
        <div className="alert-banner alert-danger">
          <span>⛔</span> No tienes permiso para acceder a esta sección.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f1f3d', margin: '0 0 4px' }}>🚑 Socorrista</h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          Gestión de intervenciones sanitarias y control de aforo de la instalación
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        {[
          { key: 'intervenciones' as TabKey, label: 'Intervenciones', icon: '🩹', color: '#dc2626' },
          { key: 'aforo'          as TabKey, label: 'Aforo',          icon: '👥', color: '#0077cc' },
        ].map(t => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: '13px', fontWeight: active ? '700' : '500',
                color: active ? t.color : '#64748b',
                borderBottom: `2px solid ${active ? t.color : 'transparent'}`,
                display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
                marginBottom: '-1px', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '15px' }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'intervenciones' ? <IntervencionesTab /> : <AforoTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: INTERVENCIONES
// ═══════════════════════════════════════════════════════════════════════════════
function IntervencionesTab() {
  const { currentUser, intervenciones, addIntervencion, deleteIntervencion } = useApp();

  const [newOpen, setNewOpen]   = useState(false);
  const [search, setSearch]     = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');

  const [form, setForm] = useState({
    fechaHora:      nowDateTimeLocal(),
    edadPaciente:   '' as string,
    motivo:         '',
    actuacion:      '',
    materiales:     '',
    notaFinal:      '',
  });

  const resetForm = () => setForm({
    fechaHora:    nowDateTimeLocal(),
    edadPaciente: '',
    motivo:       '',
    actuacion:    '',
    materiales:   '',
    notaFinal:    '',
  });

  const handleCreate = async () => {
    if (!form.motivo.trim() || !form.actuacion.trim()) {
      alert('El motivo y la actuación son obligatorios');
      return;
    }
    await addIntervencion({
      fechaHora:      new Date(form.fechaHora).toISOString(),
      edadPaciente:   form.edadPaciente ? parseInt(form.edadPaciente, 10) : null,
      motivo:         form.motivo.trim(),
      actuacion:      form.actuacion.trim(),
      materiales:     form.materiales.trim(),
      notaFinal:      form.notaFinal.trim(),
      socorristaId:   currentUser?.id ?? '',
      socorristaName: currentUser?.name ?? 'Socorrista',
    });
    resetForm();
    setNewOpen(false);
  };

  // Filtrado
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return intervenciones.filter(i => {
      const d = i.fechaHora.slice(0, 10);
      if (fromDate && d < fromDate) return false;
      if (toDate   && d > toDate)   return false;
      if (!q) return true;
      return [
        i.motivo, i.actuacion, i.materiales, i.notaFinal,
        i.socorristaName, String(i.edadPaciente ?? ''),
      ].join(' ').toLowerCase().includes(q);
    });
  }, [intervenciones, search, fromDate, toDate]);

  const handleExportPDF = () => {
    if (filtered.length === 0) { alert('No hay intervenciones en el rango seleccionado'); return; }
    exportIntervencionesPDF(filtered, { fromDate, toDate });
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
        padding: '14px 16px', marginBottom: '16px',
        display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end',
      }}>
        <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
          <label style={lbl()}>Búsqueda</label>
          <input
            className="input-field"
            placeholder="Motivo, actuación, socorrista…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={lbl()}>Desde</label>
          <input className="input-field" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        </div>
        <div>
          <label style={lbl()}>Hasta</label>
          <input className="input-field" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
        <button className="btn btn-secondary" onClick={() => { setSearch(''); setFromDate(''); setToDate(''); }}>
          Limpiar
        </button>
        <button className="btn btn-secondary" onClick={handleExportPDF} disabled={filtered.length === 0}>
          📄 Exportar PDF
        </button>
        <button className="btn btn-primary" onClick={() => setNewOpen(true)}>
          + Nueva intervención
        </button>
      </div>

      {/* Contador */}
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px' }}>
        Mostrando <strong>{filtered.length}</strong> de {intervenciones.length} intervenciones
      </p>

      {/* Tabla */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '900px' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={th()}>Fecha y hora</th>
              <th style={th()}>Edad</th>
              <th style={th()}>Motivo</th>
              <th style={th()}>Actuación</th>
              <th style={th()}>Materiales</th>
              <th style={th()}>Nota</th>
              <th style={th()}>Socorrista</th>
              <th style={{ ...th(), textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  No hay intervenciones registradas
                </td>
              </tr>
            ) : filtered.map(i => (
              <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={td()}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#0f1f3d' }}>
                    {formatDateTime(i.fechaHora)}
                  </span>
                </td>
                <td style={td()}>
                  {i.edadPaciente != null ? (
                    <span style={{ fontWeight: 600 }}>{i.edadPaciente}</span>
                  ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                </td>
                <td style={td()}>{truncate(i.motivo, 60)}</td>
                <td style={td()}>{truncate(i.actuacion, 60)}</td>
                <td style={{ ...td(), color: '#64748b', fontSize: '12px' }}>{truncate(i.materiales || '—', 40)}</td>
                <td style={{ ...td(), color: '#64748b', fontSize: '12px' }}>{truncate(i.notaFinal || '—', 40)}</td>
                <td style={td()}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: '10px',
                    background: '#dbeafe', color: '#1e40af', fontSize: '11px', fontWeight: 600,
                  }}>
                    {i.socorristaName}
                  </span>
                </td>
                <td style={{ ...td(), textAlign: 'right' }}>
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar esta intervención?')) deleteIntervencion(i.id);
                      }}
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: '#dc2626', fontSize: '14px',
                      }}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nueva intervención */}
      {newOpen && (
        <div style={modalOverlay()}>
          <div className="card" style={{
            padding: '24px 28px', width: '100%', maxWidth: '640px',
            maxHeight: '90vh', overflowY: 'auto', background: '#fff',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f1f3d', margin: 0 }}>🩹 Nueva intervención</h2>
              <button onClick={() => { setNewOpen(false); resetForm(); }} style={closeBtn()}>×</button>
            </div>

            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={lbl()}>Fecha y hora *</label>
                  <input className="input-field" type="datetime-local"
                    value={form.fechaHora}
                    onChange={e => setForm(p => ({ ...p, fechaHora: e.target.value }))}
                    style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={lbl()}>Edad del paciente</label>
                  <input className="input-field" type="number" min={0} max={120}
                    placeholder="Ej. 34"
                    value={form.edadPaciente}
                    onChange={e => setForm(p => ({ ...p, edadPaciente: e.target.value }))}
                    style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <label style={lbl()}>Motivo de la atención *</label>
                <input className="input-field"
                  placeholder="Ej. Mareo en vestuarios"
                  value={form.motivo}
                  onChange={e => setForm(p => ({ ...p, motivo: e.target.value }))}
                  style={{ width: '100%' }} />
              </div>

              <div>
                <label style={lbl()}>Actuación realizada *</label>
                <textarea className="input-field"
                  placeholder="Ej. Aplicación de compresas frías, posición de seguridad, observación 10 min…"
                  value={form.actuacion}
                  onChange={e => setForm(p => ({ ...p, actuacion: e.target.value }))}
                  style={{ width: '100%', minHeight: '70px', fontFamily: 'inherit' }} />
              </div>

              <div>
                <label style={lbl()}>Materiales utilizados</label>
                <textarea className="input-field"
                  placeholder="Ej. 2 vendas elásticas, suero fisiológico, tiritas"
                  value={form.materiales}
                  onChange={e => setForm(p => ({ ...p, materiales: e.target.value }))}
                  style={{ width: '100%', minHeight: '50px', fontFamily: 'inherit' }} />
              </div>

              <div>
                <label style={lbl()}>Nota final / cierre</label>
                <textarea className="input-field"
                  placeholder="Ej. Paciente recuperado, abandona instalación por su propio pie"
                  value={form.notaFinal}
                  onChange={e => setForm(p => ({ ...p, notaFinal: e.target.value }))}
                  style={{ width: '100%', minHeight: '50px', fontFamily: 'inherit' }} />
              </div>

              <div style={{
                background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px',
                padding: '10px 14px', fontSize: '12px', color: '#1e40af',
              }}>
                👤 Esta intervención quedará registrada a tu nombre: <strong>{currentUser?.name}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => { setNewOpen(false); resetForm(); }}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate}>Guardar intervención</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: AFORO
// ═══════════════════════════════════════════════════════════════════════════════
function AforoTab() {
  const { currentUser, activePools, aforo, upsertAforo, deleteAforoDay } = useApp();

  const [date, setDate] = useState(today());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Lista de "piscinas" (incluyendo saunas) para el día seleccionado
  const venues = useMemo(() => {
    return [...activePools, ...AFORO_SAUNAS];
  }, [activePools]);

  // Lookup rápido: (hour, pool) → AforoEntry
  const dayEntries = useMemo(() => {
    return aforo.filter(a => a.date === date);
  }, [aforo, date]);

  const lookup = useMemo(() => {
    const m = new Map<string, AforoEntry>();
    for (const e of dayEntries) m.set(`${e.hour}|${e.pool}`, e);
    return m;
  }, [dayEntries]);

  const isToday = date === today();
  const canEdit = isToday || currentUser?.role === 'admin';

  const handleCellChange = async (hour: number, pool: string, value: string) => {
    const n = value === '' ? 0 : Math.max(0, parseInt(value, 10) || 0);
    await upsertAforo({
      date,
      hour,
      pool,
      cantidad:       n,
      socorristaId:   currentUser?.id ?? '',
      socorristaName: currentUser?.name ?? 'Socorrista',
    });
  };

  const totalsByHour = useMemo(() => {
    const t: Record<number, number> = {};
    for (const h of AFORO_HOURS) {
      t[h] = venues.reduce((acc, p) => acc + (lookup.get(`${h}|${p}`)?.cantidad ?? 0), 0);
    }
    return t;
  }, [venues, lookup]);

  const totalsByVenue = useMemo(() => {
    const t: Record<string, number> = {};
    for (const p of venues) {
      t[p] = AFORO_HOURS.reduce((acc, h) => acc + (lookup.get(`${h}|${p}`)?.cantidad ?? 0), 0);
    }
    return t;
  }, [venues, lookup]);

  const totalDay = AFORO_HOURS.reduce((acc, h) => acc + totalsByHour[h], 0);

  // Histórico filtrado
  const historyDays = useMemo(() => {
    const grouped = new Map<string, AforoEntry[]>();
    for (const e of aforo) {
      if (fromDate && e.date < fromDate) continue;
      if (toDate   && e.date > toDate)   continue;
      const arr = grouped.get(e.date) ?? [];
      arr.push(e);
      grouped.set(e.date, arr);
    }
    return Array.from(grouped.entries())
      .sort((a, b) => b[0].localeCompare(a[0]));
  }, [aforo, fromDate, toDate]);

  const handleExportPDF = () => {
    if (historyDays.length === 0) { alert('No hay datos de aforo en el rango seleccionado'); return; }
    exportAforoPDF(historyDays, venues, { fromDate, toDate });
  };

  return (
    <div>
      {/* Selector fecha + acciones */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
        padding: '14px 16px', marginBottom: '16px',
        display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end',
      }}>
        <div>
          <label style={lbl()}>Día</label>
          <input className="input-field" type="date" value={date}
            onChange={e => setDate(e.target.value)} />
        </div>
        <button className="btn btn-secondary" onClick={() => setDate(today())}>Hoy</button>
        <div style={{ flex: 1 }} />
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px',
          padding: '8px 14px',
        }}>
          <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>TOTAL DEL DÍA</span>
          <p style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: 700, color: '#15803d', fontFamily: 'var(--font-mono)' }}>
            {totalDay.toLocaleString('es-ES')}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowHistory(s => !s)}>
          {showHistory ? '↑ Ocultar histórico' : '↓ Ver histórico'}
        </button>
      </div>

      {!canEdit && (
        <div className="alert-banner" style={{ background: '#fef3c7', border: '1px solid #fcd34d', color: '#78350f', marginBottom: '12px' }}>
          <span>🔒</span> Estás viendo un día pasado en modo lectura.
        </div>
      )}

      {/* Grid principal */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'auto', marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '900px' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0 }}>
            <tr>
              <th style={{ ...th(), position: 'sticky', left: 0, background: '#f8fafc', minWidth: '120px' }}>Hora</th>
              {venues.map(p => (
                <th key={p} style={{ ...th(), textAlign: 'center', minWidth: '90px', borderLeft: `3px solid ${POOL_COLORS[p] ?? '#cbd5e1'}` }}>
                  <span style={{ fontSize: '11px' }}>{p}</span>
                </th>
              ))}
              <th style={{ ...th(), textAlign: 'center', background: '#f0fdf4', color: '#15803d' }}>Σ</th>
            </tr>
          </thead>
          <tbody>
            {AFORO_HOURS.map(h => (
              <tr key={h} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ ...td(), fontWeight: 600, color: '#0f1f3d', position: 'sticky', left: 0, background: '#fff' }}>
                  {String(h).padStart(2, '0')}:00
                </td>
                {venues.map(p => {
                  const entry = lookup.get(`${h}|${p}`);
                  return (
                    <td key={p} style={{ ...td(), padding: '4px 6px', textAlign: 'center', borderLeft: `3px solid ${POOL_COLORS[p] ?? '#cbd5e1'}33` }}>
                      <input
                        type="number" min={0}
                        defaultValue={entry?.cantidad ?? ''}
                        disabled={!canEdit}
                        onBlur={e => {
                          const newVal = e.target.value;
                          const oldVal = String(entry?.cantidad ?? '');
                          if (newVal !== oldVal && (newVal !== '' || entry)) {
                            handleCellChange(h, p, newVal);
                          }
                        }}
                        style={{
                          width: '70px', textAlign: 'center',
                          padding: '6px 4px', borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          fontFamily: 'var(--font-mono)', fontWeight: 600,
                          color: entry?.cantidad ? '#0f1f3d' : '#cbd5e1',
                          background: canEdit ? '#fff' : '#f8fafc',
                        }}
                        placeholder="–"
                      />
                    </td>
                  );
                })}
                <td style={{ ...td(), textAlign: 'center', fontWeight: 700, color: '#15803d', background: '#f0fdf41a' }}>
                  {totalsByHour[h] || ''}
                </td>
              </tr>
            ))}
            <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0', fontWeight: 700 }}>
              <td style={{ ...td(), color: '#15803d', position: 'sticky', left: 0, background: '#f8fafc' }}>Σ Total</td>
              {venues.map(p => (
                <td key={p} style={{ ...td(), textAlign: 'center', color: '#15803d', fontFamily: 'var(--font-mono)' }}>
                  {totalsByVenue[p] || ''}
                </td>
              ))}
              <td style={{ ...td(), textAlign: 'center', color: '#15803d', fontFamily: 'var(--font-mono)', fontSize: '15px' }}>
                {totalDay || ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Histórico */}
      {showHistory && (
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f1f3d', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 12px' }}>
            📚 Histórico de aforo
          </h2>
          <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
            padding: '14px 16px', marginBottom: '16px',
            display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end',
          }}>
            <div>
              <label style={lbl()}>Desde</label>
              <input className="input-field" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div>
              <label style={lbl()}>Hasta</label>
              <input className="input-field" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <button className="btn btn-secondary" onClick={() => { setFromDate(''); setToDate(''); }}>Limpiar</button>
            <button className="btn btn-secondary" onClick={handleExportPDF} disabled={historyDays.length === 0}>
              📄 Exportar PDF
            </button>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={th()}>Día</th>
                  <th style={{ ...th(), textAlign: 'center' }}>Total</th>
                  <th style={{ ...th(), textAlign: 'center' }}>Pico</th>
                  <th style={{ ...th(), textAlign: 'center' }}>Registros</th>
                  <th style={{ ...th(), textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {historyDays.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    No hay datos en el rango seleccionado
                  </td></tr>
                ) : historyDays.map(([d, entries]) => {
                  const total = entries.reduce((a, e) => a + e.cantidad, 0);
                  const byHour: Record<number, number> = {};
                  for (const e of entries) byHour[e.hour] = (byHour[e.hour] ?? 0) + e.cantidad;
                  const pico = Math.max(0, ...Object.values(byHour));
                  return (
                    <tr key={d} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={td()}>
                        <button onClick={() => setDate(d)} style={{
                          background: 'none', border: 'none', color: '#0057a8',
                          cursor: 'pointer', fontWeight: 600, padding: 0,
                        }}>
                          {formatDate(d)}
                        </button>
                      </td>
                      <td style={{ ...td(), textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{total.toLocaleString('es-ES')}</td>
                      <td style={{ ...td(), textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{pico}</td>
                      <td style={{ ...td(), textAlign: 'center', color: '#64748b' }}>{entries.length}</td>
                      <td style={{ ...td(), textAlign: 'right' }}>
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar TODOS los registros del día ${d}?`)) deleteAforoDay(d);
                            }}
                            style={{
                              background: 'transparent', border: 'none', cursor: 'pointer',
                              color: '#dc2626', fontSize: '14px',
                            }}
                          >🗑️</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers comunes
// ──────────────────────────────────────────────────────────────────────────────
const lbl = (): React.CSSProperties => ({
  display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px',
});
const th = (): React.CSSProperties => ({
  padding: '10px 12px', textAlign: 'left', fontSize: '11px',
  fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em',
});
const td = (): React.CSSProperties => ({
  padding: '10px 12px', verticalAlign: 'middle',
});
const modalOverlay = (): React.CSSProperties => ({
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
});
const closeBtn = (): React.CSSProperties => ({
  background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8',
});

function truncate(s: string, n: number) {
  if (!s) return s;
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
function formatDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatDate(d: string) {
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PDFs
// ═══════════════════════════════════════════════════════════════════════════════
function exportIntervencionesPDF(items: IntervencionSocorrista[], range: { fromDate: string; toDate: string }) {
  const periodo = range.fromDate || range.toDate
    ? `${range.fromDate || '—'} a ${range.toDate || '—'}`
    : 'Todas las fechas';
  const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
<!doctype html><html><head><meta charset="utf-8"><title>Intervenciones de socorrista</title>
<style>
  @page { size: A4; margin: 18mm 12mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #0f1f3d; font-size: 11px; }
  h1 { font-size: 18px; margin: 0 0 4px; color: #dc2626; }
  .meta { color: #64748b; font-size: 11px; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #fef2f2; color: #991b1b; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1.5px solid #fca5a5; }
  td { padding: 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; font-size: 10.5px; }
  tr { page-break-inside: avoid; }
  .date { font-family: 'SF Mono', Consolas, monospace; color: #475569; white-space: nowrap; }
  .pill { display: inline-block; padding: 2px 7px; border-radius: 8px; background: #dbeafe; color: #1e40af; font-size: 9.5px; font-weight: 600; }
  .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }
</style></head>
<body>
  <h1>🩹 Registro de intervenciones del socorrista</h1>
  <div class="meta">
    <strong>Periodo:</strong> ${periodo} &nbsp;·&nbsp;
    <strong>Total intervenciones:</strong> ${items.length} &nbsp;·&nbsp;
    <strong>Emisión:</strong> ${today}
  </div>
  <table>
    <thead>
      <tr>
        <th>Fecha y hora</th>
        <th>Edad</th>
        <th>Motivo</th>
        <th>Actuación</th>
        <th>Materiales</th>
        <th>Nota final</th>
        <th>Socorrista</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(i => `
        <tr>
          <td class="date">${formatDateTime(i.fechaHora)}</td>
          <td>${i.edadPaciente ?? '—'}</td>
          <td>${escapeHtml(i.motivo)}</td>
          <td>${escapeHtml(i.actuacion)}</td>
          <td>${escapeHtml(i.materiales || '—')}</td>
          <td>${escapeHtml(i.notaFinal || '—')}</td>
          <td><span class="pill">${escapeHtml(i.socorristaName)}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="footer">AquaDash · Documento generado automáticamente</div>
</body></html>`;

  openPrintWindow(html);
}

function exportAforoPDF(
  days: [string, AforoEntry[]][],
  venues: string[],
  range: { fromDate: string; toDate: string }
) {
  const periodo = range.fromDate || range.toDate
    ? `${range.fromDate || '—'} a ${range.toDate || '—'}`
    : 'Todas las fechas';
  const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  const dayTables = days.map(([d, entries]) => {
    const lookup = new Map<string, number>();
    for (const e of entries) lookup.set(`${e.hour}|${e.pool}`, e.cantidad);

    const totalDay = entries.reduce((a, e) => a + e.cantidad, 0);

    return `
      <div style="page-break-inside: avoid; margin-bottom: 24px;">
        <h2 style="font-size: 14px; margin: 0 0 6px; color: #0077cc;">📅 ${formatDate(d)} <span style="color:#64748b;font-weight:400;font-size:11px">· Total: ${totalDay}</span></h2>
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              ${venues.map(p => `<th style="text-align:center;">${escapeHtml(p)}</th>`).join('')}
              <th style="text-align:center;background:#f0fdf4;color:#15803d;">Σ</th>
            </tr>
          </thead>
          <tbody>
            ${AFORO_HOURS.map(h => {
              const rowTotal = venues.reduce((a, p) => a + (lookup.get(`${h}|${p}`) ?? 0), 0);
              return `<tr>
                <td style="font-weight:600;">${String(h).padStart(2,'0')}:00</td>
                ${venues.map(p => {
                  const v = lookup.get(`${h}|${p}`);
                  return `<td style="text-align:center;font-family:monospace;color:${v ? '#0f1f3d' : '#cbd5e1'};">${v ?? '–'}</td>`;
                }).join('')}
                <td style="text-align:center;font-weight:700;color:#15803d;font-family:monospace;">${rowTotal || ''}</td>
              </tr>`;
            }).join('')}
            <tr style="background:#f8fafc;font-weight:700;">
              <td>Σ</td>
              ${venues.map(p => {
                const t = AFORO_HOURS.reduce((a, h) => a + (lookup.get(`${h}|${p}`) ?? 0), 0);
                return `<td style="text-align:center;font-family:monospace;color:#15803d;">${t || ''}</td>`;
              }).join('')}
              <td style="text-align:center;color:#15803d;font-family:monospace;">${totalDay}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  const html = `
<!doctype html><html><head><meta charset="utf-8"><title>Aforo de la instalación</title>
<style>
  @page { size: A4 landscape; margin: 14mm 10mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #0f1f3d; font-size: 10.5px; }
  h1 { font-size: 17px; margin: 0 0 4px; color: #0077cc; }
  .meta { color: #64748b; font-size: 11px; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { background: #eff6ff; color: #1e3a8a; text-align: left; padding: 5px 6px; font-size: 9.5px; text-transform: uppercase; border-bottom: 1.5px solid #93c5fd; white-space: nowrap; }
  td { padding: 4px 6px; border-bottom: 1px solid #f1f5f9; }
  .footer { margin-top: 18px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }
</style></head>
<body>
  <h1>👥 Aforo de la instalación · Histórico</h1>
  <div class="meta">
    <strong>Periodo:</strong> ${periodo} &nbsp;·&nbsp;
    <strong>Días incluidos:</strong> ${days.length} &nbsp;·&nbsp;
    <strong>Emisión:</strong> ${today}
  </div>
  ${dayTables}
  <div class="footer">AquaDash · Documento generado automáticamente</div>
</body></html>`;

  openPrintWindow(html);
}

function openPrintWindow(html: string) {
  const w = window.open('', '_blank');
  if (!w) { alert('Habilita las ventanas emergentes para exportar a PDF'); return; }
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 300);
}

function escapeHtml(s: string) {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

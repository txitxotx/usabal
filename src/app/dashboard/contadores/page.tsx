'use client';
export const dynamic = 'force-dynamic';
import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function ContadoresPage() {
  const { hasPermission, contadores, addContador } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [tab, setTab] = useState<'graficos' | 'tabla'>('graficos');
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    accesos: '', tempExterior: '',
    aguaGeneralDiario: '', gasDiario: '', aguaPiscinasDiario: '', kwTolargi: '',
  });

  if (!hasPermission('view_contadores')) {
    return <div className="alert-banner alert-danger"><span>⛔</span> No tienes permiso para ver esta sección.</div>;
  }

  const canEdit = hasPermission('edit_contadores');

  const filtered = useMemo(() => {
    if (!selectedMonth) return contadores;
    return contadores.filter(e => new Date(e.date).getMonth() + 1 === selectedMonth);
  }, [contadores, selectedMonth]);

  const totals = filtered.reduce((acc, e) => ({
    aguaGeneral:   acc.aguaGeneral   + (e.aguaGeneralDiario   || 0),
    aguaPiscinas:  acc.aguaPiscinas  + (e.aguaPiscinasDiario  || 0),
    gas:           acc.gas           + (e.gasDiario           || 0),
    accesos:       acc.accesos       + (e.accesos             || 0),
    kw:            acc.kw            + (e.kwTolargi           || 0),
  }), { aguaGeneral: 0, aguaPiscinas: 0, gas: 0, accesos: 0, kw: 0 });

  const aguaTotal = totals.aguaGeneral + totals.aguaPiscinas;

  const chartData = filtered.map(e => ({
    date: e.date.slice(5),
    agua: e.aguaGeneralDiario,
    piscinas: e.aguaPiscinasDiario,
    gas: e.gasDiario,
    accesos: e.accesos,
    kw: e.kwTolargi,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="card" style={{ padding: '10px 14px', fontSize: '12px' }}>
        <p style={{ margin: '0 0 6px', fontWeight: '600', color: '#0f1f3d' }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ margin: '2px 0', color: p.color }}>{p.name}: <strong>{p.value?.toLocaleString('es-ES')}</strong></p>
        ))}
      </div>
    );
  };

  const handleSave = async () => {
    if (!form.date) return;
    setSaving(true);
    try {
      await addContador({
        date: form.date,
        accesos:            form.accesos           ? parseInt(form.accesos)               : 0,
        tempExterior:       form.tempExterior       ? parseFloat(form.tempExterior)        : 0,
        aguaGeneral:        0,
        aguaGeneralDiario:  form.aguaGeneralDiario  ? parseFloat(form.aguaGeneralDiario)   : 0,
        gas:                0,
        gasDiario:          form.gasDiario          ? parseFloat(form.gasDiario)           : 0,
        aguaPiscinas:       0,
        aguaPiscinasDiario: form.aguaPiscinasDiario ? parseFloat(form.aguaPiscinasDiario)  : 0,
        kwTolargi:          form.kwTolargi          ? parseFloat(form.kwTolargi)           : 0,
        urBeroa:            0,
      });
      setFormOpen(false);
      setForm({ date: new Date().toISOString().split('T')[0], accesos: '', tempExterior: '', aguaGeneralDiario: '', gasDiario: '', aguaPiscinasDiario: '', kwTolargi: '' });
    } finally {
      setSaving(false);
    }
  };

  const kpiCards = [
    { label: 'Agua Total',       value: aguaTotal.toLocaleString('es-ES'),           unit: 'm³',      sub: 'General + Piscinas',     color: '#0057a8', bg: '#e6f1fb', icon: '💧' },
    { label: 'Agua General',     value: totals.aguaGeneral.toLocaleString('es-ES'),  unit: 'm³',      sub: 'Consumo red general',    color: '#0891b2', bg: '#e0f7fa', icon: '🚰' },
    { label: 'Agua Piscinas',    value: totals.aguaPiscinas.toLocaleString('es-ES'), unit: 'm³',      sub: 'Consumo piscinas',       color: '#0f6e56', bg: '#e1f5ee', icon: '🏊' },
    { label: 'Gas Total',        value: totals.gas.toLocaleString('es-ES'),          unit: 'm³',      sub: 'Gas natural',            color: '#b45309', bg: '#fffbeb', icon: '🔥' },
    { label: 'Accesos Total',    value: totals.accesos.toLocaleString('es-ES'),      unit: 'personas',sub: 'Entradas registradas',   color: '#7c3aed', bg: '#ede9fe', icon: '👥' },
    { label: 'kW Tolargi',       value: totals.kw.toLocaleString('es-ES'),           unit: 'kWh',     sub: 'Consumo eléctrico',      color: '#c2410c', bg: '#fff7ed', icon: '⚡' },
    { label: 'Días registrados', value: String(filtered.length),                     unit: 'días',    sub: 'Registros en período',   color: '#334155', bg: '#f8fafc', icon: '📅' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f1f3d', margin: '0 0 4px' }}>📊 Contadores</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Consumos diarios de agua, gas, kW y accesos</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select className="input-field" style={{ width: 'auto' }} value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
            <option value={0}>Todos los meses</option>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          {canEdit && <button className="btn btn-primary" onClick={() => setFormOpen(true)}>+ Añadir registro</button>}
        </div>
      </div>

      {/* KPIs con color */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {kpiCards.map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: '12px', border: `1px solid ${k.color}30`, padding: '16px 18px', borderTop: `3px solid ${k.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ fontSize: '15px' }}>{k.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', color: k.color }}>{k.label}</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: k.color, lineHeight: 1.1 }}>{k.value}</div>
            <div style={{ fontSize: '11px', color: k.color, opacity: 0.75, marginTop: '3px' }}>{k.unit} · {k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {(['graficos', 'tabla'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0f1f3d' : '#64748b', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
            {t === 'graficos' ? '📈 Gráficos' : '📋 Tabla'}
          </button>
        ))}
      </div>

      {tab === 'graficos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Accesos diarios</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={50} tickFormatter={v => v.toLocaleString()} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="accesos" fill="#7c3aed" radius={[3, 3, 0, 0]} name="Accesos" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Agua diaria (m³)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="agua"     stroke="#0057a8" dot={false} strokeWidth={2} name="Agua General m³" />
                  <Line type="monotone" dataKey="piscinas" stroke="#0f6e56" dot={false} strokeWidth={2} name="Agua Piscinas m³" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Gas diario (m³)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="gas" stroke="#b45309" dot={false} strokeWidth={2} name="Gas m³" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>kW Tolargi diarios</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="kw" stroke="#c2410c" dot={false} strokeWidth={2} name="kWh" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'tabla' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Accesos</th>
                  <th>Tª Ext.</th>
                  <th>Agua Gral (m³)</th>
                  <th>Gas (m³)</th>
                  <th>Agua Piscinas (m³)</th>
                  <th>kW Tolargi</th>
                </tr>
              </thead>
              <tbody>
                {[...filtered].reverse().map(e => (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>{e.accesos?.toLocaleString('es-ES') ?? '—'}</td>
                    <td>{e.tempExterior} °C</td>
                    <td>{e.aguaGeneralDiario ?? '—'}</td>
                    <td>{e.gasDiario ?? '—'}</td>
                    <td>{e.aguaPiscinasDiario ?? '—'}</td>
                    <td>{e.kwTolargi ?? '—'}</td>
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
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f1f3d', margin: 0 }}>Nuevo registro de contadores</h2>
              <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                { key: 'date',               label: 'Fecha',                   type: 'date'   },
                { key: 'accesos',            label: 'Accesos',                 type: 'number' },
                { key: 'tempExterior',       label: 'Tª Exterior (°C)',        type: 'number' },
                { key: 'aguaGeneralDiario',  label: 'Agua General (m³/día)',   type: 'number' },
                { key: 'gasDiario',          label: 'Gas (m³/día)',            type: 'number' },
                { key: 'aguaPiscinasDiario', label: 'Agua Piscinas (m³/día)', type: 'number' },
                { key: 'kwTolargi',          label: 'kW Tolargi',             type: 'number' },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.key === 'date' ? '1 / -1' : undefined }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>{f.label}</label>
                  <input className="input-field" type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
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
    </div>
  );
}

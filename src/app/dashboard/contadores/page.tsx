'use client';
export const dynamic = 'force-dynamic';
import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar } from 'recharts';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function ContadoresPage() {
  const { hasPermission, contadores, addContador } = useApp();
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(0); // 0=all
  const [tab, setTab] = useState<'tabla' | 'graficos'>('graficos');
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  // Sin electricidadNormal ni electricidadPreferente
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    accesos: '',
    tempExterior: '',
    aguaGeneralDiario: '',
    gasDiario: '',
    aguaPiscinasDiario: '',
    kwTolargi: '',
  });

  if (!hasPermission('view_contadores')) {
    return <div className="alert-banner alert-danger"><span>⛔</span> No tienes permiso para ver esta sección.</div>;
  }

  const filtered = useMemo(() => {
    if (!selectedMonth) return contadores;
    return contadores.filter(e => new Date(e.date).getMonth() + 1 === selectedMonth);
  }, [contadores, selectedMonth]);

  const chartData = filtered.map(e => ({
    date: e.date.slice(5),
    agua: e.aguaGeneralDiario,
    gas: e.gasDiario,
    accesos: e.accesos,
    kw: e.kwTolargi,
  }));

  const totals = filtered.reduce((acc, e) => ({
    agua: acc.agua + (e.aguaGeneralDiario || 0),
    gas: acc.gas + (e.gasDiario || 0),
    accesos: acc.accesos + (e.accesos || 0),
    kw: acc.kw + (e.kwTolargi || 0),
  }), { agua: 0, gas: 0, accesos: 0, kw: 0 });

  const canEdit = hasPermission('edit_contadores');

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
        accesos: form.accesos ? parseInt(form.accesos) : 0,
        tempExterior: form.tempExterior ? parseFloat(form.tempExterior) : 0,
        aguaGeneralDiario: form.aguaGeneralDiario ? parseFloat(form.aguaGeneralDiario) : 0,
        gasDiario: form.gasDiario ? parseFloat(form.gasDiario) : 0,
        aguaPiscinasDiario: form.aguaPiscinasDiario ? parseFloat(form.aguaPiscinasDiario) : 0,
        kwTolargi: form.kwTolargi ? parseFloat(form.kwTolargi) : 0,
        aguaGeneral: 0,
        gas: 0,
        aguaPiscinas: 0,
        urBeroa: 0,
      });
      setFormOpen(false);
      setForm({ date: new Date().toISOString().split('T')[0], accesos: '', tempExterior: '', aguaGeneralDiario: '', gasDiario: '', aguaPiscinasDiario: '', kwTolargi: '' });
    } finally {
      setSaving(false);
    }
  };

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

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Agua Total', value: totals.agua.toLocaleString('es-ES'), unit: 'm³' },
          { label: 'Gas Total', value: totals.gas.toLocaleString('es-ES'), unit: 'm³' },
          { label: 'Accesos Total', value: totals.accesos.toLocaleString('es-ES'), unit: 'personas' },
          { label: 'kW Tolargi Total', value: totals.kw.toLocaleString('es-ES'), unit: 'kWh' },
          { label: 'Días registrados', value: filtered.length, unit: 'días' },
        ].map(m => (
          <div key={m.label} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value" style={{ fontSize: '20px' }}>{m.value}</div>
            <div className="metric-sub">{m.unit}</div>
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
          {/* Accesos */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Accesos diarios</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={50} tickFormatter={v => v.toLocaleString()} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="accesos" fill="#0077cc" radius={[3, 3, 0, 0]} name="Accesos" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Agua & Gas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Agua diaria (m³)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="agua" stroke="#0077cc" dot={false} strokeWidth={2} name="Agua m³" />
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
                  <Line type="monotone" dataKey="gas" stroke="#f59e0b" dot={false} strokeWidth={2} name="Gas m³" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* kW */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>kW Tolargi diarios</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="kw" stroke="#7c3aed" dot={false} strokeWidth={2} name="kWh" />
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
                    <td style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{e.date}</td>
                    <td>{e.accesos?.toLocaleString('es-ES') ?? '—'}</td>
                    <td>{e.tempExterior} °C</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{e.aguaGeneralDiario}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{e.gasDiario}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{e.aguaPiscinasDiario}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{e.kwTolargi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal formulario — sin campos de electricidad */}
      {formOpen && canEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f1f3d', margin: 0 }}>Nuevo registro de contadores</h2>
              <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                { key: 'date',               label: 'Fecha',                    type: 'date'   },
                { key: 'accesos',            label: 'Accesos',                  type: 'number' },
                { key: 'tempExterior',       label: 'Tª Exterior (°C)',         type: 'number' },
                { key: 'aguaGeneralDiario',  label: 'Agua General (m³/día)',    type: 'number' },
                { key: 'gasDiario',          label: 'Gas (m³/día)',             type: 'number' },
                { key: 'aguaPiscinasDiario', label: 'Agua Piscinas (m³/día)',   type: 'number' },
                { key: 'kwTolargi',          label: 'kW Tolargi',              type: 'number' },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.key === 'date' ? '1 / -1' : undefined }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>{f.label}</label>
                  <input
                    className="input-field"
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  />
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

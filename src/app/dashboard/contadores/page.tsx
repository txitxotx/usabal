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

  // El formulario ahora pide la LECTURA ACUMULADA del contador
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    accesos: '',
    tempExterior: '',
    aguaGeneral: '',    // lectura acumulada del contador
    gas: '',            // lectura acumulada del contador
    aguaPiscinas: '',   // lectura acumulada del contador
    kwTolargi: '',
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
      // ── LÓGICA DIFERENCIA AUTOMÁTICA ────────────────────────────────────────
      // Buscar el registro anterior más reciente (ordenado por fecha desc)
      const sortedDesc = [...contadores].sort((a, b) => b.date.localeCompare(a.date));
      const anterior = sortedDesc.find(c => c.date < form.date);

      const acumGeneral   = form.aguaGeneral   ? parseFloat(form.aguaGeneral)   : null;
      const acumGas       = form.gas           ? parseFloat(form.gas)           : null;
      const acumPiscinas  = form.aguaPiscinas  ? parseFloat(form.aguaPiscinas)  : null;

      // Diferencia = lectura hoy - lectura anterior. Si no hay anterior → 0
      const diarioGeneral  = acumGeneral  != null && anterior != null && anterior.aguaGeneral  > 0
        ? Math.max(0, Math.round((acumGeneral  - anterior.aguaGeneral)  * 100) / 100)
        : acumGeneral != null ? 0 : 0;

      const diarioGas      = acumGas      != null && anterior != null && anterior.gas          > 0
        ? Math.max(0, Math.round((acumGas      - anterior.gas)          * 100) / 100)
        : acumGas     != null ? 0 : 0;

      const diarioPiscinas = acumPiscinas != null && anterior != null && anterior.aguaPiscinas > 0
        ? Math.max(0, Math.round((acumPiscinas - anterior.aguaPiscinas) * 100) / 100)
        : acumPiscinas != null ? 0 : 0;

      await addContador({
        date:               form.date,
        accesos:            form.accesos      ? parseInt(form.accesos)      : 0,
        tempExterior:       form.tempExterior ? parseFloat(form.tempExterior): 0,
        aguaGeneral:        acumGeneral  ?? 0,
        aguaGeneralDiario:  diarioGeneral,
        gas:                acumGas      ?? 0,
        gasDiario:          diarioGas,
        aguaPiscinas:       acumPiscinas ?? 0,
        aguaPiscinasDiario: diarioPiscinas,
        kwTolargi:          form.kwTolargi ? parseFloat(form.kwTolargi) : 0,
        urBeroa:            0,
      });

      setFormOpen(false);
      setForm({ date: new Date().toISOString().split('T')[0], accesos: '', tempExterior: '', aguaGeneral: '', gas: '', aguaPiscinas: '', kwTolargi: '' });
    } finally {
      setSaving(false);
    }
  };

  // Calcular el último registro para mostrar info del contador en el modal
  const sortedDesc = [...contadores].sort((a, b) => b.date.localeCompare(a.date));
  const ultimoRegistro = sortedDesc[0];

  const kpiCards = [
    { label: 'Agua Total',       value: aguaTotal.toLocaleString('es-ES'),           unit: 'm³',       sub: 'General + Piscinas',    color: '#0057a8', bg: '#e6f1fb', icon: '💧' },
    { label: 'Agua General',     value: totals.aguaGeneral.toLocaleString('es-ES'),  unit: 'm³',       sub: 'Consumo red general',   color: '#0891b2', bg: '#e0f7fa', icon: '🚰' },
    { label: 'Agua Piscinas',    value: totals.aguaPiscinas.toLocaleString('es-ES'), unit: 'm³',       sub: 'Consumo piscinas',      color: '#0f6e56', bg: '#e1f5ee', icon: '🏊' },
    { label: 'Gas Total',        value: totals.gas.toLocaleString('es-ES'),          unit: 'm³',       sub: 'Gas natural',           color: '#b45309', bg: '#fffbeb', icon: '🔥' },
    { label: 'Accesos Total',    value: totals.accesos.toLocaleString('es-ES'),      unit: 'personas', sub: 'Entradas registradas',  color: '#7c3aed', bg: '#ede9fe', icon: '👥' },
    { label: 'kW Tolargi',       value: totals.kw.toLocaleString('es-ES'),           unit: 'kWh',      sub: 'Consumo eléctrico',     color: '#c2410c', bg: '#fff7ed', icon: '⚡' },
    { label: 'Días registrados', value: String(filtered.length),                     unit: 'días',     sub: 'Registros en período',  color: '#334155', bg: '#f8fafc', icon: '📅' },
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
                  <th>Agua Gral — Contador</th>
                  <th>Agua Gral — Día (m³)</th>
                  <th>Gas — Contador</th>
                  <th>Gas — Día (m³)</th>
                  <th>Agua Pisc. — Contador</th>
                  <th>Agua Pisc. — Día (m³)</th>
                  <th>kW Tolargi</th>
                </tr>
              </thead>
              <tbody>
                {[...filtered].reverse().map(e => (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>{e.accesos?.toLocaleString('es-ES') ?? '—'}</td>
                    <td>{e.tempExterior} °C</td>
                    <td style={{ color: '#94a3b8', fontSize: '12px' }}>{e.aguaGeneral?.toLocaleString('es-ES') ?? '—'}</td>
                    <td style={{ fontWeight: '600', color: '#0057a8' }}>{e.aguaGeneralDiario ?? '—'}</td>
                    <td style={{ color: '#94a3b8', fontSize: '12px' }}>{e.gas?.toLocaleString('es-ES') ?? '—'}</td>
                    <td style={{ fontWeight: '600', color: '#b45309' }}>{e.gasDiario ?? '—'}</td>
                    <td style={{ color: '#94a3b8', fontSize: '12px' }}>{e.aguaPiscinas?.toLocaleString('es-ES') ?? '—'}</td>
                    <td style={{ fontWeight: '600', color: '#0f6e56' }}>{e.aguaPiscinasDiario ?? '—'}</td>
                    <td style={{ fontWeight: '600', color: '#c2410c' }}>{e.kwTolargi ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal — ahora pide lectura acumulada del contador */}
      {formOpen && canEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f1f3d', margin: 0 }}>Nuevo registro de contadores</h2>
              <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>×</button>
            </div>

            {/* Info último registro */}
            {ultimoRegistro && (
              <div style={{ marginBottom: '16px', padding: '12px 14px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '12px' }}>
                <p style={{ margin: '0 0 4px', fontWeight: '700', color: '#0057a8' }}>📅 Último registro: {ultimoRegistro.date}</p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: '#334155' }}>
                  <span>Agua Gral: <strong>{ultimoRegistro.aguaGeneral?.toLocaleString('es-ES')} m³</strong></span>
                  <span>Gas: <strong>{ultimoRegistro.gas?.toLocaleString('es-ES')} m³</strong></span>
                  <span>Agua Pisc.: <strong>{ultimoRegistro.aguaPiscinas?.toLocaleString('es-ES')} m³</strong></span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>La diferencia diaria se calculará automáticamente restando estos valores a los que introduzcas hoy.</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Fecha — ocupa 2 columnas */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Fecha</label>
                <input className="input-field" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Accesos</label>
                <input className="input-field" type="number" value={form.accesos} onChange={e => setForm(p => ({ ...p, accesos: e.target.value }))} placeholder="Nº entradas" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Tª Exterior (°C)</label>
                <input className="input-field" type="number" step="0.1" value={form.tempExterior} onChange={e => setForm(p => ({ ...p, tempExterior: e.target.value }))} placeholder="ej. 18" />
              </div>

              {/* Contadores acumulados — sección destacada */}
              <div style={{ gridColumn: '1 / -1', marginTop: '4px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: '#0f1f3d' }}>📟 Lectura de contadores (valor acumulado)</p>
                <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#64748b' }}>Introduce la lectura actual del contador. La diferencia con el registro anterior se calculará automáticamente.</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#0057a8', marginBottom: '5px' }}>💧 Agua General (m³ acumulados)</label>
                <input className="input-field" type="number" step="0.01" value={form.aguaGeneral} onChange={e => setForm(p => ({ ...p, aguaGeneral: e.target.value }))} placeholder={ultimoRegistro ? `anterior: ${ultimoRegistro.aguaGeneral?.toLocaleString('es-ES')}` : 'ej. 12450'} style={{ borderColor: '#bfdbfe' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#b45309', marginBottom: '5px' }}>🔥 Gas (m³ acumulados)</label>
                <input className="input-field" type="number" step="0.01" value={form.gas} onChange={e => setForm(p => ({ ...p, gas: e.target.value }))} placeholder={ultimoRegistro ? `anterior: ${ultimoRegistro.gas?.toLocaleString('es-ES')}` : 'ej. 8320'} style={{ borderColor: '#fed7aa' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#0f6e56', marginBottom: '5px' }}>🏊 Agua Piscinas (m³ acumulados)</label>
                <input className="input-field" type="number" step="0.01" value={form.aguaPiscinas} onChange={e => setForm(p => ({ ...p, aguaPiscinas: e.target.value }))} placeholder={ultimoRegistro ? `anterior: ${ultimoRegistro.aguaPiscinas?.toLocaleString('es-ES')}` : 'ej. 3210'} style={{ borderColor: '#a7f3d0' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#c2410c', marginBottom: '5px' }}>⚡ kW Tolargi (kWh del día)</label>
                <input className="input-field" type="number" step="0.01" value={form.kwTolargi} onChange={e => setForm(p => ({ ...p, kwTolargi: e.target.value }))} placeholder="ej. 450" style={{ borderColor: '#fed7aa' }} />
              </div>
            </div>

            {/* Preview de diferencias si el usuario ya introdujo valores */}
            {ultimoRegistro && (form.aguaGeneral || form.gas || form.aguaPiscinas) && (
              <div style={{ marginTop: '16px', padding: '12px 14px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '12px' }}>
                <p style={{ margin: '0 0 6px', fontWeight: '700', color: '#15803d' }}>✓ Diferencia diaria que se guardará:</p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {form.aguaGeneral && (
                    <span style={{ color: '#0057a8' }}>Agua Gral: <strong>{Math.max(0, Math.round((parseFloat(form.aguaGeneral) - (ultimoRegistro.aguaGeneral || 0)) * 100) / 100)} m³</strong></span>
                  )}
                  {form.gas && (
                    <span style={{ color: '#b45309' }}>Gas: <strong>{Math.max(0, Math.round((parseFloat(form.gas) - (ultimoRegistro.gas || 0)) * 100) / 100)} m³</strong></span>
                  )}
                  {form.aguaPiscinas && (
                    <span style={{ color: '#0f6e56' }}>Agua Pisc.: <strong>{Math.max(0, Math.round((parseFloat(form.aguaPiscinas) - (ultimoRegistro.aguaPiscinas || 0)) * 100) / 100)} m³</strong></span>
                  )}
                </div>
              </div>
            )}

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

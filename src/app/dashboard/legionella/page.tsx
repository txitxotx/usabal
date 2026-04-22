'use client';
import { useState, useEffect, useMemo } from 'react';
import { useApp, THRESHOLDS } from '@/lib/store';
import { supabase } from '@/lib/supabase';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function valueClass(v: number | null | undefined, min: number, max: number) {
  if (v == null) return '';
  return (v < min || v > max) ? 'val-danger' : 'val-ok';
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface PurgaSemanal { id: string; year: number; month: number; week: number; fecha_realizacion: string | null; nombre: string | null; realizada: boolean; }
interface PurgaMensual { id: string; fecha: string; punto_terminal: string; ramal: string | null; nombre: string | null; }
interface TurbidezSemanal { id: string; year: number; month: number; week: number; turbidez: number | null; punto_medida: string | null; nombre: string | null; }
interface AperturaTerminal { id: string; year: number; month: number; planta: string | null; ramal: string | null; punto_terminal: string | null; ubicacion: string | null; semana_1: string | null; semana_2: string | null; semana_3: string | null; semana_4: string | null; semana_5: string | null; }
interface TermometroRamal { id: string; fecha: string; punto_terminal: string; temperatura: number | null; nombre: string | null; }

export default function LegionellaPage() {
  const { hasPermission, legionellaTemps, legionellaBiocida } = useApp();
  const [tab, setTab] = useState<'temperaturas' | 'biocida' | 'semanales' | 'mensuales'>('temperaturas');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Extra data from new tables
  const [purgaSemanal, setPurgaSemanal] = useState<PurgaSemanal[]>([]);
  const [purgaMensual, setPurgaMensual] = useState<PurgaMensual[]>([]);
  const [turbidezSemanal, setTurbidezSemanal] = useState<TurbidezSemanal[]>([]);
  const [apertura, setApertura] = useState<AperturaTerminal[]>([]);
  const [termometros, setTermometros] = useState<TermometroRamal[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(true);

  // Form states
  const [formTab, setFormTab] = useState<'purga_sem' | 'turbidez' | 'purga_men' | 'termometros' | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadExtra() {
      setLoadingExtra(true);
      const [{ data: ps }, { data: pm }, { data: ts }, { data: at }, { data: tr }] = await Promise.all([
        supabase.from('legionella_purga_semanal').select('*').order('year').order('month').order('week'),
        supabase.from('legionella_purga_mensual').select('*').order('fecha'),
        supabase.from('legionella_turbidez_semanal').select('*').order('year').order('month').order('week'),
        supabase.from('legionella_apertura_terminales').select('*').order('year').order('month'),
        supabase.from('legionella_termometros_ramal').select('*').order('fecha'),
      ]);
      if (ps) setPurgaSemanal(ps);
      if (pm) setPurgaMensual(pm);
      if (ts) setTurbidezSemanal(ts);
      if (at) setApertura(at);
      if (tr) setTermometros(tr);
      setLoadingExtra(false);
    }
    loadExtra();
  }, []);

  if (!hasPermission('view_legionella')) {
    return <div className="alert-banner alert-danger"><span>⛔</span> Sin permiso.</div>;
  }

  const canEdit = hasPermission('edit_legionella');
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = 2026;

  // ── Filtered data by month ─────────────────────────────────────────────────
  const tempsMonth = legionellaTemps.filter(t => {
    const m = parseInt(t.date.slice(5, 7));
    return m === selectedMonth;
  });
  const biocidaMonth = legionellaBiocida.filter(b => {
    const m = parseInt(b.date.slice(5, 7));
    return m === selectedMonth;
  });
  const purgaSemMonth = purgaSemanal.filter(p => p.month === selectedMonth);
  const turbidezMonth = turbidezSemanal.filter(t => t.month === selectedMonth);
  const purgaMenMonth = purgaMensual.filter(p => parseInt(p.fecha.slice(5, 7)) === selectedMonth);
  const aperturaMonth = apertura.filter(a => a.month === selectedMonth);
  const termometrosMonth = termometros.filter(t => parseInt(t.fecha.slice(5, 7)) === selectedMonth);

  // ── Compliance overview (for current month) ────────────────────────────────
  const semanasDone = purgaSemMonth.filter(p => p.realizada).length;
  const semanasTotal = purgaSemMonth.length;
  const turbidezDone = turbidezMonth.filter(t => t.turbidez != null).length;
  const turbidezTotal = turbidezMonth.length;
  const purgaMenDone = purgaMenMonth.filter(p => p.nombre).length;
  const termometrosDone = termometrosMonth.length;

  // ── Save form handlers ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formTab) return;
    setSaving(true);
    try {
      if (formTab === 'purga_sem') {
        const week = parseInt(formData.week);
        const month = parseInt(formData.month || String(selectedMonth));
        const id = `ps${currentYear}${month.toString().padStart(2,'0')}${week}`;
        await supabase.from('legionella_purga_semanal').upsert({
          id, year: currentYear, month, week,
          fecha_realizacion: formData.fecha || null,
          nombre: formData.nombre || null, realizada: true,
        });
        const { data } = await supabase.from('legionella_purga_semanal').select('*').order('year').order('month').order('week');
        if (data) setPurgaSemanal(data);
      } else if (formTab === 'turbidez') {
        const week = parseInt(formData.week);
        const month = parseInt(formData.month || String(selectedMonth));
        const id = `ts${currentYear}${month.toString().padStart(2,'0')}${week}`;
        await supabase.from('legionella_turbidez_semanal').upsert({
          id, year: currentYear, month, week,
          turbidez: parseFloat(formData.turbidez) || null,
          punto_medida: formData.punto_medida || null, nombre: formData.nombre || null,
        });
        const { data } = await supabase.from('legionella_turbidez_semanal').select('*').order('year').order('month').order('week');
        if (data) setTurbidezSemanal(data);
      } else if (formTab === 'purga_men') {
        const id = `pm${(formData.fecha||'').replace(/-/g,'')}_{${(formData.punto||'').slice(0,10)}}`;
        await supabase.from('legionella_purga_mensual').insert({
          id: `pm${Date.now()}`, fecha: formData.fecha, punto_terminal: formData.punto,
          ramal: formData.ramal || null, nombre: formData.nombre || null,
        });
        const { data } = await supabase.from('legionella_purga_mensual').select('*').order('fecha');
        if (data) setPurgaMensual(data);
      } else if (formTab === 'termometros') {
        await supabase.from('legionella_termometros_ramal').insert({
          id: `tr${Date.now()}`, fecha: formData.fecha, punto_terminal: formData.punto,
          temperatura: parseFloat(formData.temperatura) || null, nombre: formData.nombre || null,
        });
        const { data } = await supabase.from('legionella_termometros_ramal').select('*').order('fecha');
        if (data) setTermometros(data);
      }
      setFormTab(null);
      setFormData({});
    } catch(e) { console.error(e); alert('Error al guardar'); }
    finally { setSaving(false); }
  };

  const fd = (k: string, v: string) => setFormData(prev => ({ ...prev, [k]: v }));

  const TAB_STYLE = (active: boolean) => ({
    padding: '7px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer',
    fontSize: '12px', fontWeight: '500' as const,
    background: active ? '#fff' : 'transparent',
    color: active ? '#0f1f3d' : '#64748b',
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f1f3d', margin: '0 0 4px' }}>🧫 Legionella</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Registro oficial de control · Protocolo Gobierno Vasco</p>
        </div>
      </div>

      {/* Month selector */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {MONTHS.map((m, i) => {
          const mn = i + 1;
          const isCurrent = mn === currentMonth;
          const isSelected = mn === selectedMonth;
          return (
            <button key={mn} onClick={() => setSelectedMonth(mn)}
              style={{ padding: '5px 12px', borderRadius: '20px', border: `2px solid ${isSelected ? '#0077cc' : '#e2eaf4'}`, background: isSelected ? '#dbeafe' : isCurrent ? '#f0f9ff' : '#fff', color: isSelected ? '#0077cc' : '#64748b', fontSize: '12px', fontWeight: isSelected ? '700' : '500', cursor: 'pointer' }}>
              {MONTH_SHORT[i]}{isCurrent ? ' ●' : ''}
            </button>
          );
        })}
      </div>

      {/* Compliance KPIs for selected month */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'Purga semanal', done: semanasDone, total: semanasTotal, icon: '🚿', color: '#0077cc' },
          { label: 'Turbidez semanal', done: turbidezDone, total: turbidezTotal, icon: '💧', color: '#0f6e56' },
          { label: 'Purga tuberías', done: purgaMenDone, total: purgaMenMonth.length || 7, icon: '🔧', color: '#7c3aed' },
          { label: 'Termómetros ramal', done: termometrosDone, total: 7, icon: '🌡️', color: '#c2410c' },
        ].map(({ label, done, total, icon, color }) => {
          const pct = total > 0 ? Math.round((done / total) * 100) : (done > 0 ? 100 : 0);
          const ok = done >= total && total > 0;
          return (
            <div key={label} className="metric-card" style={{ borderTop: `3px solid ${color}`, padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>{label}</span>
                <span style={{ fontSize: '16px' }}>{icon}</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: ok ? '#15803d' : color, marginBottom: '4px' }}>
                {done}<span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '400' }}>/{total}</span>
              </div>
              <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px' }}>
                <div style={{ height: '4px', width: `${Math.min(pct,100)}%`, background: ok ? '#22c55e' : color, borderRadius: '2px', transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: '10px', color: ok ? '#15803d' : '#94a3b8', marginTop: '4px', fontWeight: '600' }}>
                {ok ? '✓ Completado' : `${pct}% realizado`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content', flexWrap: 'wrap' }}>
        {([
          ['temperaturas', '🌡️ Temperaturas ACS'],
          ['biocida', '🧪 Biocida & pH'],
          ['semanales', '📅 Tareas semanales'],
          ['mensuales', '📆 Tareas mensuales'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={TAB_STYLE(tab === key)}>{label}</button>
        ))}
      </div>

      {/* ── TAB: TEMPERATURAS ── */}
      {tab === 'temperaturas' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f1f3d' }}>
              Temperatura retorno y acumuladores — {MONTHS[selectedMonth-1]}
            </h3>
          </div>
          {tempsMonth.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Sin datos para este mes</div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead><tr>
                    <th>Fecha</th><th>Tª Retorno (°C)</th><th>Tª Depósito 1 (°C)</th><th>Tª Depósito 2 (°C)</th>
                    <th>Tª Ramal 1 (°C)</th><th>Tª Ramal 2 (°C)</th>
                  </tr></thead>
                  <tbody>
                    {[...tempsMonth].reverse().map(t => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{t.date}</td>
                        <td className={valueClass(t.tempRetorno, 50, 65)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{t.tempRetorno?.toFixed(1) ?? '—'}</td>
                        <td className={valueClass(t.tempDeposito1, 60, 70)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{t.tempDeposito1?.toFixed(1) ?? '—'}</td>
                        <td className={valueClass(t.tempDeposito2, 60, 70)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{t.tempDeposito2?.toFixed(1) ?? '—'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{t.tempRamal1?.toFixed(1) ?? '—'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{t.tempRamal2?.toFixed(1) ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Termómetros por ramal mensual */}
          {termometrosMonth.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#0f1f3d' }}>
                🌡️ Termómetros por ramal — {MONTHS[selectedMonth-1]}
              </h3>
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead><tr><th>Fecha</th><th>Punto terminal / Ramal</th><th>Tª (°C)</th><th>Responsable</th></tr></thead>
                    <tbody>
                      {termometrosMonth.map(t => (
                        <tr key={t.id}>
                          <td style={{ whiteSpace: 'nowrap', fontWeight: '500' }}>{t.fecha}</td>
                          <td style={{ textTransform: 'capitalize' }}>{t.punto_terminal}</td>
                          <td className={valueClass(t.temperatura, 50, 65)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{t.temperatura?.toFixed(1) ?? '—'}</td>
                          <td style={{ textTransform: 'capitalize', color: '#64748b' }}>{t.nombre ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: BIOCIDA ── */}
      {tab === 'biocida' && (
        <div>
          <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f1f3d' }}>
              Biocida y pH agua de entrada — {MONTHS[selectedMonth-1]}
            </h3>
          </div>
          {biocidaMonth.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Sin datos para este mes</div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead><tr>
                    <th>Fecha</th><th>Biocida (mg/L)</th><th>pH agua de entrada</th><th>Punto de medida</th><th>Nombre</th>
                  </tr></thead>
                  <tbody>
                    {[...biocidaMonth].reverse().map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{b.date}</td>
                        <td className={valueClass(b.biocida, 0.2, 2.0)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{b.biocida?.toFixed(2) ?? '—'}</td>
                        <td className={valueClass(b.ph, 7.0, 8.0)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{b.ph?.toFixed(2) ?? '—'}</td>
                        <td style={{ color: '#64748b' }}>{b.puntoDeMedida}</td>
                        <td style={{ textTransform: 'capitalize', color: '#64748b' }}>{b.nombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: TAREAS SEMANALES ── */}
      {tab === 'semanales' && (
        <div>
          {canEdit && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={() => { setFormTab('purga_sem'); setFormData({ month: String(selectedMonth) }); }}>+ Purga semanal</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setFormTab('turbidez'); setFormData({ month: String(selectedMonth) }); }}>+ Turbidez semanal</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Purga semanal acumuladores */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f1f3d', marginBottom: '12px' }}>
                🚿 Purga semanal acumuladores
              </h3>
              <div className="card" style={{ overflow: 'hidden' }}>
                <table className="data-table">
                  <thead><tr><th>Semana</th><th>Fecha</th><th>Responsable</th><th>Estado</th></tr></thead>
                  <tbody>
                    {[1,2,3,4,5].map(week => {
                      const r = purgaSemMonth.find(p => p.week === week);
                      return (
                        <tr key={week}>
                          <td style={{ fontWeight: '600' }}>S{week}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{r?.fecha_realizacion ? `día ${r.fecha_realizacion}` : '—'}</td>
                          <td style={{ textTransform: 'capitalize', color: '#64748b' }}>{r?.nombre ?? '—'}</td>
                          <td>
                            {r?.realizada
                              ? <span className="badge badge-ok">✓ Realizada</span>
                              : <span className="badge badge-warning">Pendiente</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Turbidez semanal */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f1f3d', marginBottom: '12px' }}>
                💧 Medida semanal turbidez
              </h3>
              <div className="card" style={{ overflow: 'hidden' }}>
                <table className="data-table">
                  <thead><tr><th>Semana</th><th>Turbidez (UNF)</th><th>Punto</th><th>Responsable</th></tr></thead>
                  <tbody>
                    {[1,2,3,4,5].map(week => {
                      const r = turbidezMonth.find(t => t.week === week);
                      return (
                        <tr key={week}>
                          <td style={{ fontWeight: '600' }}>S{week}</td>
                          <td className={r?.turbidez != null ? (r.turbidez > 1 ? 'val-danger' : 'val-ok') : ''} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                            {r?.turbidez?.toFixed(2) ?? '—'}
                          </td>
                          <td style={{ color: '#64748b', fontSize: '12px', textTransform: 'capitalize' }}>{r?.punto_medida ?? '—'}</td>
                          <td style={{ textTransform: 'capitalize', color: '#64748b' }}>{r?.nombre ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Apertura puntos terminales */}
          {aperturaMonth.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f1f3d', marginBottom: '12px' }}>
                🚪 Apertura semanal puntos terminales — {MONTHS[selectedMonth-1]}
              </h3>
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead><tr>
                      <th>Planta</th><th>Ramal</th><th>Punto terminal</th><th>Ubicación</th>
                      <th>S1</th><th>S2</th><th>S3</th><th>S4</th><th>S5</th>
                    </tr></thead>
                    <tbody>
                      {aperturaMonth.map(a => {
                        const badge = (v: string | null) => {
                          if (!v || v === 'X') return <span style={{ color: '#94a3b8' }}>—</span>;
                          const ok = v.toLowerCase() === 'si';
                          return <span className={ok ? 'badge badge-ok' : 'badge badge-danger'} style={{ fontSize: '10px' }}>{ok ? '✓' : '✗'}</span>;
                        };
                        return (
                          <tr key={a.id}>
                            <td style={{ fontSize: '11px', color: '#64748b' }}>{a.planta ?? '—'}</td>
                            <td style={{ fontSize: '11px', textTransform: 'capitalize' }}>{a.ramal ?? '—'}</td>
                            <td style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>{a.punto_terminal ?? '—'}</td>
                            <td style={{ fontSize: '11px', color: '#64748b' }}>{a.ubicacion ?? '—'}</td>
                            <td style={{ textAlign: 'center' }}>{badge(a.semana_1)}</td>
                            <td style={{ textAlign: 'center' }}>{badge(a.semana_2)}</td>
                            <td style={{ textAlign: 'center' }}>{badge(a.semana_3)}</td>
                            <td style={{ textAlign: 'center' }}>{badge(a.semana_4)}</td>
                            <td style={{ textAlign: 'center' }}>{badge(a.semana_5)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: TAREAS MENSUALES ── */}
      {tab === 'mensuales' && (
        <div>
          {canEdit && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={() => { setFormTab('purga_men'); setFormData({ month: String(selectedMonth) }); }}>+ Purga tuberías</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setFormTab('termometros'); setFormData({}); }}>+ Termómetro ramal</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Purga mensual tuberías */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f1f3d', marginBottom: '12px' }}>
                🔧 Purga mensual tuberías
              </h3>
              {purgaMenMonth.length === 0 ? (
                <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Sin registros este mes</div>
              ) : (
                <div className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead><tr><th>Fecha</th><th>Punto terminal</th><th>Responsable</th></tr></thead>
                      <tbody>
                        {purgaMenMonth.map(p => (
                          <tr key={p.id}>
                            <td style={{ whiteSpace: 'nowrap', fontWeight: '500' }}>{p.fecha}</td>
                            <td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{p.punto_terminal}</td>
                            <td style={{ textTransform: 'capitalize', color: '#64748b' }}>{p.nombre ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Termómetros ramal */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f1f3d', marginBottom: '12px' }}>
                🌡️ Termómetros por ramal
              </h3>
              {termometrosMonth.length === 0 ? (
                <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Sin registros este mes</div>
              ) : (
                <div className="card" style={{ overflow: 'hidden' }}>
                  <table className="data-table">
                    <thead><tr><th>Fecha</th><th>Ramal / Punto</th><th>Tª (°C)</th><th>Responsable</th></tr></thead>
                    <tbody>
                      {termometrosMonth.map(t => (
                        <tr key={t.id}>
                          <td style={{ whiteSpace: 'nowrap', fontWeight: '500' }}>{t.fecha}</td>
                          <td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{t.punto_terminal}</td>
                          <td className={valueClass(t.temperatura, 50, 65)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{t.temperatura?.toFixed(1) ?? '—'}</td>
                          <td style={{ textTransform: 'capitalize', color: '#64748b' }}>{t.nombre ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FORMULARIOS MODALES ── */}
      {formTab && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f1f3d', margin: 0 }}>
                {formTab === 'purga_sem' ? '🚿 Purga semanal acumuladores' :
                 formTab === 'turbidez' ? '💧 Turbidez semanal' :
                 formTab === 'purga_men' ? '🔧 Purga mensual tuberías' :
                 '🌡️ Termómetro por ramal'}
              </h2>
              <button onClick={() => setFormTab(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(formTab === 'purga_sem' || formTab === 'turbidez') && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Mes</label>
                      <select className="input-field" value={formData.month || selectedMonth} onChange={e => fd('month', e.target.value)}>
                        {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Semana</label>
                      <select className="input-field" value={formData.week || ''} onChange={e => fd('week', e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {[1,2,3,4,5].map(w => <option key={w} value={w}>Semana {w}</option>)}
                      </select>
                    </div>
                  </div>
                  {formTab === 'purga_sem' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Día de realización</label>
                      <input className="input-field" type="text" placeholder="ej: 15" value={formData.fecha || ''} onChange={e => fd('fecha', e.target.value)} />
                    </div>
                  )}
                  {formTab === 'turbidez' && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Turbidez (UNF)</label>
                        <input className="input-field" type="number" step="0.01" placeholder="ej: 0.5" value={formData.turbidez || ''} onChange={e => fd('turbidez', e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Punto de medida</label>
                        <input className="input-field" type="text" placeholder="ej: Duchas 1ª planta" value={formData.punto_medida || ''} onChange={e => fd('punto_medida', e.target.value)} />
                      </div>
                    </>
                  )}
                </>
              )}

              {(formTab === 'purga_men' || formTab === 'termometros') && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Fecha</label>
                    <input className="input-field" type="date" value={formData.fecha || ''} onChange={e => fd('fecha', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                      {formTab === 'purga_men' ? 'Punto terminal / ramal' : 'Punto terminal / ramal'}
                    </label>
                    <input className="input-field" type="text" placeholder="ej: vestuario hombres piscina" value={formData.punto || ''} onChange={e => fd('punto', e.target.value)} />
                  </div>
                  {formTab === 'termometros' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Temperatura (°C)</label>
                      <input className="input-field" type="number" step="0.1" placeholder="ej: 55" value={formData.temperatura || ''} onChange={e => fd('temperatura', e.target.value)} />
                    </div>
                  )}
                </>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Responsable</label>
                <input className="input-field" type="text" placeholder="Nombre del responsable" value={formData.nombre || ''} onChange={e => fd('nombre', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => { setFormTab(null); setFormData({}); }}>Cancelar</button>
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

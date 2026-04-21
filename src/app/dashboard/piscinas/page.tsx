'use client';
import { useState, useMemo, useRef } from 'react';
import { useApp, THRESHOLDS, TEMP_AGUA_THRESHOLDS } from '@/lib/store';
import { SEASONAL_POOLS, BASE_POOLS } from '@/types';
import type { PoolName, MeasurementSession } from '@/types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

const POOL_COLORS: Record<string, string> = {
  'P. Grande': '#0077cc', 'P. Peq.-Med.': '#0f6e56', 'SPA': '#7c3aed', 'Pileta': '#c2410c',
  'P. Ext. Grande': '#0891b2', 'P. Ext. Pequeña': '#059669', 'Splash': '#d97706',
};

const PARAMS_META_KEYS = [
  { key: 'cloroLibre',     label: 'Cloro Libre',     unit: 'mg/L', color: '#0077cc' },
  { key: 'cloroCombinado', label: 'Cloro Combinado', unit: 'mg/L', color: '#e67e22' },
  { key: 'ph',             label: 'pH',               unit: '',     color: '#7c3aed' },
  { key: 'temperatura',    label: 'Temperatura Agua', unit: '°C',   color: '#ef4444' },
  { key: 'turbidez',       label: 'Turbidez',         unit: 'NTU',  color: '#6b7280' },
] as const;

function getTempRange(pool: string) {
  return TEMP_AGUA_THRESHOLDS[pool] ?? { min: 0, max: 40 };
}

function valueClass(v: number | null | undefined, min: number, max: number) {
  if (v === null || v === undefined) return '';
  if (v < min || v > max) {
    const dev = Math.abs(v - (v < min ? min : max)) / Math.max(max - min, 1);
    return dev > 0.3 ? 'val-danger' : 'val-warning';
  }
  return 'val-ok';
}

function valueClassPool(v: number | null | undefined, key: string, pool: string) {
  if (v === null || v === undefined) return '';
  if (key === 'temperatura') { const { min, max } = getTempRange(pool); return valueClass(v, min, max); }
  if (key === 'cloroLibre')     return valueClass(v, THRESHOLDS.cloroLibre.min, THRESHOLDS.cloroLibre.max);
  if (key === 'cloroCombinado') return valueClass(v, 0, THRESHOLDS.cloroCombinado.max);
  if (key === 'ph')             return valueClass(v, THRESHOLDS.ph.min, THRESHOLDS.ph.max);
  if (key === 'turbidez')       return valueClass(v, 0, THRESHOLDS.turbidez.max);
  return '';
}

// ─── PDF Export ────────────────────────────────────────────────────────────────
// Zona de ambiente según piscina seleccionada
function getAmbZone(pool: string): 'grande' | 'pequena' | 'spa' | null {
  if (pool === 'todas' || pool === 'P. Grande') return 'grande';
  if (pool === 'P. Peq.-Med.') return 'pequena';
  if (pool === 'SPA') return 'spa';
  return 'grande'; // default para exteriores/pileta
}

function exportPDF(parametros: any[], pool: PoolName | 'todas', activePools: PoolName[]) {
  const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const poolsToShow = pool === 'todas' ? activePools : [pool];
  const period = parametros.length > 0 ? `${parametros[0].date} — ${parametros[parametros.length - 1].date}` : '—';
  const zone = pool === 'todas' ? null : getAmbZone(pool);
  const zoneLabel = zone === 'pequena' ? 'P. Pequeña' : zone === 'spa' ? 'SPA' : 'P. Grande';

  const clr = (v: number | null | undefined, min: number, max: number) =>
    v == null ? '#888' : (v < min || v > max) ? '#dc2626' : '#15803d';

  // Single combined table: water params + ambient zone + co2
  const tableRows = [...parametros].reverse().flatMap(rec =>
    poolsToShow.map(p => {
      const tr = getTempRange(p);
      // Pick the right ambient zone
      let ta: number | null = null, hr: number | null = null;
      const z = pool === 'todas' ? getAmbZone(p) : zone;
      if (z === 'grande')  { ta = rec.params.tempAmbienteGrande ?? rec.params.tempAmbiente; hr = rec.params.humedadGrande ?? rec.params.humedadRelativa; }
      if (z === 'pequena') { ta = rec.params.tempAmbientePequena; hr = rec.params.humedadPequena; }
      if (z === 'spa')     { ta = rec.params.tempAmbienteSpa;     hr = rec.params.humedadSpa; }
      const delta = rec.params.co2Interior != null && rec.params.co2Exterior != null
        ? Math.round(rec.params.co2Interior - rec.params.co2Exterior) : null;
      return `<tr>
        <td>${rec.date}</td>
        <td>${rec.session === 'morning' ? '☀ M' : '🌆 T'}</td>
        <td style="font-weight:600;color:${POOL_COLORS[p]??'#333'}">${p}</td>
        <td style="color:${clr(rec.params.cloroLibre[p],0.5,2.0)};font-weight:600">${rec.params.cloroLibre[p]?.toFixed(2)??'—'}</td>
        <td style="color:${clr(rec.params.cloroCombinado[p],0,0.6)};font-weight:600">${rec.params.cloroCombinado[p]?.toFixed(2)??'—'}</td>
        <td style="color:${clr(rec.params.ph[p],7.2,7.8)};font-weight:600">${rec.params.ph[p]?.toFixed(2)??'—'}</td>
        <td style="color:${clr(rec.params.temperatura[p],tr.min,tr.max)};font-weight:600">${rec.params.temperatura[p]?.toFixed(1)??'—'}</td>
        <td style="color:${clr(rec.params.turbidez[p],0,5)};font-weight:600">${rec.params.turbidez[p]?.toFixed(2)??'—'}</td>
        <td style="color:${clr(ta,26,33)};font-weight:600">${ta?.toFixed(1)??'—'}</td>
        <td style="color:${clr(hr,50,70)};font-weight:600">${hr?.toFixed(1)??'—'}</td>
        <td>${rec.params.co2Interior?.toFixed(0)??'—'}</td>
        <td>${rec.params.co2Exterior?.toFixed(0)??'—'}</td>
        <td style="color:${delta!=null?(delta>500?'#dc2626':'#15803d'):'#888'};font-weight:600">${delta??'—'}</td>
      </tr>`;
    })
  ).join('');

  const thresholdCards = poolsToShow.map(p => {
    const tr = getTempRange(p);
    return `<div class="threshold-card" style="border-left-color:${POOL_COLORS[p]??'#94a3b8'}">
      <div class="tc-pool">${p}</div>
      <div class="tc-params">Cl. libre: <b>0.5–2.0 mg/L</b><br>Cl. comb.: <b>≤0.6 mg/L</b><br>pH: <b>7.2–7.8</b><br>Temperatura: <b>${tr.min}–${tr.max}°C</b><br>Turbidez: <b>≤5.0 NTU</b></div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Registro Calidad del Agua</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@300;400;600;700&family=Source+Sans+3:wght@300;400;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Source Sans 3',sans-serif;font-size:10pt;color:#1a1a2e;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.cover{page-break-after:always;min-height:100vh;display:flex;flex-direction:column;justify-content:space-between;padding:60px 72px;position:relative;overflow:hidden}
.cover::before{content:'';position:absolute;top:0;left:0;right:0;height:8px;background:linear-gradient(90deg,#0f1f3d,#0077cc 50%,#0f6e56)}
.cover-logo{font-family:'Source Serif 4',serif;font-size:13pt;font-weight:700;color:#0f1f3d}.cover-logo span{color:#0077cc}
.cover-badge{font-size:8pt;font-weight:600;color:#0077cc;border:1.5px solid #0077cc;padding:4px 10px;border-radius:20px;letter-spacing:.05em;text-transform:uppercase}
.cover-logo-area{display:flex;justify-content:space-between;align-items:flex-start}
.cover-title-area{flex:1;display:flex;flex-direction:column;justify-content:center;padding:80px 0 40px}
.cover-eyebrow{font-size:9pt;font-weight:600;color:#0077cc;text-transform:uppercase;letter-spacing:.12em;margin-bottom:20px}
.cover-title{font-family:'Source Serif 4',serif;font-size:34pt;font-weight:700;color:#0f1f3d;line-height:1.15;letter-spacing:-.02em;margin-bottom:16px}
.cover-subtitle{font-size:14pt;font-weight:300;color:#475569;line-height:1.5;max-width:500px}
.cover-divider{width:60px;height:4px;background:linear-gradient(90deg,#0077cc,#0f6e56);border-radius:2px;margin:32px 0}
.cover-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-bottom:60px}
.cover-meta-item label{display:block;font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:6px}
.cover-meta-item p{font-size:10.5pt;font-weight:600;color:#0f1f3d}
.cover-footer{border-top:1px solid #e2e8f0;padding-top:20px;display:flex;justify-content:space-between;align-items:center}
.cover-footer-text{font-size:8pt;color:#94a3b8}
.cover-legal{font-size:7.5pt;color:#94a3b8;max-width:400px;text-align:right;line-height:1.5}
@page{margin:18mm 16mm;size:A4 landscape}
.section-header{margin:16px 0 12px;padding-bottom:10px;border-bottom:2px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-end}
.section-title{font-family:'Source Serif 4',serif;font-size:13pt;font-weight:700;color:#0f1f3d}
.section-period{font-size:8.5pt;color:#64748b}
.threshold-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;page-break-inside:avoid}
.threshold-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;border-left:3px solid}
.tc-pool{font-size:8pt;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
.tc-params{font-size:9pt;line-height:1.8;color:#334155}
table{width:100%;border-collapse:collapse;font-size:8pt;page-break-inside:auto}
thead{display:table-header-group}tr{page-break-inside:avoid}
th{background:#0f1f3d;color:#fff;padding:7px 8px;text-align:left;font-size:7pt;font-weight:600;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}
td{padding:6px 8px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
tr:nth-child(even) td{background:#fafbfc}
.legend{display:flex;gap:16px;align-items:center;margin-bottom:14px;padding:8px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0}
.legend-item{display:flex;align-items:center;gap:6px;font-size:8pt;color:#475569}
.legend-dot{width:10px;height:10px;border-radius:50%;display:inline-block;flex-shrink:0}
.page-footer{position:fixed;bottom:0;left:16mm;right:16mm;height:14mm;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;font-size:7pt;color:#94a3b8}
</style></head><body>
<div class="cover">
  <div class="cover-logo-area"><div class="cover-logo">Aqua<span>Dash</span></div><div class="cover-badge">Documento oficial</div></div>
  <div class="cover-title-area">
    <div class="cover-eyebrow">Registro de control de calidad</div>
    <div class="cover-title">Calidad del Agua<br>en Instalaciones<br>Acuáticas</div>
    <div class="cover-divider"></div>
    <div class="cover-subtitle">Registro oficial de parámetros fisicoquímicos conforme al Real Decreto 742/2013 y normativa del País Vasco.</div>
  </div>
  <div class="cover-meta-grid">
    <div class="cover-meta-item"><label>Instalación</label><p>${pool === 'todas' ? 'Todas las piscinas' : pool}</p></div>
    <div class="cover-meta-item"><label>Período</label><p>${period}</p></div>
    <div class="cover-meta-item"><label>Fecha de emisión</label><p>${today}</p></div>
  </div>
  <div class="cover-footer">
    <div class="cover-footer-text">Generado por <strong>AquaDash</strong></div>
    <div class="cover-legal">Documento emitido electrónicamente. Datos registrados por personal cualificado.</div>
  </div>
</div>

<div class="page-footer"><span><strong>AquaDash</strong> — ${pool === 'todas' ? 'Todas las piscinas' : pool}</span><span>Período: ${period} · Emitido: ${today}</span></div>

<div class="section-header"><div class="section-title">Umbrales de referencia</div><div class="section-period">RD 742/2013</div></div>
<div class="threshold-grid">${thresholdCards}</div>

<div class="legend">
  <span style="font-size:8pt;font-weight:600;color:#334155;margin-right:8px">Leyenda:</span>
  <div class="legend-item"><div class="legend-dot" style="background:#15803d"></div>Conforme</div>
  <div class="legend-item"><div class="legend-dot" style="background:#dc2626"></div>Fuera de rango</div>
  <div class="legend-item"><div class="legend-dot" style="background:#888"></div>Sin dato</div>
  ${pool !== 'todas' ? `<span style="font-size:8pt;color:#475569;margin-left:8px">Datos ambientales: zona <strong>${zoneLabel}</strong></span>` : ''}
</div>

<div class="section-header"><div class="section-title">Registro de mediciones</div><div class="section-period">Período: ${period}</div></div>
<table>
  <thead><tr>
    <th>Fecha</th><th>Ses.</th><th>Piscina</th>
    <th>Cl.Libre<br><span style="opacity:.7;font-weight:400">0.5–2.0</span></th>
    <th>Cl.Comb.<br><span style="opacity:.7;font-weight:400">≤0.6</span></th>
    <th>pH<br><span style="opacity:.7;font-weight:400">7.2–7.8</span></th>
    <th>Tª Agua<br><span style="opacity:.7;font-weight:400">por zona</span></th>
    <th>Turbidez<br><span style="opacity:.7;font-weight:400">≤5.0</span></th>
    <th>Tª Amb. (°C)<br><span style="opacity:.7;font-weight:400">26–33</span></th>
    <th>Humedad (%)<br><span style="opacity:.7;font-weight:400">50–70</span></th>
    <th>CO₂ Int.</th>
    <th>CO₂ Ext.</th>
    <th>ΔCO₂<br><span style="opacity:.7;font-weight:400">≤500</span></th>
  </tr></thead>
  <tbody>${tableRows}</tbody>
</table>

<div style="margin-top:40px;page-break-inside:avoid">
  <div class="section-header"><div class="section-title">Validación y firma</div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:40px;margin-top:20px">
    ${['Responsable Técnico','Supervisor de Instalación','Visado Administración'].map(r=>`
    <div><p style="font-size:8pt;color:#64748b;margin-bottom:40px">${r}</p>
    <div style="border-top:1px solid #334155;padding-top:8px"><p style="font-size:8pt;color:#94a3b8">Nombre y firma</p></div></div>`).join('')}
  </div>
  <div style="margin-top:24px;padding:12px 16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
    <p style="font-size:7.5pt;color:#64748b;line-height:1.6"><strong>Nota legal:</strong> Registro oficial conforme al Real Decreto 742/2013. Emitido mediante sistema informatizado de gestión AquaDash.</p>
  </div>
</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) win.onload = () => { setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 800); };
}
// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function PiscinasPage() {
  const { hasPermission, parametros, alerts, activePools, toggleSeasonalPool, addPoolParam, currentUser } = useApp();
  const [selectedPool, setSelectedPool] = useState<string>('P. Grande');
  const [selectedParam, setSelectedParam] = useState<string>('cloroLibre');
  const [tab, setTab] = useState<'resumen' | 'ambiente' | 'graficos' | 'tabla'>('resumen');
  const [formOpen, setFormOpen] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [pdfModal, setPdfModal] = useState(false);
  const [pdfPool, setPdfPool] = useState<PoolName | 'todas'>('todas');
  const [saving, setSaving] = useState(false);

  // Form refs
  const dateRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<HTMLSelectElement>(null);
  const taGrandeRef = useRef<HTMLInputElement>(null);
  const hGrandeRef = useRef<HTMLInputElement>(null);
  const taSpaRef = useRef<HTMLInputElement>(null);
  const hSpaRef = useRef<HTMLInputElement>(null);
  const taPequenaRef = useRef<HTMLInputElement>(null);
  const hPequenaRef = useRef<HTMLInputElement>(null);
  const co2IntRef = useRef<HTMLInputElement>(null);
  const co2ExtRef = useRef<HTMLInputElement>(null);
  // Per-pool param refs: { pool: { param: ref } }
  const poolRefs = useRef<Record<string, Record<string, React.RefObject<HTMLInputElement>>>>({});

  if (!hasPermission('view_piscinas')) {
    return <div className="alert-banner alert-danger"><span>⛔</span> Sin permiso para ver esta sección.</div>;
  }

  const canEdit = hasPermission('edit_piscinas');
  const isAdmin = currentUser?.role === 'admin';

  // BASE_POOLS siempre visibles + temporada solo si activa
  const visiblePools = activePools;

  const filteredParametros = useMemo(() =>
    sessionFilter === 'all' ? parametros : parametros.filter(r => r.session === sessionFilter),
    [parametros, sessionFilter]
  );

  const paramMeta = PARAMS_META_KEYS.find(p => p.key === selectedParam)!;
  const getParamRange = (pool: string) => {
    if (selectedParam === 'temperatura') return getTempRange(pool);
    if (selectedParam === 'cloroLibre') return { min: THRESHOLDS.cloroLibre.min, max: THRESHOLDS.cloroLibre.max };
    if (selectedParam === 'cloroCombinado') return { min: 0, max: THRESHOLDS.cloroCombinado.max };
    if (selectedParam === 'ph') return { min: THRESHOLDS.ph.min, max: THRESHOLDS.ph.max };
    if (selectedParam === 'turbidez') return { min: 0, max: THRESHOLDS.turbidez.max };
    return { min: 0, max: 100 };
  };
  const { min: pMin, max: pMax } = getParamRange(selectedPool);

  const chartData = filteredParametros.slice(-30).map(rec => ({
    date: `${rec.date.slice(5)} ${rec.session === 'morning' ? '☀' : '🌆'}`,
    value: (rec.params as any)[selectedParam]?.[selectedPool] ?? null,
  })).filter(d => d.value !== null);

  const poolAlerts = alerts.filter(a => a.section === 'piscinas' && !a.resolved);

  // Init pool refs
  visiblePools.forEach(pool => {
    if (!poolRefs.current[pool]) {
      poolRefs.current[pool] = {};
      PARAMS_META_KEYS.forEach(pm => {
        poolRefs.current[pool][pm.key] = { current: null } as any;
      });
    }
  });

  const handleSave = async () => {
    if (!dateRef.current || !sessionRef.current) return;
    setSaving(true);
    try {
      const date = dateRef.current.value;
      const session = sessionRef.current.value as MeasurementSession;
      const num = (ref: React.RefObject<HTMLInputElement>) => {
        const v = parseFloat(ref.current?.value ?? '');
        return isNaN(v) ? null : v;
      };

      const cloroLibre: Record<string, number | null> = {};
      const cloroCombinado: Record<string, number | null> = {};
      const ph: Record<string, number | null> = {};
      const temperatura: Record<string, number | null> = {};
      const turbidez: Record<string, number | null> = {};

      visiblePools.forEach(pool => {
        const refs = poolRefs.current[pool];
        cloroLibre[pool]     = num(refs['cloroLibre']);
        cloroCombinado[pool] = num(refs['cloroCombinado']);
        ph[pool]             = num(refs['ph']);
        temperatura[pool]    = num(refs['temperatura']);
        turbidez[pool]       = num(refs['turbidez']);
      });

      await addPoolParam({
        date, session,
        params: {
          cloroLibre, cloroCombinado, ph, temperatura, turbidez,
          tempAmbiente:        num(taGrandeRef),
          humedadRelativa:     num(hGrandeRef),
          co2Interior:         num(co2IntRef),
          co2Exterior:         num(co2ExtRef),
          tempAmbienteGrande:  num(taGrandeRef),
          tempAmbientePequena: num(taPequenaRef),
          tempAmbienteSpa:     num(taSpaRef),
          humedadGrande:       num(hGrandeRef),
          humedadPequena:      num(hPequenaRef),
          humedadSpa:          num(hSpaRef),
        } as any,
      });
      setFormOpen(false);
    } catch (e) {
      console.error(e);
      alert('Error al guardar. Revisa la consola.');
    } finally {
      setSaving(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const val = payload[0]?.value;
    return (
      <div className="card" style={{ padding: '10px 14px', fontSize: '12px' }}>
        <p style={{ margin: '0 0 4px', fontWeight: '600' }}>{label}</p>
        <p style={{ margin: 0 }}>
          <strong style={{ color: paramMeta.color }}>{val?.toFixed(2)}</strong> {paramMeta.unit}
          {(val < pMin || val > pMax) && <span style={{ marginLeft: '6px', color: '#dc2626', fontWeight: '600' }}>⚠ Fuera de rango</span>}
        </p>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f1f3d', margin: '0 0 4px' }}>🏊 Piscinas</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Control de calidad del agua · Mañana y tarde</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isAdmin && <button className="btn btn-secondary" onClick={() => setPdfModal(true)}>📄 Exportar PDF oficial</button>}
          {canEdit && <button className="btn btn-primary" onClick={() => setFormOpen(true)}>+ Nueva medición</button>}
        </div>
      </div>

      {/* Seasonal toggles (admin only) */}
      {isAdmin && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🌞 Piscinas de temporada</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {SEASONAL_POOLS.map(pool => {
              const active = activePools.includes(pool);
              return (
                <button key={pool} onClick={() => toggleSeasonalPool(pool)}
                  style={{ padding: '7px 14px', borderRadius: '20px', border: `2px solid ${active ? POOL_COLORS[pool] : '#e2eaf4'}`, background: active ? POOL_COLORS[pool] + '18' : '#f8fafc', color: active ? POOL_COLORS[pool] : '#94a3b8', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {active ? '✅' : '⭕'} {pool}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Alerts */}
      {poolAlerts.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {poolAlerts.slice(0, 3).map(a => (
            <div key={a.id} className={`alert-banner alert-${a.type === 'danger' ? 'danger' : 'warning'}`} style={{ marginBottom: '8px' }}>
              <span>{a.type === 'danger' ? '🚨' : '⚠️'}</span>
              <div><strong>{a.message}</strong> — Valor: <strong>{a.value}</strong> (límite: {a.threshold}) · {a.timestamp}</div>
            </div>
          ))}
        </div>
      )}

      {/* Session filter */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {([['all','Todas'], ['morning','☀ Mañana'], ['afternoon','🌆 Tarde']] as const).map(([val, lbl]) => (
          <button key={val} onClick={() => setSessionFilter(val)}
            style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', background: sessionFilter === val ? '#fff' : 'transparent', color: sessionFilter === val ? '#0f1f3d' : '#64748b', boxShadow: sessionFilter === val ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content', flexWrap: 'wrap' }}>
        {(['resumen', 'ambiente', 'graficos', 'tabla'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0f1f3d' : '#64748b', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
            {t === 'resumen' ? '🏠 Resumen' : t === 'ambiente' ? '🌡️ Ambiente' : t === 'graficos' ? '📈 Gráficos' : '📋 Tabla'}
          </button>
        ))}
      </div>

      {/* ── RESUMEN: solo piscinas activas ── */}
      {tab === 'resumen' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {visiblePools.map(pool => {
            const last = filteredParametros[filteredParametros.length - 1];
            if (!last) return null;
            const tr = getTempRange(pool);
            const cl   = last.params.cloroLibre[pool as PoolName];
            const cc   = last.params.cloroCombinado[pool as PoolName];
            const ph   = last.params.ph[pool as PoolName];
            const temp = last.params.temperatura[pool as PoolName];
            const turb = last.params.turbidez[pool as PoolName];
            const issues: string[] = [];
            if (cl   != null && (cl < 0.5 || cl > 2.0))          issues.push('Cloro libre');
            if (cc   != null && cc > 0.6)                          issues.push('Cloro comb.');
            if (ph   != null && (ph < 7.2 || ph > 7.8))           issues.push('pH');
            if (temp != null && (temp < tr.min || temp > tr.max))  issues.push('Temperatura');
            if (turb != null && turb > 5.0)                        issues.push('Turbidez');
            return (
              <div key={pool} className="card" style={{ padding: '20px', borderTop: `3px solid ${POOL_COLORS[pool] ?? '#94a3b8'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#0f1f3d' }}>{pool}</h3>
                  <span className={`badge ${issues.length === 0 ? 'badge-ok' : 'badge-danger'}`}>
                    {issues.length === 0 ? '✓ OK' : `${issues.length} incidencia${issues.length > 1 ? 's' : ''}`}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: 'Cloro libre', val: cl, min: 0.5, max: 2.0, unit: 'mg/L' },
                    { label: 'Cloro comb.', val: cc, min: 0, max: 0.6, unit: 'mg/L' },
                    { label: 'pH', val: ph, min: 7.2, max: 7.8, unit: '' },
                    { label: 'Temperatura', val: temp, min: tr.min, max: tr.max, unit: '°C' },
                    { label: 'Turbidez', val: turb, min: 0, max: 5.0, unit: 'NTU' },
                  ].map(({ label, val, min, max, unit }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{label}</span>
                      <span className={valueClass(val, min, max)} style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                        {val?.toFixed(2) ?? '—'} <span style={{ fontSize: '11px', color: '#94a3b8' }}>{unit}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
                  Temp.: {tr.min}–{tr.max}°C · {last.date} · {last.session === 'morning' ? '☀' : '🌆'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── AMBIENTE ── */}
      {tab === 'ambiente' && (() => {
        const lastAmb = [...filteredParametros].reverse().find(r =>
          r.params.tempAmbienteGrande != null || r.params.tempAmbiente != null
        );
        const co2Delta = lastAmb?.params.co2Interior != null && lastAmb?.params.co2Exterior != null
          ? Math.round(lastAmb.params.co2Interior - lastAmb.params.co2Exterior) : null;
        return (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '28px' }}>
              {[
                { zone: '🏊 Zona P. Grande', ta: lastAmb?.params.tempAmbienteGrande ?? lastAmb?.params.tempAmbiente ?? null, hr: lastAmb?.params.humedadGrande ?? lastAmb?.params.humedadRelativa ?? null, color: '#0077cc' },
                { zone: '🏊 Zona P. Pequeña', ta: lastAmb?.params.tempAmbientePequena ?? null, hr: lastAmb?.params.humedadPequena ?? null, color: '#0f6e56' },
                { zone: '🧖 Zona SPA', ta: lastAmb?.params.tempAmbienteSpa ?? null, hr: lastAmb?.params.humedadSpa ?? null, color: '#7c3aed' },
              ].map(({ zone, ta, hr, color }) => (
                <div key={zone} className="card" style={{ padding: '18px', borderTop: `3px solid ${color}` }}>
                  <h3 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: '700', color: '#0f1f3d' }}>{zone}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Temp. ambiente</span>
                      <span className={valueClass(ta, 26, 33)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{ta?.toFixed(1) ?? '—'} <span style={{ color: '#94a3b8', fontSize: '11px' }}>°C</span></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Humedad relativa</span>
                      <span className={valueClass(hr, 50, 70)} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{hr?.toFixed(1) ?? '—'} <span style={{ color: '#94a3b8', fontSize: '11px' }}>%</span></span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="card" style={{ padding: '18px', borderTop: '3px solid #84cc16' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: '700', color: '#0f1f3d' }}>💨 CO₂</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', color: '#64748b' }}>Interior</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{lastAmb?.params.co2Interior?.toFixed(0) ?? '—'} <span style={{ color: '#94a3b8', fontSize: '11px' }}>ppm</span></span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', color: '#64748b' }}>Exterior</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{lastAmb?.params.co2Exterior?.toFixed(0) ?? '—'} <span style={{ color: '#94a3b8', fontSize: '11px' }}>ppm</span></span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>ΔCO₂</span><span className={co2Delta != null ? (co2Delta > 500 ? 'val-danger' : 'val-ok') : ''} style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{co2Delta ?? '—'} <span style={{ color: '#94a3b8', fontSize: '11px' }}>ppm</span></span></div>
                </div>
              </div>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead><tr>
                    <th>Fecha</th><th>Sesión</th>
                    <th>Tª Grande (°C)</th><th>Hum. Grande (%)</th>
                    <th>Tª Pequeña (°C)</th><th>Hum. Pequeña (%)</th>
                    <th>Tª SPA (°C)</th><th>Hum. SPA (%)</th>
                    <th>CO₂ Int.</th><th>CO₂ Ext.</th><th>ΔCO₂</th>
                  </tr></thead>
                  <tbody>
                    {[...filteredParametros].reverse().map(rec => {
                      const delta = rec.params.co2Interior != null && rec.params.co2Exterior != null
                        ? Math.round(rec.params.co2Interior - rec.params.co2Exterior) : null;
                      return (
                        <tr key={rec.id}>
                          <td style={{ whiteSpace: 'nowrap', fontWeight: '500' }}>{rec.date}</td>
                          <td>{rec.session === 'morning' ? '☀' : '🌆'}</td>
                          <td className={valueClass(rec.params.tempAmbienteGrande ?? rec.params.tempAmbiente, 26, 33)} style={{ fontFamily: 'var(--font-mono)' }}>{(rec.params.tempAmbienteGrande ?? rec.params.tempAmbiente)?.toFixed(1) ?? '—'}</td>
                          <td className={valueClass(rec.params.humedadGrande ?? rec.params.humedadRelativa, 50, 70)} style={{ fontFamily: 'var(--font-mono)' }}>{(rec.params.humedadGrande ?? rec.params.humedadRelativa)?.toFixed(1) ?? '—'}</td>
                          <td className={valueClass(rec.params.tempAmbientePequena, 26, 33)} style={{ fontFamily: 'var(--font-mono)' }}>{rec.params.tempAmbientePequena?.toFixed(1) ?? '—'}</td>
                          <td className={valueClass(rec.params.humedadPequena, 50, 70)} style={{ fontFamily: 'var(--font-mono)' }}>{rec.params.humedadPequena?.toFixed(1) ?? '—'}</td>
                          <td className={valueClass(rec.params.tempAmbienteSpa, 26, 33)} style={{ fontFamily: 'var(--font-mono)' }}>{rec.params.tempAmbienteSpa?.toFixed(1) ?? '—'}</td>
                          <td className={valueClass(rec.params.humedadSpa, 50, 70)} style={{ fontFamily: 'var(--font-mono)' }}>{rec.params.humedadSpa?.toFixed(1) ?? '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{rec.params.co2Interior?.toFixed(0) ?? '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{rec.params.co2Exterior?.toFixed(0) ?? '—'}</td>
                          <td className={delta != null ? (delta > 500 ? 'val-danger' : 'val-ok') : ''} style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{delta ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── GRÁFICOS ── */}
      {tab === 'graficos' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '5px' }}>Piscina</label>
              <select className="input-field" style={{ width: 'auto' }} value={selectedPool} onChange={e => setSelectedPool(e.target.value)}>
                {visiblePools.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '5px' }}>Parámetro</label>
              <select className="input-field" style={{ width: 'auto' }} value={selectedParam} onChange={e => setSelectedParam(e.target.value)}>
                {PARAMS_META_KEYS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{paramMeta.label} — {selectedPool}</h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Rango: {pMin}–{pMax} {paramMeta.unit}</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={45} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                {pMin > 0 && <ReferenceLine y={pMin} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={1.5} />}
                <ReferenceLine y={pMax} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={1.5} />
                <Line type="monotone" dataKey="value" stroke={paramMeta.color} dot={false} strokeWidth={2} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── TABLA: con selector de piscina ── */}
      {tab === 'tabla' && (
        <div>
          <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Piscina:</label>
            <select className="input-field" style={{ width: 'auto' }} value={selectedPool} onChange={e => setSelectedPool(e.target.value)}>
              {visiblePools.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th><th>Sesión</th>
                    <th>Cl. Libre (mg/L)</th><th>Cl. Comb. (mg/L)</th>
                    <th>pH</th><th>Temperatura (°C)</th><th>Turbidez (NTU)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredParametros].reverse().map(rec => {
                    const tr = getTempRange(selectedPool);
                    return (
                      <tr key={rec.id}>
                        <td style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{rec.date}</td>
                        <td>{rec.session === 'morning' ? '☀ Mañana' : '🌆 Tarde'}</td>
                        <td className={valueClassPool(rec.params.cloroLibre[selectedPool as PoolName], 'cloroLibre', selectedPool)} style={{ fontFamily: 'var(--font-mono)' }}>{rec.params.cloroLibre[selectedPool as PoolName]?.toFixed(2) ?? '—'}</td>
                        <td className={valueClassPool(rec.params.cloroCombinado[selectedPool as PoolName], 'cloroCombinado', selectedPool)} style={{ fontFamily: 'var(--font-mono)' }}>{rec.params.cloroCombinado[selectedPool as PoolName]?.toFixed(2) ?? '—'}</td>
                        <td className={valueClassPool(rec.params.ph[selectedPool as PoolName], 'ph', selectedPool)} style={{ fontFamily: 'var(--font-mono)' }}>{rec.params.ph[selectedPool as PoolName]?.toFixed(2) ?? '—'}</td>
                        <td className={valueClass(rec.params.temperatura[selectedPool as PoolName], tr.min, tr.max)} style={{ fontFamily: 'var(--font-mono)' }}>{rec.params.temperatura[selectedPool as PoolName]?.toFixed(1) ?? '—'}</td>
                        <td className={valueClassPool(rec.params.turbidez[selectedPool as PoolName], 'turbidez', selectedPool)} style={{ fontFamily: 'var(--font-mono)' }}>{rec.params.turbidez[selectedPool as PoolName]?.toFixed(2) ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PDF ── */}
      {pdfModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '440px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f1f3d', marginBottom: '8px' }}>📄 Exportar PDF oficial</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>El informe incluye parámetros del agua y ambientales para el período seleccionado.</p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '6px' }}>Instalación</label>
              <select className="input-field" value={pdfPool} onChange={e => setPdfPool(e.target.value as any)}>
                <option value="todas">Todas las piscinas</option>
                {visiblePools.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setPdfModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => { exportPDF(filteredParametros, pdfPool, visiblePools); setPdfModal(false); }}>
                Generar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NUEVA MEDICIÓN ── */}
      {formOpen && canEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f1f3d', margin: 0 }}>Nueva medición de piscinas</h2>
              <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>×</button>
            </div>

            {/* Fecha + sesión */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Fecha</label>
                <input ref={dateRef} className="input-field" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Sesión</label>
                <select ref={sessionRef} className="input-field">
                  <option value="morning">☀ Mañana</option>
                  <option value="afternoon">🌆 Tarde</option>
                </select>
              </div>
            </div>

            {/* Ambiente zona Grande */}
            <div style={{ marginBottom: '14px', padding: '14px', background: '#e6f4ff', borderRadius: '8px', borderLeft: '3px solid #0077cc' }}>
              <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#0f1f3d' }}>🌡️ Zona P. Grande — Ambiente</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' }}>Temp. ambiente (°C)</label><input ref={taGrandeRef} className="input-field" type="number" step="0.1" placeholder="26–33" style={{ fontSize: '13px' }} /></div>
                <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' }}>Humedad relativa (%)</label><input ref={hGrandeRef} className="input-field" type="number" step="0.1" placeholder="50–70" style={{ fontSize: '13px' }} /></div>
              </div>
            </div>

            {/* Ambiente zona SPA */}
            <div style={{ marginBottom: '14px', padding: '14px', background: '#ede9fe', borderRadius: '8px', borderLeft: '3px solid #7c3aed' }}>
              <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#0f1f3d' }}>🧖 Zona SPA — Ambiente</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' }}>Temp. ambiente (°C)</label><input ref={taSpaRef} className="input-field" type="number" step="0.1" placeholder="26–33" style={{ fontSize: '13px' }} /></div>
                <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' }}>Humedad relativa (%)</label><input ref={hSpaRef} className="input-field" type="number" step="0.1" placeholder="50–70" style={{ fontSize: '13px' }} /></div>
              </div>
            </div>

            {/* Ambiente zona Pequeña */}
            <div style={{ marginBottom: '14px', padding: '14px', background: '#e6fff8', borderRadius: '8px', borderLeft: '3px solid #0f6e56' }}>
              <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#0f1f3d' }}>🏊 Zona P. Pequeña — Ambiente</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' }}>Temp. ambiente (°C)</label><input ref={taPequenaRef} className="input-field" type="number" step="0.1" placeholder="26–33" style={{ fontSize: '13px' }} /></div>
                <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' }}>Humedad relativa (%)</label><input ref={hPequenaRef} className="input-field" type="number" step="0.1" placeholder="50–70" style={{ fontSize: '13px' }} /></div>
              </div>
            </div>

            {/* CO2 */}
            <div style={{ marginBottom: '14px', padding: '14px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
              <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#0f1f3d' }}>💨 CO₂</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' }}>CO₂ Interior (ppm)</label><input ref={co2IntRef} className="input-field" type="number" step="1" placeholder="ej. 500" style={{ fontSize: '13px' }} /></div>
                <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' }}>CO₂ Exterior (ppm)</label><input ref={co2ExtRef} className="input-field" type="number" step="1" placeholder="ej. 420" style={{ fontSize: '13px' }} /></div>
              </div>
            </div>

            {/* Params por piscina */}
            {visiblePools.map(pool => (
              <div key={pool} style={{ marginBottom: '14px', padding: '14px', background: '#f8fafc', borderRadius: '8px', borderLeft: `3px solid ${POOL_COLORS[pool] ?? '#94a3b8'}` }}>
                <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#0f1f3d' }}>{pool}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {PARAMS_META_KEYS.map(pm => {
                    const { min, max } = pm.key === 'temperatura' ? getTempRange(pool) : getParamRange(pool);
                    if (!poolRefs.current[pool]) poolRefs.current[pool] = {};
                    if (!poolRefs.current[pool][pm.key]) poolRefs.current[pool][pm.key] = { current: null } as any;
                    return (
                      <div key={pm.key}>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' }}>
                          {pm.label} {pm.unit && `(${pm.unit})`}
                        </label>
                        <input
                          ref={(el) => { if (poolRefs.current[pool]) poolRefs.current[pool][pm.key] = { current: el } as any; }}
                          className="input-field" type="number" step="0.01"
                          placeholder={`${min}–${max}`}
                          style={{ fontSize: '13px' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar medición'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

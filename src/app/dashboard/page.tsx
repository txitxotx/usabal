'use client';
import { useApp, THRESHOLDS } from '@/lib/store';
import type { PoolName } from '@/types';
import { useRouter } from 'next/navigation';

const SECTION_CARDS = [
  { label: 'Piscinas', icon: '🏊', path: '/dashboard/piscinas', perm: 'view_piscinas', color: '#0077cc', bg: '#e6f4ff', desc: 'Parámetros de calidad del agua' },
  { label: 'Contadores', icon: '📊', path: '/dashboard/contadores', perm: 'view_contadores', color: '#0f6e56', bg: '#e1f5ee', desc: 'Consumos diarios: agua, gas, luz' },
  { label: 'Legionella', icon: '🧫', path: '/dashboard/legionella', perm: 'view_legionella', color: '#7c3aed', bg: '#ede9fe', desc: 'Control ACS y biocida' },
  { label: 'Incendios', icon: '🔥', path: '/dashboard/incendios', perm: 'view_incendios', color: '#c2410c', bg: '#fff7ed', desc: 'Revisiones y extintores' },
] as const;

export default function DashboardHome() {
  const { currentUser, hasPermission, alerts, contadores, parametros, legionellaTemps } = useApp();
  const router = useRouter();

  const unresolved = alerts.filter(a => !a.resolved);
  const dangerCount = unresolved.filter(a => a.type === 'danger').length;
  const warningCount = unresolved.filter(a => a.type === 'warning').length;

  // Last 7 entries
  const last7 = contadores.slice(-7);
  const avgAccesos = last7.length > 0 ? Math.round(last7.reduce((s, e) => s + (e.accesos || 0), 0) / last7.filter(e => e.accesos > 0).length) : 0;
  const lastContador = contadores[contadores.length - 1];
  const lastParam = parametros[parametros.length - 1];
  const lastTemp = legionellaTemps[legionellaTemps.length - 1];

  // Check last param violations
  const poolsWithIssues = lastParam ? Object.entries(lastParam.params.cloroLibre).filter(([, v]) => v !== null && (v < THRESHOLDS.cloroLibre.min || v > THRESHOLDS.cloroLibre.max)).map(([k]) => k) : [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f1f3d', margin: '0 0 4px' }}>
          {greeting}, {currentUser?.name.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          Panel de control — actualizado hoy
        </p>
      </div>

      {/* Alert strip */}
      {dangerCount > 0 && (
        <div className="alert-banner alert-danger" style={{ marginBottom: '20px', cursor: 'pointer' }} onClick={() => router.push('/dashboard/alertas')}>
          <span style={{ fontSize: '16px' }}>🚨</span>
          <div>
            <strong>{dangerCount} alerta{dangerCount > 1 ? 's' : ''} crítica{dangerCount > 1 ? 's' : ''}</strong> requiere{dangerCount === 1 ? '' : 'n'} atención inmediata.
            {warningCount > 0 && ` También hay ${warningCount} advertencia${warningCount > 1 ? 's' : ''}.`}
            <span style={{ marginLeft: '8px', textDecoration: 'underline', fontWeight: '600' }}>Ver alertas →</span>
          </div>
        </div>
      )}

      {/* KPI metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div className="metric-card">
          <div className="metric-label">Accesos (media 7d)</div>
          <div className="metric-value">{avgAccesos.toLocaleString('es-ES')}</div>
          <div className="metric-sub">personas/día</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Agua General Ayer</div>
          <div className="metric-value">{lastContador?.aguaGeneralDiario ?? '—'} <span style={{ fontSize: '14px', fontWeight: '400', color: '#94a3b8' }}>m³</span></div>
          <div className="metric-sub">contador: {lastContador?.aguaGeneral.toLocaleString('es-ES')}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Gas Ayer</div>
          <div className="metric-value">{lastContador?.gasDiario ?? '—'} <span style={{ fontSize: '14px', fontWeight: '400', color: '#94a3b8' }}>m³</span></div>
          <div className="metric-sub">contador: {lastContador?.gas.toLocaleString('es-ES')}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Temp. Retorno ACS</div>
          <div className="metric-value" style={{ color: lastTemp && lastTemp.tempRetorno < 50 ? '#dc2626' : '#0f1f3d' }}>
            {lastTemp?.tempRetorno ?? '—'} <span style={{ fontSize: '14px', fontWeight: '400', color: '#94a3b8' }}>°C</span>
          </div>
          <div className="metric-sub">mínimo 50°C (Legionella)</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Alertas activas</div>
          <div className="metric-value" style={{ color: dangerCount > 0 ? '#dc2626' : warningCount > 0 ? '#d97706' : '#15803d' }}>
            {dangerCount + warningCount}
          </div>
          <div className="metric-sub">{dangerCount} críticas · {warningCount} avisos</div>
        </div>
      </div>

      {/* Section cards */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#0f1f3d', marginBottom: '14px' }}>Secciones</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {SECTION_CARDS.map(s => {
            if (!hasPermission(s.perm as any)) return null;
            const sectionAlerts = unresolved.filter(a => a.section === s.label.toLowerCase()).length;
            return (
              <button
                key={s.path}
                onClick={() => router.push(s.path)}
                style={{ background: '#fff', border: '1px solid #e2eaf4', borderRadius: '12px', padding: '20px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: '8px' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = s.color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2eaf4'; (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', background: s.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    {s.icon}
                  </div>
                  {sectionAlerts > 0 && (
                    <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '20px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>
                      {sectionAlerts}
                    </span>
                  )}
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: '600', color: '#0f1f3d' }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{s.desc}</p>
                </div>
                <span style={{ fontSize: '12px', color: s.color, fontWeight: '600' }}>Ver datos →</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pools status today */}
      {hasPermission('view_piscinas') && lastParam && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#0f1f3d', marginBottom: '16px' }}>Estado piscinas — última medición ({lastParam.date})</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Piscina</th>
                  <th>Cloro libre (0.5–2.0)</th>
                  <th>Cloro comb. (≤0.6)</th>
                  <th>pH (7.2–7.8)</th>
                  <th>Temperatura</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(lastParam.params.cloroLibre).map(pool => {
const cl = lastParam.params.cloroLibre[pool as PoolName];
const cc = lastParam.params.cloroCombinado[pool as PoolName];
const ph = lastParam.params.ph[pool as PoolName];
const temp = lastParam.params.temperatura[pool as PoolName];
                  const clOk = cl === null || (cl >= 0.5 && cl <= 2.0);
                  const ccOk = cc === null || cc <= 0.6;
                  const phOk = ph === null || (ph >= 7.2 && ph <= 7.8);
                  const allOk = clOk && ccOk && phOk;
                  const cls = (v: number | null, min: number, max: number) => {
                    if (v === null) return '';
                    if (v < min || v > max) return v < min * 0.8 || v > max * 1.2 ? 'val-danger' : 'val-warning';
                    return 'val-ok';
                  };
                  return (
                    <tr key={pool}>
                      <td style={{ fontWeight: '500', color: '#0f1f3d' }}>{pool}</td>
                      <td className={cls(cl, 0.5, 2.0)}>{cl?.toFixed(2) ?? '—'}</td>
                      <td className={cls(cc, 0, 0.6)}>{cc?.toFixed(2) ?? '—'}</td>
                      <td className={cls(ph, 7.2, 7.8)}>{ph?.toFixed(2) ?? '—'}</td>
                      <td>{temp?.toFixed(1) ?? '—'} °C</td>
                      <td>
                        <span className={`badge ${allOk ? 'badge-ok' : 'badge-danger'}`}>
                          {allOk ? '✓ OK' : '✗ Revisar'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent alerts */}
      {hasPermission('view_alerts') && unresolved.length > 0 && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#0f1f3d', margin: 0 }}>Alertas recientes</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => router.push('/dashboard/alertas')}>Ver todas</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {unresolved.slice(0, 5).map(a => (
              <div key={a.id} className={`alert-banner alert-${a.type === 'info' ? 'info' : a.type === 'danger' ? 'danger' : 'warning'}`}>
                <span>{a.type === 'danger' ? '🚨' : '⚠️'}</span>
                <div style={{ flex: 1 }}>
                  <strong>{a.message}</strong>
                  {a.value !== undefined && <span style={{ marginLeft: '8px' }}>Valor: <strong>{a.value}</strong> (límite: {a.threshold})</span>}
                </div>
                <span style={{ fontSize: '11px', opacity: 0.7, whiteSpace: 'nowrap' }}>{a.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

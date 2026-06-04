'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import type { PoolName } from '@/types';

type TabKey = 'piscinas' | 'recirculacion' | 'contadores' | 'legionella';

const TABS: { key: TabKey; label: string; icon: string; color: string; bg: string }[] = [
  { key: 'piscinas',      label: 'Piscinas',      icon: '🏊', color: '#0077cc', bg: '#e6f4ff' },
  { key: 'recirculacion', label: 'Recirculación', icon: '🔄', color: '#0f6e56', bg: '#e1f5ee' },
  { key: 'contadores',    label: 'Contadores',    icon: '📊', color: '#b45309', bg: '#fffbeb' },
  { key: 'legionella',    label: 'Legionella',    icon: '🧫', color: '#7c3aed', bg: '#ede9fe' },
];

const POOL_COLORS: Record<string, string> = {
  'P. Grande': '#0077cc', 'P. Peq.-Med.': '#0f6e56', 'SPA': '#7c3aed', 'Pileta': '#c2410c',
  'P. Ext. Grande': '#0891b2', 'P. Ext. Pequeña': '#059669', 'Splash': '#d97706',
};

// ─── Componente: tarjeta editable de umbral min/max ────────────────────────────
function ThresholdCard({
  title, icon, unit, min, max, onMin, onMax, hint, accent, disabled, minOnly, maxOnly,
}: {
  title: string; icon: string; unit: string;
  min: number; max: number;
  onMin: (v: number) => void; onMax: (v: number) => void;
  hint?: string; accent: string; disabled?: boolean;
  minOnly?: boolean; maxOnly?: boolean;
}) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '14px',
      padding: '16px 18px',
      borderTop: `3px solid ${accent}`,
      opacity: disabled ? 0.55 : 1,
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f1f3d', flex: 1 }}>{title}</span>
        {unit && <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{unit}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: maxOnly || minOnly ? '1fr' : '1fr 1fr', gap: '10px' }}>
        {!maxOnly && (
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Mínimo
            </label>
            <input
              type="number"
              step="0.1"
              value={Number.isFinite(min) ? min : ''}
              disabled={disabled}
              onChange={e => onMin(parseFloat(e.target.value))}
              className="input-field"
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: '600', color: '#0f1f3d' }}
            />
          </div>
        )}
        {!minOnly && (
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Máximo
            </label>
            <input
              type="number"
              step="0.1"
              value={Number.isFinite(max) ? max : ''}
              disabled={disabled}
              onChange={e => onMax(parseFloat(e.target.value))}
              className="input-field"
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: '600', color: '#0f1f3d' }}
            />
          </div>
        )}
      </div>

      {hint && (
        <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ─── Componente: barra de acciones ────────────────────────────────────────────
function ActionsBar({
  dirty, saving, onSave, onReset, onDiscard,
}: {
  dirty: boolean; saving: boolean;
  onSave: () => void; onReset: () => void; onDiscard: () => void;
}) {
  return (
    <div style={{
      position: 'sticky', top: '56px', zIndex: 30,
      background: dirty ? 'linear-gradient(90deg, #fff7ed 0%, #fffbeb 100%)' : '#f8fafc',
      border: `1px solid ${dirty ? '#fcd34d' : '#e2e8f0'}`,
      borderRadius: '12px',
      padding: '12px 18px',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap',
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: dirty ? '#f59e0b' : '#22c55e',
          animation: dirty ? 'pulse 1.5s infinite' : 'none',
        }} />
        <span style={{ fontSize: '13px', fontWeight: '600', color: dirty ? '#78350f' : '#15803d' }}>
          {dirty ? 'Hay cambios sin guardar' : 'Todos los cambios guardados'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          className="btn btn-secondary"
          onClick={onReset}
          disabled={saving}
          title="Restablecer todos los umbrales de esta pestaña a los valores por defecto"
        >
          ↺ Restablecer por defecto
        </button>
        {dirty && (
          <button className="btn btn-secondary" onClick={onDiscard} disabled={saving}>
            Descartar
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={onSave}
          disabled={!dirty || saving}
          style={{ minWidth: '120px' }}
        >
          {saving ? 'Guardando…' : '💾 Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const {
    hasPermission, currentUser, activePools,
    thresholds, tempAguaThresholds, recircThresholds, contadoresThresholds,
    updateThresholds, updateTempAguaThresholds, updateRecircThresholds, updateContadoresThresholds,
    resetThresholds, resetTempAguaThresholds, resetRecircThresholds, resetContadoresThresholds,
  } = useApp();

  const [tab, setTab] = useState<TabKey>('piscinas');
  const [saving, setSaving] = useState(false);

  // Estados locales (drafts) por pestaña — sólo se persisten al pulsar Guardar
  const [draftThresholds, setDraftThresholds]           = useState(thresholds);
  const [draftTempAgua, setDraftTempAgua]               = useState(tempAguaThresholds);
  const [draftRecirc, setDraftRecirc]                   = useState(recircThresholds);
  const [draftContadores, setDraftContadores]           = useState(contadoresThresholds);

  // Si llega un cambio externo (otra pestaña, otro usuario), refrescar el draft
  useEffect(() => { setDraftThresholds(thresholds); },           [thresholds]);
  useEffect(() => { setDraftTempAgua(tempAguaThresholds); },     [tempAguaThresholds]);
  useEffect(() => { setDraftRecirc(recircThresholds); },         [recircThresholds]);
  useEffect(() => { setDraftContadores(contadoresThresholds); }, [contadoresThresholds]);

  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: '600px' }}>
        <div className="alert-banner alert-danger">
          <span>⛔</span>
          <div>
            <strong>Acceso restringido.</strong> Sólo los administradores pueden modificar los umbrales del sistema.
          </div>
        </div>
      </div>
    );
  }

  // ─── ¿Hay cambios en la pestaña actual? ────────────────────────────────────
  const dirtyPiscinas      = JSON.stringify(draftThresholds) !== JSON.stringify(thresholds)
                          || JSON.stringify(draftTempAgua)   !== JSON.stringify(tempAguaThresholds);
  const dirtyRecirculacion = JSON.stringify(draftRecirc)     !== JSON.stringify(recircThresholds);
  const dirtyContadores    = JSON.stringify(draftContadores) !== JSON.stringify(contadoresThresholds);
  const dirtyLegionella    = JSON.stringify({
                              t: draftThresholds.tempRetornoLegionella,
                              d: draftThresholds.tempDepositoLegionella,
                              b: draftThresholds.biocida,
                              p: draftThresholds.phLegionella,
                            }) !== JSON.stringify({
                              t: thresholds.tempRetornoLegionella,
                              d: thresholds.tempDepositoLegionella,
                              b: thresholds.biocida,
                              p: thresholds.phLegionella,
                            });

  const dirty = tab === 'piscinas' ? dirtyPiscinas
              : tab === 'recirculacion' ? dirtyRecirculacion
              : tab === 'contadores' ? dirtyContadores
              : dirtyLegionella;

  // ─── Guardar pestaña actual ────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      if (tab === 'piscinas') {
        await updateThresholds(draftThresholds);
        await updateTempAguaThresholds(draftTempAgua);
      } else if (tab === 'recirculacion') {
        await updateRecircThresholds(draftRecirc);
      } else if (tab === 'contadores') {
        await updateContadoresThresholds(draftContadores);
      } else if (tab === 'legionella') {
        await updateThresholds(draftThresholds);
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Reset y descartar ─────────────────────────────────────────────────────
  const handleReset = async () => {
    if (!confirm('¿Restablecer los umbrales de esta pestaña a los valores por defecto?')) return;
    setSaving(true);
    try {
      if (tab === 'piscinas') {
        await resetThresholds(['cloroLibre','cloroCombinado','ph','turbidez','tempAmbiente','humedadRelativa','co2Delta']);
        await resetTempAguaThresholds();
      } else if (tab === 'recirculacion') {
        await resetRecircThresholds();
      } else if (tab === 'contadores') {
        await resetContadoresThresholds();
      } else if (tab === 'legionella') {
        await resetThresholds(['tempRetornoLegionella','tempDepositoLegionella','biocida','phLegionella']);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraftThresholds(thresholds);
    setDraftTempAgua(tempAguaThresholds);
    setDraftRecirc(recircThresholds);
    setDraftContadores(contadoresThresholds);
  };

  // ─── Helpers para editar drafts ────────────────────────────────────────────
  const setTh = (key: keyof typeof draftThresholds, side: 'min' | 'max', v: number) => {
    setDraftThresholds(prev => ({ ...prev, [key]: { ...prev[key], [side]: v } }));
  };
  const setTA = (pool: string, side: 'min' | 'max', v: number) => {
    setDraftTempAgua(prev => ({ ...prev, [pool]: { ...prev[pool], [side]: v } }));
  };
  const setRC = (pool: string, key: 'recircMin' | 'renovadaMax' | 'horasMin', v: number) => {
    setDraftRecirc(prev => ({ ...prev, [pool]: { ...prev[pool], [key]: v } }));
  };
  const setCT = (key: keyof typeof draftContadores, side: 'min' | 'max', v: number) => {
    setDraftContadores(prev => ({ ...prev, [key]: { ...prev[key], [side]: v } }));
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f1f3d', margin: '0 0 4px' }}>⚙️ Configuración de umbrales</h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          Modifica los rangos de alerta y visualización utilizados en toda la aplicación. Los cambios se aplican inmediatamente en todas las secciones (entrada de datos, tablas, gráficos y alertas).
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: active ? '700' : '500',
                color: active ? t.color : '#64748b',
                borderBottom: `2px solid ${active ? t.color : 'transparent'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                marginBottom: '-1px',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '15px' }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Actions bar */}
      <ActionsBar
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onReset={handleReset}
        onDiscard={handleDiscard}
      />

      {/* ── PESTAÑA: PISCINAS ─────────────────────────────────────────────── */}
      {tab === 'piscinas' && (
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f1f3d', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 12px' }}>
            Parámetros químicos
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            <ThresholdCard
              title="Cloro libre" icon="🧪" unit={draftThresholds.cloroLibre.unit}
              min={draftThresholds.cloroLibre.min} max={draftThresholds.cloroLibre.max}
              onMin={v => setTh('cloroLibre', 'min', v)} onMax={v => setTh('cloroLibre', 'max', v)}
              hint="Rango RD 742/2013: 0.5 – 2.0 mg/L"
              accent="#0077cc"
            />
            <ThresholdCard
              title="Cloro combinado" icon="⚗️" unit={draftThresholds.cloroCombinado.unit}
              min={draftThresholds.cloroCombinado.min} max={draftThresholds.cloroCombinado.max}
              onMin={v => setTh('cloroCombinado', 'min', v)} onMax={v => setTh('cloroCombinado', 'max', v)}
              hint="Máximo recomendado: 0.6 mg/L"
              accent="#e67e22"
            />
            <ThresholdCard
              title="pH" icon="📏" unit=""
              min={draftThresholds.ph.min} max={draftThresholds.ph.max}
              onMin={v => setTh('ph', 'min', v)} onMax={v => setTh('ph', 'max', v)}
              hint="Rango oficial: 7.2 – 7.8"
              accent="#7c3aed"
            />
            <ThresholdCard
              title="Turbidez" icon="💧" unit={draftThresholds.turbidez.unit}
              min={draftThresholds.turbidez.min} max={draftThresholds.turbidez.max}
              onMin={v => setTh('turbidez', 'min', v)} onMax={v => setTh('turbidez', 'max', v)}
              hint="Máximo: 5.0 NTU"
              accent="#6b7280"
              minOnly={false}
            />
          </div>

          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f1f3d', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 12px' }}>
            Ambiente (vasos cubiertos)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            <ThresholdCard
              title="Temperatura ambiente" icon="🌡️" unit={draftThresholds.tempAmbiente.unit}
              min={draftThresholds.tempAmbiente.min} max={draftThresholds.tempAmbiente.max}
              onMin={v => setTh('tempAmbiente', 'min', v)} onMax={v => setTh('tempAmbiente', 'max', v)}
              hint="Por zona: P. Grande, P. Pequeña y SPA"
              accent="#ef4444"
            />
            <ThresholdCard
              title="Humedad relativa" icon="💨" unit={draftThresholds.humedadRelativa.unit}
              min={draftThresholds.humedadRelativa.min} max={draftThresholds.humedadRelativa.max}
              onMin={v => setTh('humedadRelativa', 'min', v)} onMax={v => setTh('humedadRelativa', 'max', v)}
              hint="Norma UNE: 50 – 70 %"
              accent="#0891b2"
            />
            <ThresholdCard
              title="Δ CO₂ (Int – Ext)" icon="🌫️" unit={draftThresholds.co2Delta.unit}
              min={draftThresholds.co2Delta.min} max={draftThresholds.co2Delta.max}
              onMin={v => setTh('co2Delta', 'min', v)} onMax={v => setTh('co2Delta', 'max', v)}
              hint="Diferencia máxima respecto al CO₂ exterior"
              accent="#94a3b8"
              maxOnly
            />
          </div>

          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f1f3d', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 12px' }}>
            Temperatura del agua por piscina
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px' }}>
            Cada piscina tiene su rango específico según uso (nado libre, recreativa, SPA, etc.).
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {Object.keys(draftTempAgua).map(pool => (
              <ThresholdCard
                key={pool}
                title={pool} icon="🏊" unit="°C"
                min={draftTempAgua[pool].min} max={draftTempAgua[pool].max}
                onMin={v => setTA(pool, 'min', v)} onMax={v => setTA(pool, 'max', v)}
                accent={POOL_COLORS[pool] ?? '#0077cc'}
                disabled={!activePools.includes(pool as PoolName)}
                hint={!activePools.includes(pool as PoolName) ? 'Piscina inactiva (temporada)' : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── PESTAÑA: RECIRCULACIÓN ────────────────────────────────────────── */}
      {tab === 'recirculacion' && (
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f1f3d', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 6px' }}>
            Umbrales diarios por piscina
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px' }}>
            <strong>Recirculación mín.</strong> y <strong>horas filtraje mín.</strong>: valores por debajo se muestran en naranja.{' '}
            <strong>Agua renovada máx.</strong>: valores por encima se muestran en naranja.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {Object.keys(draftRecirc).map(pool => {
              const active = activePools.includes(pool as PoolName);
              const w = draftRecirc[pool];
              return (
                <div key={pool} style={{
                  background: '#fff', border: '1px solid #e2e8f0',
                  borderRadius: '14px', padding: '16px 18px',
                  borderTop: `3px solid ${POOL_COLORS[pool] ?? '#0077cc'}`,
                  opacity: active ? 1 : 0.55,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '18px' }}>🔄</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f1f3d', flex: 1 }}>{pool}</span>
                    {!active && <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>INACTIVA</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        Recirculación mín. (m³/día)
                      </label>
                      <input
                        type="number" className="input-field"
                        value={w.recircMin} disabled={!active}
                        onChange={e => setRC(pool, 'recircMin', parseFloat(e.target.value))}
                        style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: '600' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        Agua renovada máx. (m³/día)
                      </label>
                      <input
                        type="number" className="input-field"
                        value={w.renovadaMax} disabled={!active}
                        onChange={e => setRC(pool, 'renovadaMax', parseFloat(e.target.value))}
                        style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: '600' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        Horas filtraje mín. (h/día)
                      </label>
                      <input
                        type="number" step="0.5" className="input-field"
                        value={w.horasMin} disabled={!active}
                        onChange={e => setRC(pool, 'horasMin', parseFloat(e.target.value))}
                        style={{ width: '100%', fontFamily: 'var(--font-mono)', fontWeight: '600' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PESTAÑA: CONTADORES ──────────────────────────────────────────── */}
      {tab === 'contadores' && (
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f1f3d', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 6px' }}>
            Umbrales de consumo diario
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px' }}>
            Define rangos esperados para detectar lecturas anómalas (picos de consumo o lecturas erróneas).
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <ThresholdCard
              title="Agua general (día)" icon="🚰" unit="m³"
              min={draftContadores.aguaGeneral.min} max={draftContadores.aguaGeneral.max}
              onMin={v => setCT('aguaGeneral', 'min', v)} onMax={v => setCT('aguaGeneral', 'max', v)}
              hint="Consumo diario esperado"
              accent="#0891b2"
            />
            <ThresholdCard
              title="Agua piscinas (día)" icon="🏊" unit="m³"
              min={draftContadores.aguaPiscinas.min} max={draftContadores.aguaPiscinas.max}
              onMin={v => setCT('aguaPiscinas', 'min', v)} onMax={v => setCT('aguaPiscinas', 'max', v)}
              hint="Reposición + duchas"
              accent="#0f6e56"
            />
            <ThresholdCard
              title="Gas (día)" icon="🔥" unit="m³"
              min={draftContadores.gas.min} max={draftContadores.gas.max}
              onMin={v => setCT('gas', 'min', v)} onMax={v => setCT('gas', 'max', v)}
              hint="Consumo diario esperado"
              accent="#b45309"
            />
            <ThresholdCard
              title="kW Tolargi (día)" icon="⚡" unit="kWh"
              min={draftContadores.kwTolargi.min} max={draftContadores.kwTolargi.max}
              onMin={v => setCT('kwTolargi', 'min', v)} onMax={v => setCT('kwTolargi', 'max', v)}
              hint="Consumo eléctrico diario"
              accent="#c2410c"
            />
            <ThresholdCard
              title="Accesos (día)" icon="👥" unit="personas"
              min={draftContadores.accesos.min} max={draftContadores.accesos.max}
              onMin={v => setCT('accesos', 'min', v)} onMax={v => setCT('accesos', 'max', v)}
              hint="Entradas registradas"
              accent="#7c3aed"
            />
          </div>
          <div style={{ marginTop: '20px', padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '12px', color: '#1e40af' }}>
            ℹ️ Los umbrales de contadores quedan registrados y disponibles para futuras alertas de consumos anómalos.
          </div>
        </div>
      )}

      {/* ── PESTAÑA: LEGIONELLA ──────────────────────────────────────────── */}
      {tab === 'legionella' && (
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f1f3d', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 12px' }}>
            Temperaturas ACS (RD 487/2022)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            <ThresholdCard
              title="Temperatura de retorno" icon="🌡️" unit={draftThresholds.tempRetornoLegionella.unit}
              min={draftThresholds.tempRetornoLegionella.min} max={draftThresholds.tempRetornoLegionella.max}
              onMin={v => setTh('tempRetornoLegionella', 'min', v)} onMax={v => setTh('tempRetornoLegionella', 'max', v)}
              hint="Obligatorio ≥ 50°C en todo el circuito"
              accent="#7c3aed"
            />
            <ThresholdCard
              title="Temperatura depósito" icon="🛢️" unit={draftThresholds.tempDepositoLegionella.unit}
              min={draftThresholds.tempDepositoLegionella.min} max={draftThresholds.tempDepositoLegionella.max}
              onMin={v => setTh('tempDepositoLegionella', 'min', v)} onMax={v => setTh('tempDepositoLegionella', 'max', v)}
              hint="Acumulador ACS ≥ 60°C"
              accent="#a855f7"
            />
          </div>

          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f1f3d', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 12px' }}>
            Biocida y pH agua de entrada
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <ThresholdCard
              title="Biocida" icon="💉" unit={draftThresholds.biocida.unit}
              min={draftThresholds.biocida.min} max={draftThresholds.biocida.max}
              onMin={v => setTh('biocida', 'min', v)} onMax={v => setTh('biocida', 'max', v)}
              hint="Concentración residual aceptable"
              accent="#c026d3"
            />
            <ThresholdCard
              title="pH agua de entrada" icon="📏" unit=""
              min={draftThresholds.phLegionella.min} max={draftThresholds.phLegionella.max}
              onMin={v => setTh('phLegionella', 'min', v)} onMax={v => setTh('phLegionella', 'max', v)}
              hint="Rango neutro: 7.0 – 8.0"
              accent="#d946ef"
            />
          </div>
        </div>
      )}

      {/* Aviso final */}
      <div style={{
        marginTop: '32px', padding: '14px 18px',
        background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px',
        fontSize: '12px', color: '#64748b', lineHeight: 1.5,
      }}>
        ⚠️ <strong>Importante:</strong> los umbrales modificados afectan a la generación de nuevas alertas, la coloración de valores (verde/naranja/rojo) en todas las tablas, formularios de entrada, gráficos y resúmenes. Las alertas ya generadas mantienen el umbral con el que se crearon (trazabilidad).
      </div>
    </div>
  );
}

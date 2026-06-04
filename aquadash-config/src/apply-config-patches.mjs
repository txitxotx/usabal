#!/usr/bin/env node
/**
 * apply-config-patches.mjs
 * ──────────────────────────────────────────────────────────────────────────────
 * Aplica todos los cambios necesarios para añadir la página de Configuración
 * de umbrales a AquaDash.
 *
 * USO:
 *   1) Copia este archivo a la RAÍZ del proyecto (junto a package.json)
 *   2) Copia también los dos archivos nuevos:
 *        - src/app/dashboard/configuracion/page.tsx
 *        - src/components/Sidebar.tsx  (sustituye el existente)
 *   3) Ejecuta:  node apply-config-patches.mjs
 *
 * El script es idempotente — puedes ejecutarlo varias veces sin problema.
 * Hace backup .bak de cada archivo antes de modificarlo.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const log = (s) => console.log(s);
const err = (s) => console.error('\x1b[31m✗\x1b[0m ' + s);
const ok  = (s) => console.log('\x1b[32m✓\x1b[0m ' + s);
const warn = (s) => console.log('\x1b[33m⚠\x1b[0m ' + s);

// ── Utilidades ───────────────────────────────────────────────────────────────
function readFile(rel) {
  const path = resolve(ROOT, rel);
  if (!existsSync(path)) throw new Error(`No existe: ${rel}`);
  return readFileSync(path, 'utf8');
}

function writeFile(rel, content) {
  const path = resolve(ROOT, rel);
  if (existsSync(path) && !existsSync(path + '.bak')) {
    copyFileSync(path, path + '.bak');
  }
  writeFileSync(path, content, 'utf8');
}

function patch(rel, fn) {
  log(`\n→ ${rel}`);
  try {
    const original = readFile(rel);
    const modified = fn(original);
    if (original === modified) {
      warn(`  (sin cambios — ya está actualizado)`);
      return;
    }
    writeFile(rel, modified);
    ok(`  modificado (backup en ${rel}.bak)`);
  } catch (e) {
    err(`  ${e.message}`);
  }
}

function ensureReplace(content, needle, replacement, signature) {
  // Idempotencia: si la firma distintiva (un fragmento único del replacement
  // que NO existía antes del patch) ya está en el archivo, asumimos aplicado.
  if (signature && content.includes(signature)) {
    return content;
  }
  if (!content.includes(needle)) {
    return content; // ni siquiera está el patrón original
  }
  return content.replace(needle, replacement);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1) src/lib/store.tsx
// ─────────────────────────────────────────────────────────────────────────────
patch('src/lib/store.tsx', (s) => {
  // 1.1 — Reemplazar el bloque THRESHOLDS por DEFAULT_THRESHOLDS + nuevos defaults
  const oldBlock = `// ─── Thresholds globales ──────────────────────────────────────────────────────
export const THRESHOLDS = {
  cloroLibre:             { min: 0.5,  max: 2.0,  unit: 'mg/L' },
  cloroCombinado:         { min: 0,    max: 0.6,  unit: 'mg/L' },
  ph:                     { min: 7.2,  max: 7.8,  unit: '' },
  turbidez:               { min: 0,    max: 5.0,  unit: 'NTU' },
  tempAgua:               { min: 24,   max: 30,   unit: '°C' },
  tempAmbiente:           { min: 26,   max: 33,   unit: '°C' },
  humedadRelativa:        { min: 50,   max: 70,   unit: '%' },
  co2Delta:               { min: 0,    max: 500,  unit: 'ppm' },
  tempRetornoLegionella:  { min: 50,   max: 65,   unit: '°C' },
  tempDepositoLegionella: { min: 60,   max: 70,   unit: '°C' },
  biocida:                { min: 0.2,  max: 2.0,  unit: 'mg/L' },
  phLegionella:           { min: 7.0,  max: 8.0,  unit: '' },
};

export const TEMP_AGUA_THRESHOLDS: Record<string, { min: number; max: number }> = {
  'P. Grande':       { min: 26,  max: 29   },
  'P. Peq.-Med.':   { min: 28,  max: 32.5 },
  'SPA':             { min: 30,  max: 33   },
  'Pileta':          { min: 5,   max: 16   },
  'P. Ext. Grande':  { min: 0,   max: 40   },
  'P. Ext. Pequena': { min: 0,   max: 40   },
  'Splash':          { min: 0,   max: 40   },
};`;

  const newBlock = `// ─── Thresholds por defecto (valores oficiales RD 742/2013) ───────────────────
// Se conservan como export para uso estático (PDFs, fallback). Los valores que
// se usan en runtime vienen del estado del context (configurable por admin).
export const DEFAULT_THRESHOLDS = {
  cloroLibre:             { min: 0.5,  max: 2.0,  unit: 'mg/L' },
  cloroCombinado:         { min: 0,    max: 0.6,  unit: 'mg/L' },
  ph:                     { min: 7.2,  max: 7.8,  unit: '' },
  turbidez:               { min: 0,    max: 5.0,  unit: 'NTU' },
  tempAgua:               { min: 24,   max: 30,   unit: '°C' },
  tempAmbiente:           { min: 26,   max: 33,   unit: '°C' },
  humedadRelativa:        { min: 50,   max: 70,   unit: '%' },
  co2Delta:               { min: 0,    max: 500,  unit: 'ppm' },
  tempRetornoLegionella:  { min: 50,   max: 65,   unit: '°C' },
  tempDepositoLegionella: { min: 60,   max: 70,   unit: '°C' },
  biocida:                { min: 0.2,  max: 2.0,  unit: 'mg/L' },
  phLegionella:           { min: 7.0,  max: 8.0,  unit: '' },
};
export const THRESHOLDS = DEFAULT_THRESHOLDS; // alias retro-compatible

export const DEFAULT_TEMP_AGUA_THRESHOLDS: Record<string, { min: number; max: number }> = {
  'P. Grande':       { min: 26,  max: 29   },
  'P. Peq.-Med.':   { min: 28,  max: 32.5 },
  'SPA':             { min: 30,  max: 33   },
  'Pileta':          { min: 5,   max: 16   },
  'P. Ext. Grande':  { min: 0,   max: 40   },
  'P. Ext. Pequena': { min: 0,   max: 40   },
  'Splash':          { min: 0,   max: 40   },
};
export const TEMP_AGUA_THRESHOLDS = DEFAULT_TEMP_AGUA_THRESHOLDS;

export const DEFAULT_RECIRC_THRESHOLDS: Record<string, { recircMin: number; renovadaMax: number; horasMin: number }> = {
  'P. Grande':       { recircMin: 4700, renovadaMax: 75,  horasMin: 15 },
  'P. Peq.-Med.':    { recircMin: 950,  renovadaMax: 40,  horasMin: 15 },
  'SPA':             { recircMin: 1900, renovadaMax: 45,  horasMin: 15 },
  'Pileta':          { recircMin: 50,   renovadaMax: 15,  horasMin: 10 },
  'P. Ext. Grande':  { recircMin: 4700, renovadaMax: 75,  horasMin: 15 },
  'P. Ext. Pequeña': { recircMin: 950,  renovadaMax: 40,  horasMin: 15 },
  'Splash':          { recircMin: 50,   renovadaMax: 15,  horasMin: 10 },
};

export const DEFAULT_CONTADORES_THRESHOLDS = {
  aguaGeneral:  { min: 0, max: 200,  unit: 'm³' },
  aguaPiscinas: { min: 0, max: 100,  unit: 'm³' },
  gas:          { min: 0, max: 500,  unit: 'm³' },
  kwTolargi:    { min: 0, max: 2000, unit: 'kWh' },
  accesos:      { min: 0, max: 1500, unit: 'personas' },
};

export type ThresholdsConfig           = typeof DEFAULT_THRESHOLDS;
export type TempAguaThresholdsConfig   = typeof DEFAULT_TEMP_AGUA_THRESHOLDS;
export type RecircThresholdsConfig     = typeof DEFAULT_RECIRC_THRESHOLDS;
export type ContadoresThresholdsConfig = typeof DEFAULT_CONTADORES_THRESHOLDS;`;

  s = ensureReplace(s, oldBlock, newBlock, 'export const DEFAULT_THRESHOLDS = {');

  // 1.2 — Ampliar interface AppState con los nuevos campos
  s = ensureReplace(s,
    `  activePools: PoolName[];
  login: (email: string, password: string) => Promise<boolean>;`,
    `  activePools: PoolName[];
  // Configuración de umbrales (dinámicos, persistidos en app_config)
  thresholds: ThresholdsConfig;
  tempAguaThresholds: TempAguaThresholdsConfig;
  recircThresholds: RecircThresholdsConfig;
  contadoresThresholds: ContadoresThresholdsConfig;
  updateThresholds: (next: ThresholdsConfig) => Promise<void>;
  updateTempAguaThresholds: (next: TempAguaThresholdsConfig) => Promise<void>;
  updateRecircThresholds: (next: RecircThresholdsConfig) => Promise<void>;
  updateContadoresThresholds: (next: ContadoresThresholdsConfig) => Promise<void>;
  resetThresholds: (keys?: (keyof ThresholdsConfig)[]) => Promise<void>;
  resetTempAguaThresholds: () => Promise<void>;
  resetRecircThresholds: () => Promise<void>;
  resetContadoresThresholds: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;`,
    'updateThresholds: (next: ThresholdsConfig)');

  // 1.3 — Añadir useState para los nuevos estados
  s = ensureReplace(s,
    `  const [activePools, setActivePools] = useState<PoolName[]>([...BASE_POOLS]);`,
    `  const [activePools, setActivePools] = useState<PoolName[]>([...BASE_POOLS]);
  const [thresholds, setThresholds]                       = useState<ThresholdsConfig>(DEFAULT_THRESHOLDS);
  const [tempAguaThresholds, setTempAguaThresholds]       = useState<TempAguaThresholdsConfig>(DEFAULT_TEMP_AGUA_THRESHOLDS);
  const [recircThresholds, setRecircThresholds]           = useState<RecircThresholdsConfig>(DEFAULT_RECIRC_THRESHOLDS);
  const [contadoresThresholds, setContadoresThresholds]   = useState<ContadoresThresholdsConfig>(DEFAULT_CONTADORES_THRESHOLDS);`,
    'setThresholds]                       = useState');

  // 1.4 — Ampliar el bloque de carga desde app_config
  s = ensureReplace(s,
    `        if (configData) {
          const poolsConfig = configData.find((c: any) => c.key === 'active_pools');
          if (poolsConfig) setActivePools(poolsConfig.value as PoolName[]);
        }`,
    `        if (configData) {
          const poolsConfig = configData.find((c: any) => c.key === 'active_pools');
          if (poolsConfig) setActivePools(poolsConfig.value as PoolName[]);

          const th = configData.find((c: any) => c.key === 'thresholds');
          if (th?.value) setThresholds({ ...DEFAULT_THRESHOLDS, ...(th.value as Partial<ThresholdsConfig>) });

          const ta = configData.find((c: any) => c.key === 'temp_agua_thresholds');
          if (ta?.value) setTempAguaThresholds({ ...DEFAULT_TEMP_AGUA_THRESHOLDS, ...(ta.value as object) });

          const rc = configData.find((c: any) => c.key === 'recirc_thresholds');
          if (rc?.value) setRecircThresholds({ ...DEFAULT_RECIRC_THRESHOLDS, ...(rc.value as object) });

          const ct = configData.find((c: any) => c.key === 'contadores_thresholds');
          if (ct?.value) setContadoresThresholds({ ...DEFAULT_CONTADORES_THRESHOLDS, ...(ct.value as object) });
        }`,
    'setThresholds({ ...DEFAULT_THRESHOLDS');

  // 1.5 — Añadir funciones de update y reset justo antes del return del provider
  const updateFunctionsBlock = `  // ─── Configuración de umbrales ─────────────────────────────────────────────
  const persistConfig = async (key: string, value: any) => {
    await supabase.from('app_config').upsert({ key, value, updated_at: new Date().toISOString() });
  };

  const updateThresholds = async (next: ThresholdsConfig) => {
    setThresholds(next);
    await persistConfig('thresholds', next);
  };
  const updateTempAguaThresholds = async (next: TempAguaThresholdsConfig) => {
    setTempAguaThresholds(next);
    await persistConfig('temp_agua_thresholds', next);
  };
  const updateRecircThresholds = async (next: RecircThresholdsConfig) => {
    setRecircThresholds(next);
    await persistConfig('recirc_thresholds', next);
  };
  const updateContadoresThresholds = async (next: ContadoresThresholdsConfig) => {
    setContadoresThresholds(next);
    await persistConfig('contadores_thresholds', next);
  };

  const resetThresholds = async (keys?: (keyof ThresholdsConfig)[]) => {
    const next = keys && keys.length
      ? { ...thresholds, ...Object.fromEntries(keys.map(k => [k, DEFAULT_THRESHOLDS[k]])) }
      : { ...DEFAULT_THRESHOLDS };
    await updateThresholds(next as ThresholdsConfig);
  };
  const resetTempAguaThresholds   = () => updateTempAguaThresholds({ ...DEFAULT_TEMP_AGUA_THRESHOLDS });
  const resetRecircThresholds     = () => updateRecircThresholds({ ...DEFAULT_RECIRC_THRESHOLDS });
  const resetContadoresThresholds = () => updateContadoresThresholds({ ...DEFAULT_CONTADORES_THRESHOLDS });

  return (
    <AppContext.Provider value={{
      loading, currentUser, users, contadores, parametros, recirculacion,
      legionellaTemps, legionellaBiocida, incendios, alerts, alertHistory, alertRepairs, activePools,
      thresholds, tempAguaThresholds, recircThresholds, contadoresThresholds,
      updateThresholds, updateTempAguaThresholds, updateRecircThresholds, updateContadoresThresholds,
      resetThresholds, resetTempAguaThresholds, resetRecircThresholds, resetContadoresThresholds,
      login, logout, hasPermission, updateUser, addUser, deleteUser,
      addContador, addPoolParam, addRecirculacion, addLegionellaTemp, addLegionellaBiocida, addIncendio,
      resolveAlert, resolveAlertWithRepair, updateParamValue, updateParamSession,
      toggleSeasonalPool, generateAlertsFromData,
      deleteContador, deleteRecirculacion, deleteParametro,
    }}>`;

  s = ensureReplace(s,
    `  return (
    <AppContext.Provider value={{
      loading, currentUser, users, contadores, parametros, recirculacion,
      legionellaTemps, legionellaBiocida, incendios, alerts, alertHistory, alertRepairs, activePools,
      login, logout, hasPermission, updateUser, addUser, deleteUser,
      addContador, addPoolParam, addRecirculacion, addLegionellaTemp, addLegionellaBiocida, addIncendio,
      resolveAlert, resolveAlertWithRepair, updateParamValue, updateParamSession,
      toggleSeasonalPool, generateAlertsFromData,
      deleteContador, deleteRecirculacion, deleteParametro,
    }}>`,
    updateFunctionsBlock,
    'const persistConfig = async (key: string, value: any)');

  // 1.6 — Dentro de generateAlertsFromNewParam, sustituir THRESHOLDS por thresholds dinámico
  //         y TEMP_AGUA_THRESHOLDS por tempAguaThresholds.
  //         Para ser conservadores, sólo sustituimos dentro de la función, no en otros sitios.
  const fnStart = s.indexOf('async function generateAlertsFromNewParam');
  if (fnStart < 0) throw new Error('No se encontró generateAlertsFromNewParam');

  // Encontrar el final de la función (busca el cierre matching). Usamos un truco simple:
  // la función termina cuando encontramos "\n  }\n" seguido (que no esté dentro de un string).
  // En este caso buscamos el patrón final conocido tras el último if del bloque.
  const fnEnd = s.indexOf('\n  }\n\n  const generateAlertsFromData', fnStart);
  if (fnEnd < 0) throw new Error('No se encontró el final de generateAlertsFromNewParam');

  let fnBody = s.slice(fnStart, fnEnd);
  const originalFnBody = fnBody;

  fnBody = fnBody.replace(/THRESHOLDS\./g, 'thresholds.');
  fnBody = fnBody.replace(/TEMP_AGUA_THRESHOLDS\[pool\]/g, 'tempAguaThresholds[pool]');

  if (fnBody !== originalFnBody) {
    s = s.slice(0, fnStart) + fnBody + s.slice(fnEnd);
  }

  return s;
});

// ─────────────────────────────────────────────────────────────────────────────
// 2) src/app/dashboard/piscinas/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
patch('src/app/dashboard/piscinas/page.tsx', (s) => {
  // 2.1 — Cambiar import: quitar THRESHOLDS y TEMP_AGUA_THRESHOLDS
  s = ensureReplace(s,
    `import { useApp, THRESHOLDS, TEMP_AGUA_THRESHOLDS } from '@/lib/store';`,
    `import { useApp } from '@/lib/store';`,
    'import { useApp } from \'@/lib/store\';');

  // 2.2 — Eliminar la función getTempRange top-level (la moveremos dentro del componente)
  s = ensureReplace(s,
    `function getTempRange(pool: string) {
  return TEMP_AGUA_THRESHOLDS[pool] ?? { min: 0, max: 40 };
}

function valueClass`,
    `function valueClass`,
    null);

  // 2.3 — Eliminar la función valueClassPool top-level (la moveremos dentro del componente)
  s = ensureReplace(s,
    `function valueClassPool(v: number | null | undefined, key: string, pool: string) {
  if (v === null || v === undefined) return '';
  if (key === 'temperatura') { const { min, max } = getTempRange(pool); return valueClass(v, min, max); }
  if (key === 'cloroLibre')     return valueClass(v, THRESHOLDS.cloroLibre.min, THRESHOLDS.cloroLibre.max);
  if (key === 'cloroCombinado') return valueClass(v, 0, THRESHOLDS.cloroCombinado.max);
  if (key === 'ph')             return valueClass(v, THRESHOLDS.ph.min, THRESHOLDS.ph.max);
  if (key === 'turbidez')       return valueClass(v, 0, THRESHOLDS.turbidez.max);
  return '';
}

function getAmbZone`,
    `function getAmbZone`,
    null);

  // 2.4 — exportPDF mantiene referencia a getTempRange. Como ahora vive dentro del componente,
  //         debemos pasar tempAguaThresholds como argumento.
  //         Reemplazamos la firma y las llamadas a getTempRange en exportPDF.
  s = ensureReplace(s,
    `function exportPDF(parametros: any[], pool: PoolName | 'todas', activePools: PoolName[]) {
  const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const poolsToShow = pool === 'todas' ? activePools : [pool];
  const period = parametros.length > 0 ? \`\${parametros[0].date} — \${parametros[parametros.length - 1].date}\` : '—';
  const zone = pool === 'todas' ? null : getAmbZone(pool);
  const zoneLabel = zone === 'pequena' ? 'P. Pequeña' : zone === 'spa' ? 'SPA' : 'P. Grande';`,
    `function exportPDF(parametros: any[], pool: PoolName | 'todas', activePools: PoolName[], tempAguaThresholds: Record<string, { min: number; max: number }>) {
  const getTempRange = (p: string) => tempAguaThresholds[p] ?? { min: 0, max: 40 };
  const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const poolsToShow = pool === 'todas' ? activePools : [pool];
  const period = parametros.length > 0 ? \`\${parametros[0].date} — \${parametros[parametros.length - 1].date}\` : '—';
  const zone = pool === 'todas' ? null : getAmbZone(pool);
  const zoneLabel = zone === 'pequena' ? 'P. Pequeña' : zone === 'spa' ? 'SPA' : 'P. Grande';`,
    'tempAguaThresholds: Record<string, { min: number; max: number }>) {');

  // 2.5 — La llamada a exportPDF debe pasar tempAguaThresholds
  s = ensureReplace(s,
    `exportPDF(filteredParametros, pdfPool, visiblePools)`,
    `exportPDF(filteredParametros, pdfPool, visiblePools, tempAguaThresholds)`,
    'exportPDF(filteredParametros, pdfPool, visiblePools, tempAguaThresholds)');

  // 2.6 — Añadir thresholds y tempAguaThresholds al useApp destructuring + helpers locales
  s = ensureReplace(s,
    `  const { hasPermission, parametros, alerts, activePools, toggleSeasonalPool, addPoolParam, currentUser, updateParamValue, updateParamSession, deleteParametro } = useApp();`,
    `  const { hasPermission, parametros, alerts, activePools, toggleSeasonalPool, addPoolParam, currentUser, updateParamValue, updateParamSession, deleteParametro, thresholds, tempAguaThresholds } = useApp();

  // Helpers dependientes de los umbrales dinámicos (definidos aquí para reaccionar a cambios)
  const getTempRange = (pool: string) => tempAguaThresholds[pool] ?? { min: 0, max: 40 };
  const valueClassPool = (v: number | null | undefined, key: string, pool: string) => {
    if (v === null || v === undefined) return '';
    if (key === 'temperatura') { const { min, max } = getTempRange(pool); return valueClass(v, min, max); }
    if (key === 'cloroLibre')     return valueClass(v, thresholds.cloroLibre.min, thresholds.cloroLibre.max);
    if (key === 'cloroCombinado') return valueClass(v, 0, thresholds.cloroCombinado.max);
    if (key === 'ph')             return valueClass(v, thresholds.ph.min, thresholds.ph.max);
    if (key === 'turbidez')       return valueClass(v, 0, thresholds.turbidez.max);
    return '';
  };`,
    'deleteParametro, thresholds, tempAguaThresholds }');

  // 2.7 — En getParamRange sustituir THRESHOLDS por thresholds
  s = s.replace(
    /if \(selectedParam === 'cloroLibre'\) return \{ min: THRESHOLDS\.cloroLibre\.min, max: THRESHOLDS\.cloroLibre\.max \};/,
    `if (selectedParam === 'cloroLibre') return { min: thresholds.cloroLibre.min, max: thresholds.cloroLibre.max };`
  );
  s = s.replace(
    /if \(selectedParam === 'cloroCombinado'\) return \{ min: 0, max: THRESHOLDS\.cloroCombinado\.max \};/,
    `if (selectedParam === 'cloroCombinado') return { min: 0, max: thresholds.cloroCombinado.max };`
  );
  s = s.replace(
    /if \(selectedParam === 'ph'\) return \{ min: THRESHOLDS\.ph\.min, max: THRESHOLDS\.ph\.max \};/,
    `if (selectedParam === 'ph') return { min: thresholds.ph.min, max: thresholds.ph.max };`
  );
  s = s.replace(
    /if \(selectedParam === 'turbidez'\) return \{ min: 0, max: THRESHOLDS\.turbidez\.max \};/,
    `if (selectedParam === 'turbidez') return { min: 0, max: thresholds.turbidez.max };`
  );

  // 2.8 — Sustituir literales en valueClass para ambiente y humedad (en el bloque de tarjetas de resumen)
  s = s.replace(/valueClass\(cl,\s*0\.5,\s*2\.0\)/g, 'valueClass(cl, thresholds.cloroLibre.min, thresholds.cloroLibre.max)');
  s = s.replace(/valueClass\(cc,\s*0,\s*0\.6\)/g,   'valueClass(cc, 0, thresholds.cloroCombinado.max)');
  s = s.replace(/valueClass\(ph,\s*7\.2,\s*7\.8\)/g,'valueClass(ph, thresholds.ph.min, thresholds.ph.max)');
  s = s.replace(/valueClass\(turb,\s*0,\s*5\.0\)/g, 'valueClass(turb, 0, thresholds.turbidez.max)');

  // 2.9 — En el bloque "issues.push" del resumen, sustituir literales por umbrales dinámicos
  s = s.replace(
    /if \(cl\s+!= null && \(cl < 0\.5 \|\| cl > 2\.0\)\)\s+issues\.push\('Cloro libre'\);/,
    `if (cl   != null && (cl < thresholds.cloroLibre.min || cl > thresholds.cloroLibre.max)) issues.push('Cloro libre');`
  );
  s = s.replace(
    /if \(cc\s+!= null && cc > 0\.6\)\s+issues\.push\('Cloro comb\.'\);/,
    `if (cc   != null && cc > thresholds.cloroCombinado.max) issues.push('Cloro comb.');`
  );
  s = s.replace(
    /if \(ph\s+!= null && \(ph < 7\.2 \|\| ph > 7\.8\)\)\s+issues\.push\('pH'\);/,
    `if (ph   != null && (ph < thresholds.ph.min || ph > thresholds.ph.max)) issues.push('pH');`
  );
  s = s.replace(
    /if \(turb\s+!= null && turb > 5\.0\)\s+issues\.push\('Turbidez'\);/,
    `if (turb != null && turb > thresholds.turbidez.max) issues.push('Turbidez');`
  );

  // 2.10 — En el array de tarjetas del resumen con { min: 0.5, max: 2.0 } etc., dinamizar
  s = s.replace(
    /\{ label: 'Cloro libre', val: cl,\s+min: 0\.5, max: 2\.0, unit: 'mg\/L' \}/,
    `{ label: 'Cloro libre', val: cl,   min: thresholds.cloroLibre.min, max: thresholds.cloroLibre.max, unit: 'mg/L' }`
  );
  s = s.replace(
    /\{ label: 'Cloro comb\.', val: cc,\s+min: 0,\s+max: 0\.6, unit: 'mg\/L' \}/,
    `{ label: 'Cloro comb.', val: cc,   min: 0,   max: thresholds.cloroCombinado.max, unit: 'mg/L' }`
  );
  s = s.replace(
    /\{ label: 'pH',\s+val: ph,\s+min: 7\.2, max: 7\.8, unit: '' \}/,
    `{ label: 'pH',          val: ph,   min: thresholds.ph.min, max: thresholds.ph.max, unit: '' }`
  );
  s = s.replace(
    /\{ label: 'Turbidez',\s+val: turb, min: 0,\s+max: 5\.0, unit: 'NTU' \}/,
    `{ label: 'Turbidez',    val: turb, min: 0,   max: thresholds.turbidez.max, unit: 'NTU' }`
  );

  return s;
});

// ─────────────────────────────────────────────────────────────────────────────
// 3) src/app/dashboard/recirculacion/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
patch('src/app/dashboard/recirculacion/page.tsx', (s) => {
  // 3.1 — Eliminar la constante DELTA_WARN
  s = ensureReplace(s,
    `const DELTA_WARN: Record<string, { recircMin: number; renovadaMax: number; horasMin: number }> = {
  'P. Grande':       { recircMin: 4700, renovadaMax: 75,  horasMin: 15 },
  'P. Peq.-Med.':   { recircMin: 950,  renovadaMax: 40,  horasMin: 15 },
  'SPA':             { recircMin: 1900, renovadaMax: 45,  horasMin: 15 },
  'Pileta':          { recircMin: 50,   renovadaMax: 15,  horasMin: 10 },
  'P. Ext. Grande':  { recircMin: 4700, renovadaMax: 75,  horasMin: 15 },
  'P. Ext. Pequeña': { recircMin: 950,  renovadaMax: 40,  horasMin: 15 },
  'Splash':          { recircMin: 50,   renovadaMax: 15,  horasMin: 10 },
};

function deltaClass`,
    `function deltaClass`,
    null);

  // 3.2 — Añadir recircThresholds al destructuring de useApp
  s = ensureReplace(s,
    `  const { hasPermission, recirculacion, activePools, addRecirculacion, deleteRecirculacion, currentUser } = useApp();`,
    `  const { hasPermission, recirculacion, activePools, addRecirculacion, deleteRecirculacion, currentUser, recircThresholds } = useApp();`,
    'currentUser, recircThresholds }');

  // 3.3 — Sustituir DELTA_WARN[selectedPool] por recircThresholds[selectedPool]
  s = s.replace(
    /const warn = DELTA_WARN\[selectedPool\] \?\? \{ recircMin: 0, renovadaMax: 9999, horasMin: 0 \};/g,
    `const warn = recircThresholds[selectedPool] ?? { recircMin: 0, renovadaMax: 9999, horasMin: 0 };`
  );

  // 3.4 — Sustituir DELTA_WARN[pool] por recircThresholds[pool] en el bucle de tarjetas
  s = s.replace(
    /const pw = DELTA_WARN\[pool\] \?\? \{ recircMin: 0, renovadaMax: 9999, horasMin: 0 \};/g,
    `const pw = recircThresholds[pool] ?? { recircMin: 0, renovadaMax: 9999, horasMin: 0 };`
  );

  return s;
});

// ─────────────────────────────────────────────────────────────────────────────
// 4) src/lib/i18n.ts — añadir nav_configuracion
// ─────────────────────────────────────────────────────────────────────────────
patch('src/lib/i18n.ts', (s) => {
  // 4.1 — Español
  s = ensureReplace(s,
    `    nav_usuarios: 'Usuarios',`,
    `    nav_usuarios: 'Usuarios',
    nav_configuracion: 'Configuración',`,
    "nav_configuracion: 'Configuración'");

  // 4.2 — Euskera
  s = ensureReplace(s,
    `    nav_usuarios: 'Erabiltzaileak',`,
    `    nav_usuarios: 'Erabiltzaileak',
    nav_configuracion: 'Konfigurazioa',`,
    "nav_configuracion: 'Konfigurazioa'");

  return s;
});

// ─────────────────────────────────────────────────────────────────────────────
// FIN
// ─────────────────────────────────────────────────────────────────────────────
log('\n────────────────────────────────────────────────────────────');
ok('Todos los parches aplicados correctamente.');
log('\nSiguientes pasos:');
log('  1) Verifica que estos dos archivos están en su sitio:');
log('       src/app/dashboard/configuracion/page.tsx');
log('       src/components/Sidebar.tsx');
log('  2) Ejecuta la migración SQL en Supabase (ver SQL_MIGRATION.sql)');
log('  3) npm run dev  → debería compilar sin errores');
log('  4) Login como admin → verás "⚙️ Configuración" en el menú');
log('\nSi algo va mal, restaura los archivos .bak generados.\n');

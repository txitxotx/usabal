#!/usr/bin/env node
/**
 * apply-socorrista-patches.mjs
 * ──────────────────────────────────────────────────────────────────────────────
 * Aplica los cambios necesarios para añadir la sección "Socorrista".
 *
 * USO:
 *   1) Copia este archivo a la RAÍZ del proyecto (junto a package.json)
 *   2) Copia también el archivo nuevo:
 *        src/app/dashboard/socorrista/page.tsx
 *   3) Ejecuta:  node apply-socorrista-patches.mjs
 *
 * Idempotente — puedes ejecutarlo varias veces.
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
  if (signature && content.includes(signature)) return content;
  if (!content.includes(needle)) return content;
  return content.replace(needle, replacement);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1) src/types/index.ts
// ─────────────────────────────────────────────────────────────────────────────
patch('src/types/index.ts', (s) => {
  // 1.1 — Ampliar Permission con view_socorrista / edit_socorrista
  s = ensureReplace(s,
    `  | 'view_alerts' | 'manage_users' | 'export_data';`,
    `  | 'view_alerts' | 'manage_users' | 'export_data'
  | 'view_socorrista' | 'edit_socorrista';`,
    `'view_socorrista' | 'edit_socorrista'`);

  // 1.2 — Añadir interfaces y constantes Socorrista al final del archivo
  if (!s.includes('IntervencionSocorrista')) {
    s = s.trimEnd() + `

// ─── Socorrista ───────────────────────────────────────────────────────────────
export interface IntervencionSocorrista {
  id: string;
  fechaHora: string;          // ISO datetime
  edadPaciente: number | null;
  motivo: string;
  actuacion: string;
  materiales: string;
  notaFinal: string;
  socorristaId: string;
  socorristaName: string;
  createdAt: string;
}

export interface AforoEntry {
  id: string;
  date: string;               // YYYY-MM-DD
  hour: number;               // 7..22
  pool: string;               // PoolName | nombre de sauna
  cantidad: number;
  socorristaId: string;
  socorristaName: string;
  updatedAt: string;
}

export const AFORO_SAUNAS = ['Sauna Seca 1', 'Sauna Seca 2', 'Sauna Húmeda', 'Terma'] as const;
export const AFORO_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22] as const;
`;
  }
  return s;
});

// ─────────────────────────────────────────────────────────────────────────────
// 2) src/lib/store.tsx — añadir estado, loaders y funciones CRUD
// ─────────────────────────────────────────────────────────────────────────────
patch('src/lib/store.tsx', (s) => {
  // 2.1 — Ampliar imports de tipos (añadir IntervencionSocorrista, AforoEntry)
  s = ensureReplace(s,
    `import type { User, Permission, Alert, AlertRepair, ContadorEntry, LegionellaTemp, LegionellaBiocida, IncendioCheck, PoolParamRecord, PoolName, RecirculacionEntry } from '@/types';`,
    `import type { User, Permission, Alert, AlertRepair, ContadorEntry, LegionellaTemp, LegionellaBiocida, IncendioCheck, PoolParamRecord, PoolName, RecirculacionEntry, IntervencionSocorrista, AforoEntry } from '@/types';`,
    `IntervencionSocorrista, AforoEntry } from '@/types'`);

  // 2.2 — Añadir campos al interface AppState
  s = ensureReplace(s,
    `  activePools: PoolName[];`,
    `  activePools: PoolName[];
  intervenciones: IntervencionSocorrista[];
  aforo: AforoEntry[];
  addIntervencion: (data: Omit<IntervencionSocorrista, 'id' | 'createdAt'>) => Promise<void>;
  deleteIntervencion: (id: string) => Promise<void>;
  upsertAforo: (data: Omit<AforoEntry, 'id' | 'updatedAt'>) => Promise<void>;
  deleteAforoDay: (date: string) => Promise<void>;`,
    `intervenciones: IntervencionSocorrista[];`);

  // 2.3 — Añadir useState para los nuevos estados
  s = ensureReplace(s,
    `  const [activePools, setActivePools] = useState<PoolName[]>([...BASE_POOLS]);`,
    `  const [activePools, setActivePools] = useState<PoolName[]>([...BASE_POOLS]);
  const [intervenciones, setIntervenciones] = useState<IntervencionSocorrista[]>([]);
  const [aforo, setAforo]                   = useState<AforoEntry[]>([]);`,
    `setIntervenciones]`);

  // 2.4 — Añadir carga inicial en loadAll
  //         Buscamos un sitio seguro: después del bloque de configData
  s = ensureReplace(s,
    `          const ct = configData.find((c: any) => c.key === 'contadores_thresholds');
          if (ct?.value) setContadoresThresholds({ ...DEFAULT_CONTADORES_THRESHOLDS, ...(ct.value as object) });
        }`,
    `          const ct = configData.find((c: any) => c.key === 'contadores_thresholds');
          if (ct?.value) setContadoresThresholds({ ...DEFAULT_CONTADORES_THRESHOLDS, ...(ct.value as object) });
        }

        // Socorrista: intervenciones
        const { data: intervData } = await supabase
          .from('socorrista_intervenciones')
          .select('*')
          .order('fecha_hora', { ascending: false });
        if (intervData) {
          setIntervenciones(intervData.map((r: any) => ({
            id:             r.id,
            fechaHora:      r.fecha_hora,
            edadPaciente:   r.edad_paciente,
            motivo:         r.motivo ?? '',
            actuacion:      r.actuacion ?? '',
            materiales:     r.materiales ?? '',
            notaFinal:      r.nota_final ?? '',
            socorristaId:   r.socorrista_id ?? '',
            socorristaName: r.socorrista_name ?? '',
            createdAt:      r.created_at,
          })));
        }

        // Socorrista: aforo
        const { data: aforoData } = await supabase
          .from('socorrista_aforo')
          .select('*')
          .order('date', { ascending: false });
        if (aforoData) {
          setAforo(aforoData.map((r: any) => ({
            id:             r.id,
            date:           r.date,
            hour:           r.hour,
            pool:           r.pool,
            cantidad:       r.cantidad,
            socorristaId:   r.socorrista_id ?? '',
            socorristaName: r.socorrista_name ?? '',
            updatedAt:      r.updated_at,
          })));
        }`,
    `socorrista_intervenciones`);

  // 2.5 — Añadir funciones CRUD justo antes del return del provider
  s = ensureReplace(s,
    `  return (
    <AppContext.Provider value={{
      loading, currentUser, users, contadores, parametros, recirculacion,
      legionellaTemps, legionellaBiocida, incendios, alerts, alertHistory, alertRepairs, activePools,
      thresholds, tempAguaThresholds, recircThresholds, contadoresThresholds,
      updateThresholds, updateTempAguaThresholds, updateRecircThresholds, updateContadoresThresholds,
      resetThresholds, resetTempAguaThresholds, resetRecircThresholds, resetContadoresThresholds,`,
    `  // ─── Socorrista CRUD ───────────────────────────────────────────────────────
  const addIntervencion = async (data: Omit<IntervencionSocorrista, 'id' | 'createdAt'>) => {
    const id = \`int_\${Date.now()}_\${Math.random().toString(36).slice(2, 8)}\`;
    const row = {
      id,
      fecha_hora:      data.fechaHora,
      edad_paciente:   data.edadPaciente,
      motivo:          data.motivo,
      actuacion:       data.actuacion,
      materiales:      data.materiales,
      nota_final:      data.notaFinal,
      socorrista_id:   data.socorristaId,
      socorrista_name: data.socorristaName,
    };
    const { error } = await supabase.from('socorrista_intervenciones').insert(row);
    if (error) { console.error(error); alert('Error guardando intervención: ' + error.message); return; }
    setIntervenciones(prev => [{
      ...data,
      id,
      createdAt: new Date().toISOString(),
    }, ...prev]);
  };

  const deleteIntervencion = async (id: string) => {
    const { error } = await supabase.from('socorrista_intervenciones').delete().eq('id', id);
    if (error) { console.error(error); alert('Error eliminando: ' + error.message); return; }
    setIntervenciones(prev => prev.filter(i => i.id !== id));
  };

  const upsertAforo = async (data: Omit<AforoEntry, 'id' | 'updatedAt'>) => {
    // ¿existe ya un registro para (date, hour, pool)?
    const existing = aforo.find(a => a.date === data.date && a.hour === data.hour && a.pool === data.pool);
    const id = existing?.id ?? \`aforo_\${Date.now()}_\${Math.random().toString(36).slice(2, 8)}\`;
    const now = new Date().toISOString();
    const row = {
      id,
      date:            data.date,
      hour:            data.hour,
      pool:            data.pool,
      cantidad:        data.cantidad,
      socorrista_id:   data.socorristaId,
      socorrista_name: data.socorristaName,
      updated_at:      now,
    };
    const { error } = await supabase
      .from('socorrista_aforo')
      .upsert(row, { onConflict: 'date,hour,pool' });
    if (error) { console.error(error); alert('Error guardando aforo: ' + error.message); return; }
    setAforo(prev => {
      const filtered = prev.filter(a => !(a.date === data.date && a.hour === data.hour && a.pool === data.pool));
      return [{ ...data, id, updatedAt: now }, ...filtered];
    });
  };

  const deleteAforoDay = async (date: string) => {
    const { error } = await supabase.from('socorrista_aforo').delete().eq('date', date);
    if (error) { console.error(error); alert('Error eliminando: ' + error.message); return; }
    setAforo(prev => prev.filter(a => a.date !== date));
  };

  return (
    <AppContext.Provider value={{
      loading, currentUser, users, contadores, parametros, recirculacion,
      legionellaTemps, legionellaBiocida, incendios, alerts, alertHistory, alertRepairs, activePools,
      intervenciones, aforo,
      addIntervencion, deleteIntervencion, upsertAforo, deleteAforoDay,
      thresholds, tempAguaThresholds, recircThresholds, contadoresThresholds,
      updateThresholds, updateTempAguaThresholds, updateRecircThresholds, updateContadoresThresholds,
      resetThresholds, resetTempAguaThresholds, resetRecircThresholds, resetContadoresThresholds,`,
    `const addIntervencion = async`);

  return s;
});

// ─────────────────────────────────────────────────────────────────────────────
// 3) src/components/Sidebar.tsx — añadir item de menú Socorrista
// ─────────────────────────────────────────────────────────────────────────────
patch('src/components/Sidebar.tsx', (s) => {
  s = ensureReplace(s,
    `    { labelKey: 'nav_alertas',       path: '/dashboard/alertas',          icon: '🔔', perm: 'view_alerts',        adminOnly: false },`,
    `    { labelKey: 'nav_socorrista',    path: '/dashboard/socorrista',       icon: '🚑', perm: 'view_socorrista',    adminOnly: false },
    { labelKey: 'nav_alertas',       path: '/dashboard/alertas',          icon: '🔔', perm: 'view_alerts',        adminOnly: false },`,
    `nav_socorrista`);
  return s;
});

// ─────────────────────────────────────────────────────────────────────────────
// 4) src/lib/i18n.ts — traducción de nav_socorrista
// ─────────────────────────────────────────────────────────────────────────────
patch('src/lib/i18n.ts', (s) => {
  s = ensureReplace(s,
    `    nav_configuracion: 'Configuración',`,
    `    nav_configuracion: 'Configuración',
    nav_socorrista: 'Socorrista',`,
    `nav_socorrista: 'Socorrista'`);
  s = ensureReplace(s,
    `    nav_configuracion: 'Konfigurazioa',`,
    `    nav_configuracion: 'Konfigurazioa',
    nav_socorrista: 'Sorosle',`,
    `nav_socorrista: 'Sorosle'`);
  return s;
});

// ─────────────────────────────────────────────────────────────────────────────
// 5) src/app/dashboard/usuarios/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
patch('src/app/dashboard/usuarios/page.tsx', (s) => {
  // 5.1 — Añadir las 2 nuevas permisos a ALL_PERMISSIONS
  s = ensureReplace(s,
    `  { key: 'view_alerts',        label: 'Ver Alertas',          section: 'Sistema' },`,
    `  { key: 'view_socorrista',    label: 'Ver Socorrista',       section: 'Socorrista' },
  { key: 'edit_socorrista',    label: 'Editar Socorrista',    section: 'Socorrista' },
  { key: 'view_alerts',        label: 'Ver Alertas',          section: 'Sistema' },`,
    `'view_socorrista',    label: 'Ver Socorrista'`);

  // 5.2 — Dar permisos a admin/supervisor/operario sobre la nueva sección,
  //         y crear/actualizar el rol "socorrista" con todos los permisos relevantes
  //         (lo hacemos sustituyendo el ROLE_DEFAULTS completo si tiene la firma vieja)
  s = ensureReplace(s,
    `const ROLE_DEFAULTS: Record<UserRole, Permission[]> = {
  admin:      ALL_PERMISSIONS.map(p => p.key),
  supervisor: ['view_piscinas','edit_piscinas','view_contadores','edit_contadores','view_recirculacion','edit_recirculacion','view_legionella','edit_legionella','view_incendios','edit_incendios','view_alerts','export_data'],
  operario:   ['view_piscinas','edit_piscinas','view_contadores','edit_contadores','view_recirculacion','edit_recirculacion','view_legionella','edit_legionella','view_incendios','edit_incendios'],
  readonly:   ['view_piscinas','view_contadores','view_recirculacion','view_legionella','view_incendios'],
  sanidad:    ['view_piscinas','view_legionella'],
};`,
    `const ROLE_DEFAULTS: Record<UserRole, Permission[]> = {
  admin:      ALL_PERMISSIONS.map(p => p.key),
  supervisor: ['view_piscinas','edit_piscinas','view_contadores','edit_contadores','view_recirculacion','edit_recirculacion','view_legionella','edit_legionella','view_incendios','edit_incendios','view_socorrista','edit_socorrista','view_alerts','export_data'],
  operario:   ['view_piscinas','edit_piscinas','view_contadores','edit_contadores','view_recirculacion','edit_recirculacion','view_legionella','edit_legionella','view_incendios','edit_incendios','view_socorrista','edit_socorrista'],
  socorrista: ['view_piscinas','edit_piscinas','view_contadores','edit_contadores','view_recirculacion','edit_recirculacion','view_legionella','edit_legionella','view_incendios','edit_incendios','view_socorrista','edit_socorrista'],
  readonly:   ['view_piscinas','view_contadores','view_recirculacion','view_legionella','view_incendios'],
  sanidad:    ['view_piscinas','view_legionella'],
};`,
    `socorrista: ['view_piscinas','edit_piscinas'`);

  // 5.3 — Añadir socorrista a ROLE_COLORS y ROLE_LABELS si no estaban
  s = ensureReplace(s,
    `const ROLE_COLORS: Record<UserRole, string> = {
  admin:      'badge-danger',
  supervisor: 'badge-warning',
  operario:   'badge-info',
  readonly:   'badge-gray',
  sanidad:    'badge-ok',`,
    `const ROLE_COLORS: Record<UserRole, string> = {
  admin:      'badge-danger',
  supervisor: 'badge-warning',
  operario:   'badge-info',
  socorrista: 'badge-info',
  readonly:   'badge-gray',
  sanidad:    'badge-ok',`,
    `socorrista: 'badge-info',\n  readonly`);

  s = ensureReplace(s,
    `const ROLE_LABELS: Record<UserRole, string> = {
  admin:      'Admin',
  supervisor: 'Supervisor',
  operario:   'Operario',
  readonly:   'Solo lectura',
  sanidad:    'Sanidad',
};`,
    `const ROLE_LABELS: Record<UserRole, string> = {
  admin:      'Admin',
  supervisor: 'Supervisor',
  operario:   'Operario',
  socorrista: 'Socorrista',
  readonly:   'Solo lectura',
  sanidad:    'Sanidad',
};`,
    `socorrista: 'Socorrista',\n  readonly`);

  // 5.4 — Añadir <option> al <select> RoleSelect
  s = ensureReplace(s,
    `      <option value="operario">Operario</option>
      <option value="readonly">Solo lectura</option>`,
    `      <option value="operario">Operario</option>
      <option value="socorrista">Socorrista</option>
      <option value="readonly">Solo lectura</option>`,
    `<option value="socorrista">Socorrista</option>`);

  return s;
});

// ─────────────────────────────────────────────────────────────────────────────
// 6) src/types/index.ts — añadir 'socorrista' al UserRole (si no estaba)
// ─────────────────────────────────────────────────────────────────────────────
patch('src/types/index.ts', (s) => {
  s = ensureReplace(s,
    `export type UserRole = 'admin' | 'supervisor' | 'operario' | 'readonly' | 'sanidad';`,
    `export type UserRole = 'admin' | 'supervisor' | 'operario' | 'readonly' | 'sanidad' | 'socorrista';`,
    `'sanidad' | 'socorrista'`);
  return s;
});

// ─────────────────────────────────────────────────────────────────────────────
// FIN
// ─────────────────────────────────────────────────────────────────────────────
log('\n────────────────────────────────────────────────────────────');
ok('Todos los parches de Socorrista aplicados.');
log('\nSiguientes pasos:');
log('  1) Asegúrate de que existe el archivo:');
log('       src/app/dashboard/socorrista/page.tsx');
log('  2) Ejecuta la migración SQL en Supabase');
log('       (SQL_MIGRATION_SOCORRISTA.sql)');
log('  3) git add . && git commit -m "feat: socorrista" && git push');
log('  4) Login como admin o socorrista → menú "🚑 Socorrista"');
log('\nSi algo va mal, restaura los .bak generados.\n');

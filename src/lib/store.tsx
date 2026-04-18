'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Permission, Alert, ContadorEntry, LegionellaTemp, LegionellaBiocida, IncendioCheck, PoolParamRecord, PoolName, RecirculacionEntry } from '@/types';
import { BASE_POOLS, SEASONAL_POOLS } from '@/types';

// ─── Default Users ────────────────────────────────────────────────────────────
const DEFAULT_USERS: User[] = [
  {
    id: 'u1', name: 'Admin', email: 'admin@aquadash.com', password: 'admin123', role: 'admin',
    permissions: [
      'view_piscinas','view_recirculacion','view_contadores','view_legionella','view_incendios',
      'edit_piscinas','edit_recirculacion','edit_contadores','edit_legionella','edit_incendios',
      'view_alerts','manage_users','export_data'
    ],
    active: true, createdAt: '2026-01-01',
  },
  {
    id: 'u2', name: 'Supervisor', email: 'supervisor@aquadash.com', password: 'super123', role: 'supervisor',
    permissions: [
      'view_piscinas','view_recirculacion','view_contadores','view_legionella','view_incendios',
      'edit_piscinas','edit_recirculacion','edit_contadores','edit_legionella','edit_incendios',
      'view_alerts','export_data'
    ],
    active: true, createdAt: '2026-01-01',
  },
  {
    id: 'u3', name: 'Jon Operario', email: 'jon@aquadash.com', password: 'jon123', role: 'operario',
    permissions: [
      'view_piscinas','view_recirculacion','view_contadores','view_legionella','view_incendios',
      'edit_piscinas','edit_recirculacion','edit_contadores','edit_legionella','edit_incendios',
    ],
    active: true, createdAt: '2026-01-01',
  },
  {
    id: 'u4', name: 'Visitante', email: 'readonly@aquadash.com', password: 'view123', role: 'readonly',
    permissions: ['view_piscinas','view_recirculacion','view_contadores','view_legionella','view_incendios'],
    active: true, createdAt: '2026-01-01',
  },
];

// ─── Thresholds ───────────────────────────────────────────────────────────────
export const THRESHOLDS = {
  cloroLibre: { min: 0.5, max: 2.0, unit: 'mg/L' },
  cloroCombinado: { min: 0, max: 0.6, unit: 'mg/L' },
  ph: { min: 7.2, max: 7.8, unit: '' },
  turbidez: { min: 0, max: 0.5, unit: 'NTU' },
  tempAgua: { min: 24, max: 30, unit: '°C' },
  tempAmbiente: { min: 26, max: 33, unit: '°C' },
  humedadRelativa: { min: 50, max: 70, unit: '%' },
  co2Delta: { min: 0, max: 500, unit: 'ppm' }, // interior - exterior < 500
  tempRetornoLegionella: { min: 50, max: 65, unit: '°C' },
  tempDepositoLegionella: { min: 60, max: 70, unit: '°C' },
  biocida: { min: 0.2, max: 2.0, unit: 'mg/L' },
  phLegionella: { min: 7.0, max: 8.0, unit: '' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomBetween(a: number, b: number, decimals = 2) {
  return parseFloat((a + Math.random() * (b - a)).toFixed(decimals));
}

// Spanish public holidays 2026 (approximate) - format MM-DD
const HOLIDAYS_2026 = new Set([
  '01-01','01-06','04-02','04-03','05-01','08-15','10-12','11-01','12-06','12-08','12-25'
]);
function isDomingo(date: Date) { return date.getDay() === 0; }
function isFestivo(date: Date) {
  const key = `${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  return HOLIDAYS_2026.has(key);
}
function onlyMorning(date: Date) { return isDomingo(date) || isFestivo(date); }

function generateContadores(): ContadorEntry[] {
  const entries: ContadorEntry[] = [];
  let agua = 90980, gas = 403305, aguaPisc = 212240;
  for (let d = 1; d <= 90; d++) {
    const date = new Date(2026, 0, d);
    if (d > 31 && d <= 59) date.setMonth(1, d - 31);
    if (d > 59) date.setMonth(2, d - 59);
    const dow = date.getDay();
    const accesos = dow === 0 || dow === 6 ? 0 : randomBetween(500, 2500, 0);
    const aguaDiario = randomBetween(40, 110, 0);
    const gasDiario = randomBetween(700, 1400, 0);
    const aguaPiscDiario = randomBetween(20, 60, 0);
    agua += aguaDiario; gas += gasDiario; aguaPisc += aguaPiscDiario;
    entries.push({
      id: `c${d}`, date: date.toISOString().split('T')[0],
      accesos: Number(accesos), tempExterior: randomBetween(-2, 15, 1),
      aguaGeneral: agua, aguaGeneralDiario: aguaDiario,
      gas, gasDiario, aguaPiscinas: aguaPisc, aguaPiscinasDiario: aguaPiscDiario,
      kwTolargi: randomBetween(3000, 5500, 0), urBeroa: 0,
      electricidadNormal: randomBetween(200, 600, 0),
      electricidadPreferente: randomBetween(50, 200, 0),
    });
  }
  return entries;
}

function generateParametros(activePools: PoolName[]): PoolParamRecord[] {
  const records: PoolParamRecord[] = [];
  let idx = 0;
  for (let d = 1; d <= 90; d++) {
    const date = new Date(2026, 0, d);
    if (d > 31 && d <= 59) date.setMonth(1, d - 31);
    if (d > 59) date.setMonth(2, d - 59);
    const dateStr = date.toISOString().split('T')[0];
    const mk = (fn: () => number | null) =>
      Object.fromEntries(activePools.map(p => [p, fn()])) as unknown as Record<PoolName, number | null>;

    const sessions: Array<'morning' | 'afternoon'> = onlyMorning(date) ? ['morning'] : ['morning', 'afternoon'];
    for (const session of sessions) {
      const co2Ext = randomBetween(380, 450, 0);
      const co2Int = randomBetween(400, 900, 0); // sometimes > exterior+500
      records.push({
        id: `p${idx++}`, date: dateStr, session,
        params: {
          cloroLibre:      mk(() => randomBetween(0.4, 2.2, 2)),
          cloroCombinado:  mk(() => randomBetween(0.05, 0.75, 2)),
          ph:              mk(() => randomBetween(7.1, 7.9, 2)),
          temperatura:     mk(() => randomBetween(25, 31, 1)),
          turbidez:        mk(() => randomBetween(0.1, 0.6, 2)),
          tempAmbiente:    randomBetween(26, 33, 1),
          humedadRelativa: randomBetween(50, 70, 1),
          co2Interior:     co2Int,
          co2Exterior:     co2Ext,
        },
      });
    }
  }
  return records;
}

function generateRecirculacion(activePools: PoolName[]): RecirculacionEntry[] {
  const entries: RecirculacionEntry[] = [];
  let idx = 0;
  const baseCounters: Record<string, { recirc: number; dep: number }> = {};
  activePools.forEach(p => { baseCounters[p] = { recirc: randomBetween(10000, 50000, 0), dep: randomBetween(5000, 20000, 0) }; });

  for (let d = 1; d <= 90; d++) {
    const date = new Date(2026, 0, d);
    if (d > 31 && d <= 59) date.setMonth(1, d - 31);
    if (d > 59) date.setMonth(2, d - 59);
    const dateStr = date.toISOString().split('T')[0];
    for (const pool of activePools) {
      baseCounters[pool].recirc += randomBetween(200, 800, 0);
      baseCounters[pool].dep += randomBetween(100, 400, 0);
      entries.push({
        id: `r${idx++}`, date: dateStr, pool,
        contadorRecirculacion: Math.round(baseCounters[pool].recirc),
        contadorDepuracion: Math.round(baseCounters[pool].dep),
        horasFiltraje: randomBetween(18, 24, 1),
      });
    }
  }
  return entries;
}

function generateLegionellaTemps(): LegionellaTemp[] {
  const entries: LegionellaTemp[] = [];
  for (let d = 1; d <= 90; d++) {
    const date = new Date(2026, 0, d);
    if (d > 31 && d <= 59) date.setMonth(1, d - 31);
    if (d > 59) date.setMonth(2, d - 59);
    entries.push({
      id: `lt${d}`, date: date.toISOString().split('T')[0],
      month: ['Enero','Febrero','Marzo'][Math.floor((d-1)/30)],
      tempRetorno: randomBetween(54, 62, 1), tempDeposito1: randomBetween(60, 66, 1), tempDeposito2: randomBetween(60, 66, 1),
    });
  }
  return entries;
}

function generateLegionellaBiocida(): LegionellaBiocida[] {
  const entries: LegionellaBiocida[] = [];
  for (let d = 1; d <= 90; d++) {
    const date = new Date(2026, 0, d);
    if (d > 31 && d <= 59) date.setMonth(1, d - 31);
    if (d > 59) date.setMonth(2, d - 59);
    entries.push({
      id: `lb${d}`, date: date.toISOString().split('T')[0],
      biocida: randomBetween(0.15, 2.2, 2), ph: randomBetween(6.9, 8.1, 2),
      puntoDeMedida: 'ENTRADA DE AGUA', nombre: 'JON',
    });
  }
  return entries;
}

function generateIncendios(): IncendioCheck[] {
  const zonas = ['Zona Piscinas','Vestuarios','Sala Máquinas','Recepción','Almacén'];
  const tipos = ['Extintor','BIE','Detector humos','Salida emergencia','Rociador'];
  const entries: IncendioCheck[] = [];
  for (let d = 1; d <= 12; d++) {
    zonas.forEach((zona, zi) => tipos.forEach((tipo, ti) => {
      const rand = Math.random();
      entries.push({
        id: `i${d}_${zi}_${ti}`, date: new Date(2026, 0, d*7).toISOString().split('T')[0],
        tipo, zona, resultado: rand > 0.93 ? 'FALLO' : rand > 0.85 ? 'PENDIENTE' : 'OK',
        observaciones: rand > 0.93 ? 'Requiere revisión' : '', responsable: 'JON',
      });
    }));
  }
  return entries;
}

function generateAlerts(
  parametros: PoolParamRecord[],
  legTemps: LegionellaTemp[],
  legBiocida: LegionellaBiocida[],
  activePools: PoolName[],
): Alert[] {
  const alerts: Alert[] = [];
  let aIdx = 0;

  parametros.forEach(rec => {
    activePools.forEach(pool => {
      const cl = rec.params.cloroLibre[pool];
      if (cl !== null && (cl < THRESHOLDS.cloroLibre.min || cl > THRESHOLDS.cloroLibre.max)) {
        alerts.push({ id: `a${aIdx++}`, type: cl < 0.3 ? 'danger' : 'warning', section: 'piscinas', pool,
          message: `Cloro libre fuera de rango en ${pool}`, value: cl,
          threshold: `${THRESHOLDS.cloroLibre.min}-${THRESHOLDS.cloroLibre.max} mg/L`, timestamp: rec.date, resolved: false });
      }
      const cc = rec.params.cloroCombinado[pool];
      if (cc !== null && cc > THRESHOLDS.cloroCombinado.max) {
        alerts.push({ id: `a${aIdx++}`, type: cc > 1.0 ? 'danger' : 'warning', section: 'piscinas', pool,
          message: `Cloro combinado alto en ${pool}`, value: cc,
          threshold: `≤${THRESHOLDS.cloroCombinado.max} mg/L`, timestamp: rec.date, resolved: false });
      }
      const ph = rec.params.ph[pool];
      if (ph !== null && (ph < THRESHOLDS.ph.min || ph > THRESHOLDS.ph.max)) {
        alerts.push({ id: `a${aIdx++}`, type: 'warning', section: 'piscinas', pool,
          message: `pH fuera de rango en ${pool}`, value: ph,
          threshold: `${THRESHOLDS.ph.min}-${THRESHOLDS.ph.max}`, timestamp: rec.date, resolved: false });
      }
    });
    // CO2 delta check
    const { co2Interior, co2Exterior } = rec.params;
    if (co2Interior !== null && co2Exterior !== null && (co2Interior - co2Exterior) > THRESHOLDS.co2Delta.max) {
      alerts.push({ id: `a${aIdx++}`, type: 'warning', section: 'piscinas',
        message: `CO2 interior elevado (diferencia exterior)`,
        value: Math.round(co2Interior - co2Exterior), threshold: `≤${THRESHOLDS.co2Delta.max} ppm`,
        timestamp: rec.date, resolved: false });
    }
  });

  legTemps.forEach(t => {
    if (t.tempRetorno < THRESHOLDS.tempRetornoLegionella.min) {
      alerts.push({ id: `a${aIdx++}`, type: 'danger', section: 'legionella',
        message: 'Temperatura retorno ACS por debajo del mínimo', value: t.tempRetorno,
        threshold: `≥${THRESHOLDS.tempRetornoLegionella.min}°C`, timestamp: t.date, resolved: false });
    }
  });

  legBiocida.forEach(b => {
    if (b.biocida !== null && b.biocida < THRESHOLDS.biocida.min) {
      alerts.push({ id: `a${aIdx++}`, type: 'warning', section: 'legionella',
        message: 'Biocida por debajo del nivel mínimo', value: b.biocida,
        threshold: `≥${THRESHOLDS.biocida.min} mg/L`, timestamp: b.date, resolved: false });
    }
  });

  return alerts.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 80);
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface AppState {
  currentUser: User | null;
  users: User[];
  contadores: ContadorEntry[];
  parametros: PoolParamRecord[];
  recirculacion: RecirculacionEntry[];
  legionellaTemps: LegionellaTemp[];
  legionellaBiocida: LegionellaBiocida[];
  incendios: IncendioCheck[];
  alerts: Alert[];
  activePools: PoolName[];
  alertHistory: Alert[]; // resolved alerts kept for history
  login: (email: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (p: Permission) => boolean;
  updateUser: (user: User) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  deleteUser: (id: string) => void;
  addContador: (entry: Omit<ContadorEntry, 'id'>) => void;
  addPoolParam: (entry: Omit<PoolParamRecord, 'id'>) => void;
  addRecirculacion: (entry: Omit<RecirculacionEntry, 'id'>) => void;
  addLegionellaTemp: (entry: Omit<LegionellaTemp, 'id'>) => void;
  addLegionellaBiocida: (entry: Omit<LegionellaBiocida, 'id'>) => void;
  addIncendio: (entry: Omit<IncendioCheck, 'id'>) => void;
  resolveAlert: (id: string, newValue: number | string, resolvedBy: string) => void;
  toggleSeasonalPool: (pool: PoolName) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aq_users');
      if (saved) {
        const stored: User[] = JSON.parse(saved);
        // Always sync permissions from DEFAULT_USERS for known IDs to pick up new permissions
        return stored.map(u => {
          const def = DEFAULT_USERS.find(d => d.id === u.id);
          return def ? { ...u, permissions: def.permissions } : u;
        });
      }
    }
    return DEFAULT_USERS;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aq_session');
      if (saved) {
        const stored: User = JSON.parse(saved);
        const def = DEFAULT_USERS.find(d => d.id === stored.id);
        return def ? { ...stored, permissions: def.permissions } : stored;
      }
      return null;
    }
    return null;
  });
  const [activePools, setActivePools] = useState<PoolName[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aq_active_pools');
      return saved ? JSON.parse(saved) : [...BASE_POOLS];
    }
    return [...BASE_POOLS];
  });

  const [contadores] = useState<ContadorEntry[]>(() => generateContadores());
  const [parametros, setParametros] = useState<PoolParamRecord[]>(() => generateParametros([...BASE_POOLS]));
  const [recirculacion, setRecirculacion] = useState<RecirculacionEntry[]>(() => generateRecirculacion([...BASE_POOLS]));
  const [legionellaTemps] = useState<LegionellaTemp[]>(() => generateLegionellaTemps());
  const [legionellaBiocida] = useState<LegionellaBiocida[]>(() => generateLegionellaBiocida());
  const [incendios] = useState<IncendioCheck[]>(() => generateIncendios());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertHistory, setAlertHistory] = useState<Alert[]>([]);

  useEffect(() => {
    setAlerts(generateAlerts(parametros, legionellaTemps, legionellaBiocida, activePools));
  }, [parametros, legionellaTemps, legionellaBiocida, activePools]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('aq_users', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentUser) localStorage.setItem('aq_session', JSON.stringify(currentUser));
      else localStorage.removeItem('aq_session');
    }
  }, [currentUser]);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('aq_active_pools', JSON.stringify(activePools));
    setParametros(generateParametros(activePools));
    setRecirculacion(generateRecirculacion(activePools));
  }, [activePools]);

  const login = (email: string, password: string) => {
    const user = users.find(u => u.email === email && u.password === password && u.active);
    if (user) { setCurrentUser(user); return true; }
    return false;
  };
  const logout = () => setCurrentUser(null);
  const hasPermission = (p: Permission) => currentUser?.permissions.includes(p) ?? false;
  const updateUser = (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    if (currentUser?.id === user.id) setCurrentUser(user);
  };
  const addUser = (u: Omit<User, 'id' | 'createdAt'>) =>
    setUsers(prev => [...prev, { ...u, id: `u${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] }]);
  const deleteUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));
  const addContador = (_e: Omit<ContadorEntry, 'id'>) => {};
  const addPoolParam = (_e: Omit<PoolParamRecord, 'id'>) => {};
  const addRecirculacion = (_e: Omit<RecirculacionEntry, 'id'>) => {};
  const addLegionellaTemp = (_e: Omit<LegionellaTemp, 'id'>) => {};
  const addLegionellaBiocida = (_e: Omit<LegionellaBiocida, 'id'>) => {};
  const addIncendio = (_e: Omit<IncendioCheck, 'id'>) => {};

  const resolveAlert = (id: string, newValue: number | string, resolvedBy: string) => {
    setAlerts(prev => {
      const updated = prev.map(a => a.id === id
        ? { ...a, resolved: true, resolvedAt: new Date().toISOString().split('T')[0], resolvedValue: newValue, resolvedBy }
        : a
      );
      const resolved = updated.find(a => a.id === id);
      if (resolved) setAlertHistory(h => [...h, resolved]);
      return updated;
    });
  };

  const toggleSeasonalPool = (pool: PoolName) => {
    if (!SEASONAL_POOLS.includes(pool)) return; // can only toggle seasonal pools
    setActivePools(prev =>
      prev.includes(pool) ? prev.filter(p => p !== pool) : [...prev, pool]
    );
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, contadores, parametros, recirculacion, legionellaTemps, legionellaBiocida,
      incendios, alerts, activePools, alertHistory,
      login, logout, hasPermission, updateUser, addUser, deleteUser,
      addContador, addPoolParam, addRecirculacion, addLegionellaTemp, addLegionellaBiocida, addIncendio,
      resolveAlert, toggleSeasonalPool,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};

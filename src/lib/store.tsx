'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Permission, Alert, AlertRepair, ContadorEntry, LegionellaTemp, LegionellaBiocida, IncendioCheck, PoolParamRecord, PoolName, RecirculacionEntry } from '@/types';
import { BASE_POOLS, SEASONAL_POOLS } from '@/types';

// ─── Thresholds globales ──────────────────────────────────────────────────────
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
};

// ─── Mappers ──────────────────────────────────────────────────────────────────
function rowToParam(row: any): PoolParamRecord {
  return {
    id: row.id, date: row.date, session: row.session,
    params: {
      cloroLibre:          row.cloro_libre      ?? {},
      cloroCombinado:      row.cloro_combinado  ?? {},
      ph:                  row.ph               ?? {},
      temperatura:         row.temperatura      ?? {},
      turbidez:            row.turbidez         ?? {},
      tempAmbiente:        row.temp_ambiente    ?? null,
      humedadRelativa:     row.humedad_relativa ?? null,
      co2Interior:         row.co2_interior     ?? null,
      co2Exterior:         row.co2_exterior     ?? null,
      tempAmbienteGrande:  row.temp_ambiente_grande  ?? null,
      tempAmbienteSpa:     row.temp_ambiente_spa     ?? null,
      tempAmbientePequena: row.temp_ambiente_pequena ?? null,
      humedadGrande:       row.humedad_grande        ?? null,
      humedadSpa:          row.humedad_spa            ?? null,
      humedadPequena:      row.humedad_pequena        ?? null,
    },
  };
}

function rowToContador(row: any): ContadorEntry {
  return {
    id: row.id, date: row.date, accesos: row.accesos,
    tempExterior: row.temp_exterior, aguaGeneral: row.agua_general,
    aguaGeneralDiario: row.agua_general_diario, gas: row.gas, gasDiario: row.gas_diario,
    aguaPiscinas: row.agua_piscinas, aguaPiscinasDiario: row.agua_piscinas_diario,
    kwTolargi: row.kw_tolargi, urBeroa: row.ur_beroa,
    electricidadNormal: row.electricidad_normal, electricidadPreferente: row.electricidad_preferente,
  };
}

function rowToRecirculacion(row: any): RecirculacionEntry {
  return {
    id: row.id, date: row.date, pool: row.pool,
    contadorRecirculacion: row.contador_recirculacion,
    contadorDepuracion: row.contador_depuracion,
    horasFiltraje: row.horas_filtraje,
  };
}

function rowToLegionellaTemp(row: any): LegionellaTemp {
  return {
    id: row.id, date: row.date, month: row.month,
    tempRetorno: row.temp_retorno, tempDeposito1: row.temp_deposito1,
    tempDeposito2: row.temp_deposito2, tempRamal1: row.temp_ramal1, tempRamal2: row.temp_ramal2,
  };
}

function rowToLegionellaBiocida(row: any): LegionellaBiocida {
  return { id: row.id, date: row.date, biocida: row.biocida, ph: row.ph, puntoDeMedida: row.punto_de_medida, nombre: row.nombre };
}

function rowToIncendio(row: any): IncendioCheck {
  return { id: row.id, date: row.date, tipo: row.tipo, zona: row.zona, resultado: row.resultado, observaciones: row.observaciones, responsable: row.responsable };
}

function rowToAlert(row: any): Alert {
  return {
    id: row.id, type: row.type, section: row.section, pool: row.pool,
    message: row.message, value: row.value, threshold: row.threshold,
    timestamp: row.timestamp, resolved: row.resolved,
    resolvedAt: row.resolved_at, resolvedValue: row.resolved_value, resolvedBy: row.resolved_by,
    paramDate: row.param_date, paramSession: row.param_session, parameterKey: row.parameter_key,
  };
}

function rowToAlertRepair(row: any): AlertRepair {
  return {
    id: row.id, alertId: row.alert_id, parametroDate: row.parametro_date,
    parametroSession: row.parametro_session, pool: row.pool, parameterKey: row.parameter_key,
    oldValue: row.old_value, newValue: row.new_value, repairedBy: row.repaired_by,
    repairedAt: row.repaired_at, notes: row.notes,
  };
}

function rowToUser(row: any): User {
  return { id: row.id, name: row.name, email: row.email, password: row.password, role: row.role, permissions: row.permissions, active: row.active, createdAt: row.created_at };
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface AppState {
  loading: boolean;
  currentUser: User | null;
  users: User[];
  contadores: ContadorEntry[];
  parametros: PoolParamRecord[];
  recirculacion: RecirculacionEntry[];
  legionellaTemps: LegionellaTemp[];
  legionellaBiocida: LegionellaBiocida[];
  incendios: IncendioCheck[];
  alerts: Alert[];
  alertHistory: Alert[];
  alertRepairs: AlertRepair[];
  activePools: PoolName[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (p: Permission) => boolean;
  updateUser: (user: User) => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addContador: (entry: Omit<ContadorEntry, 'id'>) => Promise<void>;
  addPoolParam: (entry: Omit<PoolParamRecord, 'id'>) => Promise<void>;
  addRecirculacion: (entry: Omit<RecirculacionEntry, 'id'>) => Promise<void>;
  addLegionellaTemp: (entry: Omit<LegionellaTemp, 'id'>) => Promise<void>;
  addLegionellaBiocida: (entry: Omit<LegionellaBiocida, 'id'>) => Promise<void>;
  addIncendio: (entry: Omit<IncendioCheck, 'id'>) => Promise<void>;
  resolveAlert: (id: string, newValue: string, resolvedBy: string) => Promise<void>;
  resolveAlertWithRepair: (
    id: string, newValue: string, resolvedBy: string,
    repair?: { date: string; session: string; pool?: string; paramKey: string; oldValue?: number; correctedValue: number }
  ) => Promise<void>;
  updateParamValue: (date: string, session: string, pool: string | null, paramKey: string, newValue: number) => Promise<void>;
  toggleSeasonalPool: (pool: PoolName) => Promise<void>;
  generateAlertsFromData: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [contadores, setContadores] = useState<ContadorEntry[]>([]);
  const [parametros, setParametros] = useState<PoolParamRecord[]>([]);
  const [recirculacion, setRecirculacion] = useState<RecirculacionEntry[]>([]);
  const [legionellaTemps, setLegionellaTemps] = useState<LegionellaTemp[]>([]);
  const [legionellaBiocida, setLegionellaBiocida] = useState<LegionellaBiocida[]>([]);
  const [incendios, setIncendios] = useState<IncendioCheck[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertHistory, setAlertHistory] = useState<Alert[]>([]);
  const [alertRepairs, setAlertRepairs] = useState<AlertRepair[]>([]);
  const [activePools, setActivePools] = useState<PoolName[]>([...BASE_POOLS]);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [
          { data: usersData }, { data: paramData }, { data: reciData }, { data: contData },
          { data: legTempData }, { data: legBioData }, { data: incData },
          { data: alertData }, { data: configData }, { data: repairsData },
        ] = await Promise.all([
          supabase.from('users').select('*').order('created_at'),
          supabase.from('parametros').select('*').order('date', { ascending: true }).order('session'),
          supabase.from('recirculacion').select('*').order('date', { ascending: true }),
          supabase.from('contadores').select('*').order('date', { ascending: true }),
          supabase.from('legionella_temps').select('*').order('date', { ascending: true }),
          supabase.from('legionella_biocida').select('*').order('date', { ascending: true }),
          supabase.from('incendios').select('*').order('date', { ascending: true }),
          supabase.from('alerts').select('*').order('timestamp', { ascending: false }),
          supabase.from('app_config').select('*'),
          supabase.from('alert_repairs').select('*').order('repaired_at', { ascending: false }),
        ]);

        if (usersData) setUsers(usersData.map(rowToUser));
        if (paramData) setParametros(paramData.map(rowToParam));
        if (reciData) setRecirculacion(reciData.map(rowToRecirculacion));
        if (contData) setContadores(contData.map(rowToContador));
        if (legTempData) setLegionellaTemps(legTempData.map(rowToLegionellaTemp));
        if (legBioData) setLegionellaBiocida(legBioData.map(rowToLegionellaBiocida));
        if (incData) setIncendios(incData.map(rowToIncendio));
        if (alertData) {
          setAlerts(alertData.filter((a: any) => !a.resolved).map(rowToAlert));
          setAlertHistory(alertData.filter((a: any) => a.resolved).map(rowToAlert));
        }
        if (repairsData) setAlertRepairs(repairsData.map(rowToAlertRepair));
        if (configData) {
          const poolsConfig = configData.find((c: any) => c.key === 'active_pools');
          if (poolsConfig) setActivePools(poolsConfig.value as PoolName[]);
        }
        const sessionId = sessionStorage.getItem('aq_session_id');
        if (sessionId && usersData) {
          const user = usersData.find((u: any) => u.id === sessionId);
          if (user) setCurrentUser(rowToUser(user));
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { data } = await supabase.from('users').select('*').eq('email', email).eq('password', password).eq('active', true).single();
    if (data) { const user = rowToUser(data); setCurrentUser(user); sessionStorage.setItem('aq_session_id', user.id); return true; }
    return false;
  };

  const logout = () => { setCurrentUser(null); sessionStorage.removeItem('aq_session_id'); };
  const hasPermission = (p: Permission) => currentUser?.permissions.includes(p) ?? false;

  const updateUser = async (user: User) => {
    await supabase.from('users').update({ name: user.name, email: user.email, password: user.password, role: user.role, permissions: user.permissions, active: user.active }).eq('id', user.id);
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    if (currentUser?.id === user.id) setCurrentUser(user);
  };

  const addUser = async (u: Omit<User, 'id' | 'createdAt'>) => {
    const newUser = { ...u, id: `u${Date.now()}`, created_at: new Date().toISOString().split('T')[0] };
    await supabase.from('users').insert(newUser);
    setUsers(prev => [...prev, rowToUser(newUser)]);
  };

  const deleteUser = async (id: string) => {
    await supabase.from('users').delete().eq('id', id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const addContador = async (e: Omit<ContadorEntry, 'id'>) => {
    const row = { id: `c${Date.now()}`, date: e.date, accesos: e.accesos, temp_exterior: e.tempExterior, agua_general: e.aguaGeneral, agua_general_diario: e.aguaGeneralDiario, gas: e.gas, gas_diario: e.gasDiario, agua_piscinas: e.aguaPiscinas, agua_piscinas_diario: e.aguaPiscinasDiario, kw_tolargi: e.kwTolargi, ur_beroa: e.urBeroa, electricidad_normal: e.electricidadNormal, electricidad_preferente: e.electricidadPreferente };
    await supabase.from('contadores').insert(row);
    setContadores(prev => [...prev, rowToContador(row)]);
  };

  const addPoolParam = async (e: Omit<PoolParamRecord, 'id'>) => {
    const row = {
      id: `p${Date.now()}`, date: e.date, session: e.session,
      cloro_libre: e.params.cloroLibre, cloro_combinado: e.params.cloroCombinado,
      ph: e.params.ph, temperatura: e.params.temperatura, turbidez: e.params.turbidez,
      temp_ambiente: e.params.tempAmbiente, humedad_relativa: e.params.humedadRelativa,
      co2_interior: e.params.co2Interior, co2_exterior: e.params.co2Exterior,
      temp_ambiente_grande:  e.params.tempAmbienteGrande,
      temp_ambiente_spa:     e.params.tempAmbienteSpa,
      temp_ambiente_pequena: e.params.tempAmbientePequena,
      humedad_grande:        e.params.humedadGrande,
      humedad_spa:           e.params.humedadSpa,
      humedad_pequena:       e.params.humedadPequena,
    };
    await supabase.from('parametros').insert(row);
    setParametros(prev => [...prev, rowToParam(row)]);
    await generateAlertsFromNewParam(rowToParam(row));
  };

  const addRecirculacion = async (e: Omit<RecirculacionEntry, 'id'>) => {
    const row = { id: `r${Date.now()}`, date: e.date, pool: e.pool, contador_recirculacion: e.contadorRecirculacion, contador_depuracion: e.contadorDepuracion, horas_filtraje: e.horasFiltraje };
    await supabase.from('recirculacion').insert(row);
    setRecirculacion(prev => [...prev, rowToRecirculacion(row)]);
  };

  const addLegionellaTemp = async (e: Omit<LegionellaTemp, 'id'>) => {
    const row = { id: `lt${Date.now()}`, date: e.date, month: e.month, temp_retorno: e.tempRetorno, temp_deposito1: e.tempDeposito1, temp_deposito2: e.tempDeposito2, temp_ramal1: e.tempRamal1, temp_ramal2: e.tempRamal2 };
    await supabase.from('legionella_temps').insert(row);
    setLegionellaTemps(prev => [...prev, rowToLegionellaTemp(row)]);
  };

  const addLegionellaBiocida = async (e: Omit<LegionellaBiocida, 'id'>) => {
    const row = { id: `lb${Date.now()}`, date: e.date, biocida: e.biocida, ph: e.ph, punto_de_medida: e.puntoDeMedida, nombre: e.nombre };
    await supabase.from('legionella_biocida').insert(row);
    setLegionellaBiocida(prev => [...prev, rowToLegionellaBiocida(row)]);
  };

  const addIncendio = async (e: Omit<IncendioCheck, 'id'>) => {
    const row = { id: `i${Date.now()}`, date: e.date, tipo: e.tipo, zona: e.zona, resultado: e.resultado, observaciones: e.observaciones, responsable: e.responsable };
    await supabase.from('incendios').insert(row);
    setIncendios(prev => [...prev, rowToIncendio(row)]);
  };

  // ─── Update a specific parameter value in parametros (for repairing alerts) ──
  const updateParamValue = async (date: string, session: string, pool: string | null, paramKey: string, newValue: number) => {
    const colMap: Record<string, string> = {
      cloroLibre: 'cloro_libre', cloroCombinado: 'cloro_combinado',
      ph: 'ph', temperatura: 'temperatura', turbidez: 'turbidez',
    };
    const col = colMap[paramKey];
    if (!col || !pool) return;

    // Fetch current record
    const { data: rows } = await supabase.from('parametros').select('*').eq('date', date).eq('session', session);
    if (!rows || rows.length === 0) return;

    for (const row of rows) {
      const current = row[col] ?? {};
      const updated = { ...current, [pool]: newValue };
      await supabase.from('parametros').update({ [col]: updated }).eq('id', row.id);

      // Update local state
      setParametros(prev => prev.map(p =>
        p.id === row.id
          ? { ...p, params: { ...p.params, [paramKey]: { ...(p.params as any)[paramKey], [pool]: newValue } } }
          : p
      ));
    }
  };

  const resolveAlert = async (id: string, newValue: string, resolvedBy: string) => {
    const resolvedAt = new Date().toISOString().split('T')[0];
    await supabase.from('alerts').update({ resolved: true, resolved_at: resolvedAt, resolved_value: newValue, resolved_by: resolvedBy }).eq('id', id);
    setAlerts(prev => {
      const alert = prev.find(a => a.id === id);
      if (alert) { const resolved = { ...alert, resolved: true, resolvedAt, resolvedValue: newValue, resolvedBy }; setAlertHistory(h => [...h, resolved]); }
      return prev.filter(a => a.id !== id);
    });
  };

  const resolveAlertWithRepair = async (
    id: string, newValue: string, resolvedBy: string,
    repair?: { date: string; session: string; pool?: string; paramKey: string; oldValue?: number; correctedValue: number }
  ) => {
    const resolvedAt = new Date().toISOString().split('T')[0];
    await supabase.from('alerts').update({ resolved: true, resolved_at: resolvedAt, resolved_value: newValue, resolved_by: resolvedBy }).eq('id', id);

    if (repair) {
      // Update the actual measurement value
      if (repair.pool) {
        await updateParamValue(repair.date, repair.session, repair.pool, repair.paramKey, repair.correctedValue);
      }
      // Save repair to history
      const repairRow = {
        id: `rp${Date.now()}`,
        alert_id: id, parametro_date: repair.date, parametro_session: repair.session,
        pool: repair.pool ?? null, parameter_key: repair.paramKey,
        old_value: repair.oldValue ?? null, new_value: repair.correctedValue,
        repaired_by: resolvedBy, repaired_at: new Date().toISOString(),
      };
      await supabase.from('alert_repairs').insert(repairRow);
      setAlertRepairs(prev => [rowToAlertRepair(repairRow), ...prev]);
    }

    setAlerts(prev => {
      const alert = prev.find(a => a.id === id);
      if (alert) { const resolved = { ...alert, resolved: true, resolvedAt, resolvedValue: newValue, resolvedBy }; setAlertHistory(h => [...h, resolved]); }
      return prev.filter(a => a.id !== id);
    });
  };

  async function generateAlertsFromNewParam(rec: PoolParamRecord) {
    const newAlerts: any[] = [];
    let idx = Date.now();
    for (const pool of activePools) {
      const cl = rec.params.cloroLibre[pool];
      if (cl !== null && cl !== undefined && (cl < THRESHOLDS.cloroLibre.min || cl > THRESHOLDS.cloroLibre.max)) {
        newAlerts.push({ id: `a${idx++}`, type: 'danger', section: 'piscinas', pool, message: `Cloro libre fuera de rango en ${pool}`, value: String(cl), threshold: `${THRESHOLDS.cloroLibre.min}-${THRESHOLDS.cloroLibre.max} mg/L`, timestamp: rec.date, resolved: false, param_date: rec.date, param_session: rec.session, parameter_key: 'cloroLibre' });
      }
      const cc = rec.params.cloroCombinado[pool];
      if (cc !== null && cc !== undefined && cc > THRESHOLDS.cloroCombinado.max) {
        newAlerts.push({ id: `a${idx++}`, type: 'danger', section: 'piscinas', pool, message: `Cloro combinado alto en ${pool}`, value: String(cc), threshold: `<=${THRESHOLDS.cloroCombinado.max} mg/L`, timestamp: rec.date, resolved: false, param_date: rec.date, param_session: rec.session, parameter_key: 'cloroCombinado' });
      }
      const ph = rec.params.ph[pool];
      if (ph !== null && ph !== undefined && (ph < THRESHOLDS.ph.min || ph > THRESHOLDS.ph.max)) {
        newAlerts.push({ id: `a${idx++}`, type: 'danger', section: 'piscinas', pool, message: `pH fuera de rango en ${pool}`, value: String(ph), threshold: `${THRESHOLDS.ph.min}-${THRESHOLDS.ph.max}`, timestamp: rec.date, resolved: false, param_date: rec.date, param_session: rec.session, parameter_key: 'ph' });
      }
      const turb = rec.params.turbidez[pool];
      if (turb !== null && turb !== undefined && turb > THRESHOLDS.turbidez.max) {
        newAlerts.push({ id: `a${idx++}`, type: 'danger', section: 'piscinas', pool, message: `Turbidez elevada en ${pool}`, value: String(turb), threshold: `<=${THRESHOLDS.turbidez.max} NTU`, timestamp: rec.date, resolved: false, param_date: rec.date, param_session: rec.session, parameter_key: 'turbidez' });
      }
    }
      const temp = rec.params.temperatura[pool as PoolName];
      if (temp !== null && temp !== undefined) {
        const tr = TEMP_AGUA_THRESHOLDS[pool] ?? { min: 0, max: 40 };
        if (temp < tr.min || temp > tr.max) {
          newAlerts.push({ id: `a${idx++}`, type: 'danger', section: 'piscinas', pool, message: `Temperatura del agua fuera de rango en ${pool}`, value: String(temp), threshold: `${tr.min}-${tr.max}°C`, timestamp: rec.date, resolved: false, param_date: rec.date, param_session: rec.session, parameter_key: 'temperatura' });
        }
      }
    const { co2Interior, co2Exterior } = rec.params;
    if (co2Interior !== null && co2Exterior !== null && co2Interior !== undefined && co2Exterior !== undefined && (co2Interior - co2Exterior) > THRESHOLDS.co2Delta.max) {
      newAlerts.push({ id: `a${idx++}`, type: 'danger', section: 'piscinas', message: 'CO2 interior elevado (diferencia exterior)', value: String(Math.round(co2Interior - co2Exterior)), threshold: `<=${THRESHOLDS.co2Delta.max} ppm`, timestamp: rec.date, resolved: false, param_date: rec.date, param_session: rec.session, parameter_key: 'co2Delta' });
    }
    if (newAlerts.length > 0) {
      await supabase.from('alerts').insert(newAlerts);
      setAlerts(prev => [...newAlerts.map(rowToAlert), ...prev]);
    }
  }

  const generateAlertsFromData = async () => {};

  const toggleSeasonalPool = async (pool: PoolName) => {
    if (!SEASONAL_POOLS.includes(pool)) return;
    const next = activePools.includes(pool) ? activePools.filter(p => p !== pool) : [...activePools, pool];
    setActivePools(next);
    await supabase.from('app_config').upsert({ key: 'active_pools', value: next, updated_at: new Date().toISOString() });
  };

  return (
    <AppContext.Provider value={{
      loading, currentUser, users, contadores, parametros, recirculacion,
      legionellaTemps, legionellaBiocida, incendios, alerts, alertHistory, alertRepairs, activePools,
      login, logout, hasPermission, updateUser, addUser, deleteUser,
      addContador, addPoolParam, addRecirculacion, addLegionellaTemp, addLegionellaBiocida, addIncendio,
      resolveAlert, resolveAlertWithRepair, updateParamValue, toggleSeasonalPool, generateAlertsFromData,
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

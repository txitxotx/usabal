export type UserRole = 'admin' | 'supervisor' | 'operario' | 'readonly';

export type Permission =
  | 'view_piscinas' | 'view_recirculacion' | 'view_contadores'
  | 'view_legionella' | 'view_incendios'
  | 'edit_piscinas' | 'edit_recirculacion' | 'edit_contadores'
  | 'edit_legionella' | 'edit_incendios'
  | 'view_alerts' | 'manage_users' | 'export_data';

export interface User {
  id: string; name: string; email: string; password: string;
  role: UserRole; permissions: Permission[]; active: boolean; createdAt: string;
}

export interface Alert {
  id: string; type: 'danger' | 'warning' | 'info'; section: string; pool?: string;
  message: string; value?: number | string; threshold?: number | string;
  timestamp: string; resolved: boolean; resolvedAt?: string;
  resolvedValue?: number | string; resolvedBy?: string;
  paramDate?: string; paramSession?: string; parameterKey?: string;
}

export interface AlertRepair {
  id: string; alertId: string; parametroDate: string; parametroSession: string;
  pool?: string; parameterKey: string; oldValue?: number; newValue: number;
  repairedBy: string; repairedAt: string; notes?: string;
}

export interface ContadorEntry {
  id: string; date: string; accesos: number; tempExterior: number;
  aguaGeneral: number; aguaGeneralDiario: number; gas: number; gasDiario: number;
  aguaPiscinas: number; aguaPiscinasDiario: number; kwTolargi: number; urBeroa: number;
  electricidadNormal?: number; electricidadPreferente?: number;
}

export type PoolName = 'P. Grande' | 'P. Peq.-Med.' | 'SPA' | 'Pileta' | 'P. Ext. Grande' | 'P. Ext. Pequeña' | 'Splash';
export const SEASONAL_POOLS: PoolName[] = ['P. Ext. Grande', 'P. Ext. Pequeña', 'Splash'];
export const BASE_POOLS: PoolName[] = ['P. Grande', 'P. Peq.-Med.', 'SPA', 'Pileta'];

export type MeasurementSession = 'morning' | 'afternoon';

export interface PoolParamRecord {
  id: string; date: string; session: MeasurementSession;
  params: {
    cloroLibre:           Record<PoolName, number | null>;
    cloroCombinado:       Record<PoolName, number | null>;
    ph:                   Record<PoolName, number | null>;
    temperatura:          Record<PoolName, number | null>;
    turbidez:             Record<PoolName, number | null>;
    tempAmbiente:         number | null;
    humedadRelativa:      number | null;
    co2Interior:          number | null;
    co2Exterior:          number | null;
    tempAmbienteGrande:   number | null;
    tempAmbienteSpa:      number | null;
    tempAmbientePequena:  number | null;
    humedadGrande:        number | null;
    humedadSpa:           number | null;
    humedadPequena:       number | null;
  };
}

export interface RecirculacionEntry {
  id: string; date: string; pool: PoolName;
  contadorRecirculacion: number;
  contadorDepuracion: number;
  horasFiltraje: number;
  presionFiltros?: number | null;   // bar — campo nuevo
}

export interface LegionellaTemp {
  id: string; date: string; month: string;
  tempRetorno: number; tempDeposito1: number; tempDeposito2: number;
  tempRamal1?: number; tempRamal2?: number;
}

export interface LegionellaBiocida {
  id: string; date: string; biocida: number | null; ph: number | null;
  puntoDeMedida: string; nombre: string;
}

export interface IncendioCheck {
  id: string; date: string; tipo: string; zona: string;
  resultado: 'OK' | 'FALLO' | 'PENDIENTE'; observaciones?: string; responsable: string;
}

export interface Threshold {
  parameter: string; pool?: PoolName; min: number; max: number; unit: string;
}

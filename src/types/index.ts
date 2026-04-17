export type UserRole = 'admin' | 'supervisor' | 'operario' | 'readonly';

export type Permission =
  | 'view_piscinas'
  | 'view_recirculacion'
  | 'view_contadores'
  | 'view_legionella'
  | 'view_incendios'
  | 'edit_piscinas'
  | 'edit_recirculacion'
  | 'edit_contadores'
  | 'edit_legionella'
  | 'edit_incendios'
  | 'view_alerts'
  | 'manage_users'
  | 'export_data';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  permissions: Permission[];
  active: boolean;
  createdAt: string;
}

export interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'info';
  section: string;
  pool?: string;
  message: string;
  value?: number | string;
  threshold?: number | string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedValue?: number | string;
  resolvedBy?: string;
}

// Contadores
export interface ContadorEntry {
  id: string;
  date: string;
  accesos: number;
  tempExterior: number;
  aguaGeneral: number;
  aguaGeneralDiario: number;
  gas: number;
  gasDiario: number;
  aguaPiscinas: number;
  aguaPiscinasDiario: number;
  kwTolargi: number;
  urBeroa: number;
  electricidadNormal?: number;
  electricidadPreferente?: number;
  gasCogeneracion?: number;
  kwProducidos?: number;
  enfriadora?: number;
}

// Parámetros piscinas
export type PoolName = 'P. Grande' | 'P. Peq.-Med.' | 'SPA' | 'Pileta' | 'P. Ext. Grande' | 'P. Ext. Pequeña' | 'Splash';

// Pools that are seasonal (only in summer, can be toggled by admin)
export const SEASONAL_POOLS: PoolName[] = ['P. Ext. Grande', 'P. Ext. Pequeña', 'Splash'];
export const BASE_POOLS: PoolName[] = ['P. Grande', 'P. Peq.-Med.', 'SPA', 'Pileta'];

export type MeasurementSession = 'morning' | 'afternoon';

export interface PoolParamRecord {
  id: string;
  date: string;
  session: MeasurementSession; // morning or afternoon
  params: {
    cloroLibre: Record<PoolName, number | null>;
    cloroCombinado: Record<PoolName, number | null>;
    ph: Record<PoolName, number | null>;
    temperatura: Record<PoolName, number | null>;
    turbidez: Record<PoolName, number | null>;
    tempAmbiente: number | null;
    humedadRelativa: number | null;
    co2Interior: number | null;
    co2Exterior: number | null;
  };
}

// Recirculación
export interface RecirculacionEntry {
  id: string;
  date: string;
  pool: PoolName;
  contadorRecirculacion: number;
  contadorDepuracion: number;
  horasFiltraje: number;
}

// Legionella
export interface LegionellaTemp {
  id: string;
  date: string;
  month: string;
  tempRetorno: number;
  tempDeposito1: number;
  tempDeposito2: number;
  tempRamal1?: number;
  tempRamal2?: number;
}

export interface LegionellaBiocida {
  id: string;
  date: string;
  biocida: number | null;
  ph: number | null;
  puntoDeMedida: string;
  nombre: string;
}

// Incendios
export interface IncendioCheck {
  id: string;
  date: string;
  tipo: string;
  zona: string;
  resultado: 'OK' | 'FALLO' | 'PENDIENTE';
  observaciones?: string;
  responsable: string;
}

// Umbrales / thresholds
export interface Threshold {
  parameter: string;
  pool?: PoolName;
  min: number;
  max: number;
  unit: string;
}

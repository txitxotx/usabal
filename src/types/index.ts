export type UserRole = 'admin' | 'supervisor' | 'operario' | 'readonly';

export type Permission =
  | 'view_piscinas'
  | 'view_contadores'
  | 'view_legionella'
  | 'view_incendios'
  | 'edit_piscinas'
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
  message: string;
  value?: number | string;
  threshold?: number | string;
  timestamp: string;
  resolved: boolean;
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

export interface PoolParam {
  id: string;
  date: string;
  pool: PoolName;
  tipoControl: string;
  value: number | null;
  incumplimiento: boolean;
}

export interface PoolParamRecord {
  id: string;
  date: string;
  params: {
    cloroLibre: Record<PoolName, number | null>;
    cloroCombinado: Record<PoolName, number | null>;
    ph: Record<PoolName, number | null>;
    temperatura: Record<PoolName, number | null>;
    turbidez: Record<PoolName, number | null>;
    humedad?: number | null;
    co2?: number | null;
  };
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

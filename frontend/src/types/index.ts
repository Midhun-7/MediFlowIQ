// ── Auth types for Phase 4 ─────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'DOCTOR' | 'STAFF';

export interface AuthUser {
  username: string;
  fullName: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix ms
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  username: string;
  fullName: string;
  role: UserRole;
  expiresIn: number; // seconds
}

// Existing types below — unchanged ────────────────────────────────────────────

export type Priority = 'EMERGENCY' | 'HIGH_RISK' | 'NORMAL';
export type PatientStatus = 'WAITING' | 'IN_PROGRESS' | 'DONE';
export type AmbulanceStatus = 'AVAILABLE' | 'DISPATCHED' | 'ON_SCENE' | 'RETURNING';

export interface QueueEntry {
  id: number;
  patientId: number;
  patientName: string;
  patientAge: number;
  token: string;
  priority: Priority;
  status: PatientStatus;
  position: number;
  estimatedWaitMinutes: number;
  symptoms: string | null;
  registeredAt: string;
}

export interface RegisterPatientRequest {
  name: string;
  age: number;
  priority: Priority;
  symptoms?: string;
}

export type SystemLoad = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface QueueStats {
  totalWaiting: number;
  emergencies: number;
  avgWaitMinutes: number;
  load: SystemLoad;
}

export interface Ambulance {
  id: number;
  callSign: string;
  driverName: string;
  status: AmbulanceStatus;
  lat: number;
  lng: number;
  targetLat: number;
  targetLng: number;
  etaMinutes: number;
}

export interface AppUserRecord {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface AuditLogEntry {
  id: number;
  actor: string;
  action: string;
  details: string;
  performedAt: string;
  ipAddress: string;
}

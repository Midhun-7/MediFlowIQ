export type Priority = 'EMERGENCY' | 'HIGH_RISK' | 'NORMAL';
export type PatientStatus = 'WAITING' | 'IN_PROGRESS' | 'DONE';

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

export interface QueueStats {
  totalWaiting: number;
  emergencies: number;
  avgWaitMinutes: number;
}

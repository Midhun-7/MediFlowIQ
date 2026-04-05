import axios from 'axios';
import type { QueueEntry, RegisterPatientRequest, QueueStats, Ambulance, AmbulanceStatus } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

export const registerPatient = async (
  data: RegisterPatientRequest
): Promise<QueueEntry> => {
  const res = await api.post<QueueEntry>('/queue/register', data);
  return res.data;
};

export const getQueue = async (): Promise<QueueEntry[]> => {
  const res = await api.get<QueueEntry[]>('/queue');
  return res.data;
};

export const getStats = async (): Promise<QueueStats> => {
  const res = await api.get<QueueStats>('/queue/stats');
  return res.data;
};

export const updateStatus = async (
  patientId: number,
  status: string
): Promise<QueueEntry> => {
  const res = await api.patch<QueueEntry>(`/queue/${patientId}/status`, { status });
  return res.data;
};

// ── Ambulance endpoints ───────────────────────────────────────────
export const getAmbulances = async (): Promise<Ambulance[]> => {
  const res = await api.get<Ambulance[]>('/ambulances');
  return res.data;
};

export const updateAmbulanceStatus = async (
  id: number,
  status: AmbulanceStatus
): Promise<Ambulance> => {
  const res = await api.patch<Ambulance>(`/ambulances/${id}/status`, { status });
  return res.data;
};

export default api;

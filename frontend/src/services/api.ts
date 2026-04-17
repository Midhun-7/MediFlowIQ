import axios from 'axios';
import type {
  QueueEntry, RegisterPatientRequest, QueueStats, Ambulance, AmbulanceStatus,
  AuthResponse, LoginCredentials, AppUserRecord, AuditLogEntry,
} from '../types';

// ── Axios instance ─────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach Bearer token ──────────────────────────────

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('mediflowiq_auth');
  if (raw) {
    try {
      const auth = JSON.parse(raw);
      if (auth?.accessToken) {
        config.headers.Authorization = `Bearer ${auth.accessToken}`;
      }
    } catch { /* ignore parse error */ }
  }
  return config;
});

// ── Response interceptor — handle 401 (token expired) ─────────────────────

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const raw = localStorage.getItem('mediflowiq_auth');
        if (raw) {
          const auth = JSON.parse(raw);
          const { data } = await axios.post<AuthResponse>(
            'http://localhost:8080/api/auth/refresh',
            { refreshToken: auth.refreshToken }
          );
          const updated = {
            ...auth,
            accessToken:  data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt:    Date.now() + data.expiresIn * 1000,
          };
          localStorage.setItem('mediflowiq_auth', JSON.stringify(updated));
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        }
      } catch {
        localStorage.removeItem('mediflowiq_auth');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth endpoints ─────────────────────────────────────────────────────────

export const login = async (creds: LoginCredentials): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/auth/login', creds);
  return res.data;
};

export const refreshToken = async (token: string): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/auth/refresh', { refreshToken: token });
  return res.data;
};

// ── Queue endpoints ────────────────────────────────────────────────────────

export const registerPatient = async (data: RegisterPatientRequest): Promise<QueueEntry> => {
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

// ── Ambulance endpoints ────────────────────────────────────────────────────

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

// ── Admin endpoints ────────────────────────────────────────────────────────

export const getUsers = async (): Promise<AppUserRecord[]> => {
  const res = await api.get<AppUserRecord[]>('/admin/users');
  return res.data;
};

export const toggleUser = async (id: number, enabled: boolean): Promise<void> => {
  await api.patch(`/admin/users/${id}/enable`, { enabled });
};

export const resetPassword = async (id: number, password: string): Promise<void> => {
  await api.patch(`/admin/users/${id}/password`, { password });
};

export const registerUser = async (payload: {
  username: string;
  password: string;
  fullName: string;
  role: string;
}): Promise<void> => {
  await api.post('/auth/register', payload);
};

export const getAuditLogs = async (): Promise<AuditLogEntry[]> => {
  const res = await api.get<AuditLogEntry[]>('/admin/audit-logs');
  return res.data;
};

export default api;

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../services/api';
import { DoctorSidebar } from '../components/DoctorSidebar';
import { EmptyState } from '../components/EmptyState';

// ── Status badge ─────────────────────────────────────────────────────────────

const statusBadgeColors: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700 border-amber-200',
  COMPLETED: 'bg-blue-100 text-blue-700 border-blue-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const badgeClass = statusBadgeColors[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${badgeClass}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

// ── Date Formatter Helper ────────────────────────────────────────────────────

const formatAppointmentDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const isToday = d.toDateString() === today.toDateString();
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Today at ${timeStr}`;
  }
  if (isTomorrow) {
    return `Tomorrow at ${timeStr}`;
  }
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at ${timeStr}`;
};

// ── Doctor Dashboard ─────────────────────────────────────────────────────────

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');

  const [filterMode, setFilterMode] = useState<'today' | 'upcoming'>(
    viewParam === 'upcoming' || viewParam === 'all' ? 'upcoming' : 'today'
  );

  const getAccessToken = () => {
    const raw = localStorage.getItem('mediflowiq_auth');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.accessToken) return parsed.accessToken;
      } catch { /* ignore */ }
    }
    return localStorage.getItem('token') ?? '';
  };
  const token = getAccessToken();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState<number | null>(null);

  // Sync state with URL view parameter
  useEffect(() => {
    setFilterMode(viewParam === 'upcoming' || viewParam === 'all' ? 'upcoming' : 'today');
  }, [viewParam]);

  const handleTabChange = (mode: 'today' | 'upcoming') => {
    setFilterMode(mode);
    if (mode === 'upcoming') {
      setSearchParams({ view: 'upcoming' });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    fetch(`${API_BASE}/discovery/hospitals`).catch(() => {});
    fetch(`${API_BASE}/discovery/doctors`)
      .then(r => r.json())
      .then(docs => setDoctors(Array.isArray(docs) ? docs : []))
      .catch(() => {});
  }, []);

  const fetchAppointments = useCallback(() => {
    setError('');
    const params = new URLSearchParams();
    if (selectedDoctorId === 'all') {
      params.append('allDoctors', 'true');
    } else if (selectedDoctorId) {
      params.append('doctorId', selectedDoctorId);
    }

    if (filterMode === 'today') {
      params.append('today', 'true');
    } else {
      params.append('today', 'false');
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    fetch(`${API_BASE}/appointments${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async r => {
        if (!r.ok) {
          const msg = await r.text();
          throw new Error(msg || `Error ${r.status}`);
        }
        return r.json();
      })
      .then(setAppointments)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, selectedDoctorId, filterMode]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Filter appointments based on view mode (Today vs Upcoming from tomorrow onwards)
  const displayedAppointments = appointments.filter((appt: any) => {
    if (filterMode === 'upcoming') {
      if (!appt.scheduledAt) return true;
      const apptTime = new Date(appt.scheduledAt).getTime();
      const startOfTomorrow = new Date();
      startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
      startOfTomorrow.setHours(0, 0, 0, 0);
      return apptTime >= startOfTomorrow.getTime();
    }
    return true;
  });

  const handleComplete = async (apptId: number) => {
    setCompleting(apptId);
    try {
      const res = await fetch(`${API_BASE}/appointments/${apptId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to mark as attended');
      fetchAppointments();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCompleting(null);
    }
  };

  const handleWritePrescription = (appt: any) => {
    const patientId = appt.patientAccountId ?? appt.patientAccount?.id ?? '';
    const hospitalId = appt.hospital?.id ?? '';
    navigate(`/doctor/prescriptions?patientId=${patientId}&hospitalId=${hospitalId}&appointmentId=${appt.id}`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <DoctorSidebar active="/doctor/dashboard" />

      <main className="ml-60 flex-1 h-screen flex flex-col p-6 md:p-8 overflow-hidden box-border">
        {/* Header */}
        <div className="flex justify-between items-center mb-5 flex-wrap gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 m-0">
              {filterMode === 'today' ? "📅 Today's Appointments" : "🗓️ Upcoming Appointments"}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1 m-0">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            {/* View Mode Tabs */}
            <div className="flex bg-slate-200/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleTabChange('today')}
                className={`border-none rounded-lg px-3.5 py-1.5 text-xs md:text-sm transition-all cursor-pointer ${
                  filterMode === 'today'
                    ? 'bg-white font-bold text-slate-900 shadow-sm'
                    : 'bg-transparent font-medium text-slate-600 hover:text-slate-900'
                }`}
              >
                📅 Today
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('upcoming')}
                className={`border-none rounded-lg px-3.5 py-1.5 text-xs md:text-sm transition-all cursor-pointer ${
                  filterMode === 'upcoming'
                    ? 'bg-white font-bold text-slate-900 shadow-sm'
                    : 'bg-transparent font-medium text-slate-600 hover:text-slate-900'
                }`}
              >
                🗓️ Upcoming
              </button>
            </div>

            {/* Doctor Filter Dropdown */}
            {doctors.length > 0 && (
              <select
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs md:text-sm font-semibold text-slate-700 cursor-pointer outline-none focus:border-indigo-500"
              >
                <option value="">👤 My Appointments</option>
                <option value="all">🏥 All Doctors (Clinic Overview)</option>
                {doctors.map(d => {
                  const docDisplayName = d.name?.startsWith('Dr.') ? d.name : `Dr. ${d.name}`;
                  return (
                    <option key={d.id} value={d.id}>
                      {docDisplayName} ({d.specialty})
                    </option>
                  );
                })}
              </select>
            )}

            <button
              onClick={fetchAppointments}
              className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs md:text-sm font-semibold text-slate-700 cursor-pointer transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Scrollable Appointments Container */}
        <div className="flex-1 overflow-y-auto pr-1 pb-8 flex flex-col">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl text-red-700 p-3.5 mb-5 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex justify-center items-center p-16">
              <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
            </div>
          ) : displayedAppointments.length === 0 ? (
            <EmptyState
              icon="🗓️"
              title={filterMode === 'today' ? "No Appointments Scheduled Today" : "No Upcoming Appointments Found"}
              description={
                filterMode === 'today'
                  ? "There are no consultations scheduled for today under this filter. Switch to Upcoming to view bookings for tomorrow and beyond."
                  : "No upcoming appointment bookings were found for the selected filter."
              }
              actionLabel={filterMode === 'today' ? "🗓️ View Upcoming Appointments" : undefined}
              onAction={filterMode === 'today' ? () => handleTabChange('upcoming') : undefined}
            />
          ) : (
            <div className="flex flex-col gap-3.5">
              {displayedAppointments.map((appt: any) => {
                const patientName = appt.patientName || appt.patientAccount?.fullName || appt.patientAccount?.name || (appt.patientAccountId ? `Patient #${appt.patientAccountId}` : 'Patient');
                const patientEmail = appt.patientEmail || appt.patientAccount?.email || '';
                const patientPhone = appt.patientPhone || appt.patientAccount?.phone || '';
                const avatarInitial = patientName.replace(/^Patient\s*#?/, '').trim().charAt(0).toUpperCase() || 'P';

                return (
                  <div key={appt.id} className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-sm flex justify-between items-center flex-wrap gap-4 transition-all hover:border-slate-300">
                    {/* Left: patient + time info */}
                    <div className="flex-1 min-w-[240px]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm">
                          {avatarInitial}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-base">{patientName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {patientEmail || (patientPhone ? `📞 ${patientPhone}` : (appt.patientAccountId ? `Patient ID #${appt.patientAccountId}` : ''))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2.5 mt-2.5">
                        <div className="text-xs font-semibold text-slate-800 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1">
                          🕐 {formatAppointmentDate(appt.scheduledAt)}
                        </div>
                        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 font-medium">
                          {appt.appointmentType === 'TELEMEDICINE' ? '📹 Telemedicine' : '🏥 In-Person'}
                        </div>
                        {appt.doctor?.name && (
                          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 font-medium">
                            👨‍⚕️ {appt.doctor.name.startsWith('Dr.') ? appt.doctor.name : `Dr. ${appt.doctor.name}`} ({appt.doctor.specialty ?? 'General'})
                          </div>
                        )}
                        {appt.hospital?.name && (
                          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 font-medium">
                            🏥 {appt.hospital.name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: status + actions */}
                    <div className="flex flex-col items-end gap-2.5">
                      <StatusBadge status={appt.status} />

                      {appt.status === 'CONFIRMED' && (
                        <div className="flex gap-2 items-center flex-wrap justify-end">
                          <button
                            onClick={() => handleWritePrescription(appt)}
                            className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold rounded-xl px-4 py-2 text-xs md:text-sm shadow-md shadow-sky-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            🩺 Attend Patient
                          </button>
                          <button
                            disabled={completing === appt.id}
                            onClick={() => handleComplete(appt.id)}
                            title="Mark attended without prescribing medicines"
                            className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 cursor-pointer transition-colors"
                          >
                            {completing === appt.id ? 'Marking…' : 'Quick Complete (No Rx)'}
                          </button>
                        </div>
                      )}

                      {appt.status === 'COMPLETED' && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            ✓ Attended
                          </span>
                          <button
                            onClick={() => handleWritePrescription(appt)}
                            className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 cursor-pointer transition-colors"
                          >
                            + Add Rx
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

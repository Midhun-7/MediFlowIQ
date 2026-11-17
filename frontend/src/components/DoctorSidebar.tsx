import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const DOCTOR_NAV = [
  { icon: '📅', label: "Appointments", path: '/doctor/dashboard' },
  { icon: '💊', label: 'Write Prescription', path: '/doctor/prescriptions' },
];

export const DoctorSidebar: React.FC<{ active?: string }> = ({ active }) => {
  const navigate = useNavigate();
  const location = useLocation();

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

  // Resolve display name from JWT payload
  const doctorName = (() => {
    try {
      const raw = localStorage.getItem('mediflowiq_auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.fullName) return parsed.fullName;
      }
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.fullName ?? payload.name ?? payload.sub ?? 'Doctor';
    } catch { return 'Doctor'; }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('mediflowiq_auth');
    navigate('/login');
  };

  return (
    <aside className="w-60 h-screen bg-slate-900 flex flex-col py-6 fixed left-0 top-0 bottom-0 shadow-2xl z-50">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 pb-6 border-b border-white/10 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-xl shadow-md">
          🏥
        </div>
        <div>
          <div className="text-lg font-bold text-white">
            MediFlow<span className="text-sky-400">IQ</span>
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Doctor Portal
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3">
        {DOCTOR_NAV.map(item => {
          const isActive = active
            ? active.startsWith(item.path)
            : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400 border-l-4 border-indigo-400 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-lg w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Doctor User Footer */}
      <div className="p-4 border-t border-white/10 mt-auto">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {doctorName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="text-xs font-semibold text-white truncate">
              {doctorName}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
              Verified Doctor
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg py-2 text-xs font-semibold cursor-pointer transition-colors"
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
};

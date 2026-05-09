import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientAuth } from '../contexts/PatientAuthContext';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../services/api';

type Role = 'PATIENT' | 'DOCTOR' | 'STAFF' | 'ADMIN';

const ROLE_OPTIONS: { value: Role; label: string; icon: string; desc: string }[] = [
  { value: 'PATIENT',  icon: '🧑‍💼', label: 'Patient',       desc: 'View records, prescriptions & book appointments' },
  { value: 'DOCTOR',   icon: '👨‍⚕️', label: 'Doctor',        desc: 'Write prescriptions, manage patients' },
  { value: 'STAFF',    icon: '🏥',   label: 'Hospital Staff', desc: 'Manage patient queue and registrations' },
  { value: 'ADMIN',    icon: '⚙️',   label: 'Administrator',  desc: 'Full system access and user management' },
];

export const UnifiedLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login: patientLogin } = usePatientAuth();
  const { login: staffLoginCtx } = useAuth();

  const [role, setRole] = useState<Role>('PATIENT');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [nmcUid, setNmcUid] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isPatient = role === 'PATIENT';
  const isDoctor  = role === 'DOCTOR';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isPatient) {
        // Patient auth — email based
        const res = await fetch(`${API_BASE}/patient/auth/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifier, password }),
        });
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Invalid credentials'); }
        const data = await res.json();
        patientLogin(data.token, { patientId: data.patientId, fullName: data.fullName, email: data.email, role: 'PATIENT' });
        navigate('/patient/dashboard');
      } else {
        // Staff/Doctor/Admin auth — pass credentials to AuthContext.login (handles API + storage)
        await staffLoginCtx({ username: identifier, password, ...(isDoctor ? { nmcUid } : {}) });
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const selected = ROLE_OPTIONS.find(r => r.value === role)!;

  return (
    <div style={s.page}>
      {/* Decorative background */}
      <div style={s.bgGrad} />
      <div style={s.blob1} />
      <div style={s.blob2} />

      <div style={s.wrapper}>
        {/* Left panel */}
        <div style={s.leftPanel}>
          <div style={s.brandRow}>
            <div style={s.brandIcon}>🏥</div>
            <div>
              <div style={s.brandName}>MediFlow<span style={{ color: '#38BDF8' }}>IQ</span></div>
              <div style={s.brandTag}>Hospital Intelligence Platform</div>
            </div>
          </div>
          <h2 style={s.leftTitle}>India's Most Advanced<br />Healthcare Platform</h2>
          <p style={s.leftSub}>Real-time queues · Digital prescriptions · Smart appointment booking · AI-powered routing</p>

          <div style={s.featureList}>
            {[
              { icon: '🔒', text: 'HIPAA Compliant & Encrypted' },
              { icon: '🩺', text: 'NMC-verified Doctor Authentication' },
              { icon: '💊', text: 'Digital Prescription Portal' },
              { icon: '📅', text: 'Razorpay-powered Booking' },
              { icon: '📡', text: 'Real-time WebSocket Notifications' },
            ].map(f => (
              <div key={f.text} style={s.feature}>
                <span>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          <div style={s.compliance}>
            🏛️ Compliant with NMC Act 2020 · IT Act 2000 · DPDP Bill 2023
          </div>
        </div>

        {/* Right card */}
        <div style={s.card}>
          <h1 style={s.cardTitle}>Welcome back</h1>
          <p style={s.cardSub}>Sign in to your {selected.label} account</p>

          {/* Role selector */}
          <div style={s.roleGrid}>
            {ROLE_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => { setRole(opt.value); setError(''); setNmcUid(''); }}
                style={{ ...s.roleChip, ...(role === opt.value ? s.roleChipActive : {}) }}>
                <span style={s.roleIcon}>{opt.icon}</span>
                <span style={s.roleLabel}>{opt.label}</span>
              </button>
            ))}
          </div>

          <div style={s.roleBanner}>
            <span style={{ fontSize: '1.1rem' }}>{selected.icon}</span>
            <span style={s.roleBannerText}>{selected.desc}</span>
          </div>

          {error && (
            <div style={s.errBox}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={s.label}>{isPatient ? 'Email Address' : 'Username'}</label>
              <input
                id="unified-identifier"
                type={isPatient ? 'email' : 'text'}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder={isPatient ? 'you@example.com' : 'e.g. dr.smith'}
                required
                style={s.input}
                onFocus={e => (e.target.style.borderColor = '#0EA5E9')}
                onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
              />
            </div>

            <div>
              <label style={s.label}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="unified-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{ ...s.input, paddingRight: '3rem' }}
                  onFocus={e => (e.target.style.borderColor = '#0EA5E9')}
                  onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* NMC UID field — only for DOCTOR */}
            {isDoctor && (
              <div style={s.nmcBox}>
                <div style={s.nmcHeader}>
                  <span style={s.nmcBadge}>🔐 NMC Verification Required</span>
                </div>
                <label style={s.label}>NMC Unique ID (UID)
                  <a href="https://www.nmc.org.in" target="_blank" rel="noreferrer" style={s.nmcLink}>What is NMC UID? ↗</a>
                </label>
                <input
                  id="nmc-uid"
                  type="text"
                  value={nmcUid}
                  onChange={e => setNmcUid(e.target.value)}
                  placeholder="e.g. NMC1001234"
                  required
                  maxLength={20}
                  style={s.input}
                  onFocus={e => (e.target.style.borderColor = '#0EA5E9')}
                  onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
                />
                <p style={s.nmcHint}>
                  Issued by the National Medical Commission of India. Required to prevent unauthorized access to clinical systems.
                </p>
              </div>
            )}

            <button id="unified-login-btn" type="submit" disabled={loading}
              style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}>
              {loading ? '🔄 Signing in…' : `${selected.icon} Sign in as ${selected.label}`}
            </button>
          </form>

          {isPatient && (
            <p style={s.registerText}>
              New patient?{' '}
              <a href="/patient/register" style={s.link}>Create account →</a>
            </p>
          )}

          <div style={s.trustRow}>
            {['🔒 256-bit SSL', '🛡️ HIPAA Compliant', '🏛️ NMC Verified'].map(b => (
              <span key={b} style={s.trustBadge}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#0A0F1E', position: 'relative', overflow: 'hidden',
    fontFamily: "'Inter', sans-serif", padding: '2rem',
  },
  bgGrad: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse 80% 50% at 20% 40%, rgba(14,165,233,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(16,185,129,0.06) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  blob1: { position: 'absolute', top: '-15%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)', pointerEvents: 'none' },
  blob2: { position: 'absolute', bottom: '-15%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' },
  wrapper: { display: 'flex', gap: '4rem', alignItems: 'center', maxWidth: 1000, width: '100%', zIndex: 1, flexWrap: 'wrap', justifyContent: 'center' },
  // Left panel
  leftPanel: { flex: '0 0 360px', color: 'white' },
  brandRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' },
  brandIcon: { width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', boxShadow: '0 4px 15px rgba(14,165,233,0.3)' },
  brandName: { fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' },
  brandTag: { fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.1rem' },
  leftTitle: { fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem', color: 'white' },
  leftSub: { fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.6, marginBottom: '2rem' },
  featureList: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' },
  feature: { display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: '#CBD5E1' },
  compliance: { fontSize: '0.72rem', color: '#475569', padding: '0.6rem 0.9rem', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)' },
  // Right card
  card: { flex: '0 0 420px', background: 'white', borderRadius: 24, padding: '2.25rem', boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)', width: '100%', maxWidth: 420 },
  cardTitle: { fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' },
  cardSub: { color: '#64748B', fontSize: '0.875rem', marginBottom: '1.5rem' },
  // Role selector
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' },
  roleChip: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.65rem', borderRadius: 12, border: '1.5px solid #E2E8F0', background: 'white', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' },
  roleChipActive: { borderColor: '#0EA5E9', background: '#F0F9FF', boxShadow: '0 0 0 3px rgba(14,165,233,0.15)' },
  roleIcon: { fontSize: '1.2rem' },
  roleLabel: { fontSize: '0.75rem', fontWeight: 600, color: '#374151' },
  roleBanner: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '0.6rem 0.9rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#0369A1' },
  roleBannerText: { fontWeight: 500 },
  errBox: { background: '#FFF0F0', border: '1px solid #FECDD3', borderRadius: 10, color: '#BE123C', padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '0.5rem' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' },
  input: { width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', color: '#0F172A', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  // NMC box
  nmcBox: { background: 'linear-gradient(135deg, #FFFBEB, #FFF7ED)', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  nmcHeader: { marginBottom: '0.25rem' },
  nmcBadge: { background: '#FEF3C7', color: '#92400E', borderRadius: 99, padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 700 },
  nmcLink: { fontSize: '0.75rem', color: '#0EA5E9', textDecoration: 'none', fontWeight: 500 },
  nmcHint: { fontSize: '0.72rem', color: '#78716C', lineHeight: 1.5, margin: 0 },
  btn: { background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', color: 'white', border: 'none', borderRadius: 12, padding: '0.9rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(14,165,233,0.35)', fontFamily: 'inherit', marginTop: '0.25rem' },
  registerText: { textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#64748B' },
  link: { color: '#0EA5E9', fontWeight: 600, textDecoration: 'none' },
  trustRow: { display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.5rem' },
  trustBadge: { background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 99, padding: '0.25rem 0.65rem', fontSize: '0.7rem', color: '#475569', fontWeight: 500 },
};

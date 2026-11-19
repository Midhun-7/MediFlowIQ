import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { usePatientAuth } from '../contexts/PatientAuthContext';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../services/api';

type Role = 'PATIENT' | 'DOCTOR' | 'STAFF' | 'ADMIN';

interface RoleOption {
  value: Role;
  label: string;
  icon: string;
  tagline: string;
  placeholder: string;
  defaultId?: string;
  defaultPass?: string;
  defaultNmc?: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'PATIENT',
    label: 'Patient',
    icon: '👤',
    tagline: 'Access medical history, prescriptions & book appointments',
    placeholder: 'Enter patient username or email (e.g. midhun)',
    defaultId: 'midhun',
    defaultPass: 'Patient@123',
  },
  {
    value: 'DOCTOR',
    label: 'Doctor',
    icon: '🩺',
    tagline: 'Manage appointments, patient diagnoses & write digital prescriptions',
    placeholder: 'Enter doctor username (e.g. drsmith)',
    defaultId: 'drsmith',
    defaultPass: 'Doctor@123',
    defaultNmc: 'NMC1001234',
  },
  {
    value: 'STAFF',
    label: 'Hospital Staff',
    icon: '🏥',
    tagline: 'Coordinate ER admissions, triage queue & dispatch ambulances',
    placeholder: 'Enter staff username',
    defaultId: 'nurse1',
    defaultPass: 'Staff@123',
  },
  {
    value: 'ADMIN',
    label: 'Administrator',
    icon: '⚙️',
    tagline: 'System operations, hospital network & audit logs',
    placeholder: 'Enter administrator username',
    defaultId: 'admin',
    defaultPass: 'Admin@123',
  },
];

export const UnifiedLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: patientLogin } = usePatientAuth();
  const { login: staffLoginCtx } = useAuth();

  const [role, setRole] = useState<Role>('PATIENT');
  const [identifier, setIdentifier] = useState('midhun');
  const [password, setPassword] = useState('Patient@123');
  const [nmcUid, setNmcUid] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    if (location.state && (location.state as any).registered) {
      setRegisteredSuccess(true);
      setRole('PATIENT');
      setIdentifier('');
      setPassword('');
      setNmcUid('');
      // Clear the history state immediately so page refreshes or future visits don't persist it
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state]);

  const isPatient = role === 'PATIENT';
  const isDoctor = role === 'DOCTOR';
  const selectedRole = ROLE_OPTIONS.find(r => r.value === role)!;

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setError('');
    if (newRole !== 'PATIENT') {
      setRegisteredSuccess(false);
    }
    // Auto-fill default credentials for the selected role
    const opt = ROLE_OPTIONS.find(r => r.value === newRole);
    if (opt) {
      setIdentifier(opt.defaultId || '');
      setPassword(opt.defaultPass || '');
      setNmcUid(opt.defaultNmc || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isPatient) {
        // Patient auth endpoint
        const res = await fetch(`${API_BASE}/patient/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifier.trim(), password }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Invalid email or password');
        }

        const data = await res.json();
        patientLogin(data.token, {
          patientId: data.patientId,
          fullName: data.fullName,
          email: data.email,
          role: 'PATIENT',
        });
        navigate('/patient/dashboard');
      } else {
        // Staff/Doctor/Admin auth
        await staffLoginCtx({
          username: identifier.trim(),
          password,
          ...(isDoctor ? { nmcUid: nmcUid.trim() } : {}),
        });

        if (isDoctor) {
          navigate('/doctor/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed. Please verify credentials.';
      // Smart recovery if Doctor NMC UID is required
      if (msg.toLowerCase().includes('nmc uid')) {
        setRole('DOCTOR');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={css.container}>
      {/* Background Ambience */}
      <div style={css.glowCircle1} />
      <div style={css.glowCircle2} />

      <div style={css.shell}>
        {/* Left Showcase (Responsive: hidden or top on tiny, full width on desktop) */}
        <div style={css.showcase}>
          <div style={css.brandBadge}>
            <div style={css.brandIcon}>🏥</div>
            <div>
              <div style={css.brandTitle}>MediFlow<span style={{ color: '#38BDF8' }}>IQ</span></div>
              <div style={css.brandSubtitle}>Centralized Hospital Coordination System</div>
            </div>
          </div>

          <h1 style={css.heroHeading}>
            Intelligent Care Coordination <br />
            <span style={css.gradientText}>Made Seamless</span>
          </h1>

          <p style={css.heroText}>
            Unified hospital operations connecting emergency ambulances, real-time triage queue,
            digital prescriptions, and patient care portals.
          </p>

          <div style={css.featureGrid}>
            <div style={css.featureCard}>
              <div style={css.featureIcon}>⚡</div>
              <div>
                <div style={css.featureTitle}>Real-time ER Triage</div>
                <div style={css.featureDesc}>Live STOMP WebSocket queue balancing and emergency tracking</div>
              </div>
            </div>

            <div style={css.featureCard}>
              <div style={css.featureIcon}>🩺</div>
              <div>
                <div style={css.featureTitle}>NMC Verified Practice</div>
                <div style={css.featureDesc}>National Medical Commission credential verification for doctors</div>
              </div>
            </div>

            <div style={css.featureCard}>
              <div style={css.featureIcon}>🚑</div>
              <div>
                <div style={css.featureTitle}>Fleet GPS Dispatch</div>
                <div style={css.featureDesc}>Live driver telemetry and automated distance routing</div>
              </div>
            </div>
          </div>

          <div style={css.complianceTag}>
            🔒 End-to-end encrypted · HIPAA Privacy Rule · DPDP Act 2023 · ISO 27001 Certified
          </div>
        </div>

        {/* Right Authentication Card */}
        <div style={css.authCard}>
          {/* Header */}
          <div style={css.cardHeader}>
            <h2 style={css.loginTitle}>Welcome Back</h2>
            <p style={css.loginSubtitle}>
              Sign in as <strong style={{ color: '#0284C7' }}>{selectedRole.label}</strong>
            </p>
          </div>

          {/* Registration Success Banner */}
          {registeredSuccess && isPatient && (
            <div style={css.successBanner} role="status">
              <span style={{ fontSize: '1.2rem' }}>✅</span>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: '0.15rem' }}>Registration successful!</strong>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                  Your patient account has been created. Sign in with your credentials below.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRegisteredSuccess(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#15803D',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  lineHeight: 1,
                }}
                aria-label="Dismiss banner"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {/* Role Selector Tabs */}
          <div
            role="radiogroup"
            aria-label="Account role selector"
            style={css.roleGroup}
          >
            {ROLE_OPTIONS.map(opt => {
              const active = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => handleRoleChange(opt.value)}
                  style={{
                    ...css.roleTab,
                    ...(active ? css.roleTabActive : {}),
                  }}
                >
                  <span style={css.roleTabIcon}>{opt.icon}</span>
                  <span style={css.roleTabLabel}>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Role Context Bar */}
          <div style={css.roleContextBar}>
            <span style={{ fontSize: '1.05rem' }}>{selectedRole.icon}</span>
            <span style={{ fontSize: '0.82rem', color: '#0369A1', fontWeight: 500, lineHeight: 1.4 }}>
              {selectedRole.tagline}
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div style={css.errorBanner} role="alert">
              <span>⚠️</span>
              <div style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={css.form}>
            {/* Identifier Input */}
            <div style={css.formGroup}>
              <label htmlFor="unified-id-input" style={css.formLabel}>
                {isPatient ? 'Patient Username or Email' : 'Staff / Doctor Username'}
              </label>
              <div style={css.inputWrapper}>
                <span style={css.inputPrefixIcon}>👤</span>
                <input
                  id="unified-id-input"
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder={selectedRole.placeholder}
                  required
                  style={css.input}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={css.formGroup}>
              <div style={css.passwordLabelRow}>
                <label htmlFor="unified-password-input" style={css.formLabel}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={css.forgotBtn}
                >
                  Forgot password?
                </button>
              </div>
              <div style={css.inputWrapper}>
                <span style={css.inputPrefixIcon}>🔒</span>
                <input
                  id="unified-password-input"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{ ...css.input, paddingRight: '2.8rem' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPass(!showPass)}
                  style={css.passToggleBtn}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Doctor NMC Verification Field */}
            {isDoctor && (
              <div style={css.nmcContainer}>
                <div style={css.nmcHeaderRow}>
                  <div style={css.nmcBadge}>
                    <span>🔐</span> NMC Verification
                  </div>
                  <a
                    href="https://www.nmc.org.in"
                    target="_blank"
                    rel="noreferrer"
                    style={css.nmcLink}
                  >
                    What is NMC UID? ↗
                  </a>
                </div>
                <div style={css.inputWrapper}>
                  <span style={css.inputPrefixIcon}>🏛️</span>
                  <input
                    id="doctor-nmc-uid"
                    type="text"
                    value={nmcUid}
                    onChange={e => setNmcUid(e.target.value)}
                    placeholder="Enter NMC Unique ID (e.g. NMC1001234)"
                    required
                    maxLength={20}
                    style={css.input}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="unified-submit-button"
              type="submit"
              disabled={loading}
              style={{
                ...css.submitButton,
                opacity: loading ? 0.75 : 1,
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? (
                <span>🔄 Verifying credentials…</span>
              ) : (
                <span>{selectedRole.icon} Sign in to {selectedRole.label} Portal</span>
              )}
            </button>
          </form>

          {/* Footer Action */}
          <div style={css.cardFooter}>
            {isPatient ? (
              <div>
                Don't have an account?{' '}
                <Link to="/patient/register" style={css.linkAction}>
                  Create patient account →
                </Link>
              </div>
            ) : (
              <div>
                Staff access authorized for hospital personnel only.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={css.modalOverlay} onClick={() => setShowForgotModal(false)}>
          <div style={css.modalBox} onClick={e => e.stopPropagation()}>
            <div style={css.modalHeader}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A' }}>
                🔑 Password Recovery
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={css.modalCloseBtn}
              >
                ✕
              </button>
            </div>
            <div style={css.modalBody}>
              <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                {isPatient
                  ? 'To reset your patient account password, please contact the hospital patient services desk or ask reception to verify your mobile number during your next visit.'
                  : 'For hospital medical staff and administrators, password resets require verification by the IT Hospital Security Administrator under NMC and DPDP compliance.'}
              </p>
              <div style={css.modalContactBox}>
                <div>📞 <strong>Support Desk:</strong> +91 1800-123-FLOW (Toll Free)</div>
                <div style={{ marginTop: '0.3rem' }}>✉️ <strong>Support Email:</strong> support@mediflowiq.internal</div>
              </div>
            </div>
            <div style={css.modalFooter}>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={css.modalDoneBtn}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Styles with cohesive Healthcare UI theme ──────────────────────────────────
const css: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    maxHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    padding: '1.5rem',
    boxSizing: 'border-box',
  },
  glowCircle1: {
    position: 'absolute',
    top: '-15%',
    left: '-10%',
    width: '550px',
    height: '550px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(14, 165, 233, 0.16) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  glowCircle2: {
    position: 'absolute',
    bottom: '-15%',
    right: '-10%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  shell: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3rem',
    width: '100%',
    maxWidth: '1080px',
    zIndex: 1,
    flexWrap: 'wrap',
    maxHeight: '94vh',
  },
  // Showcase section
  showcase: {
    flex: '1 1 400px',
    maxWidth: '480px',
    color: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
  },
  brandBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
  },
  brandIcon: {
    width: '46px',
    height: '46px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    boxShadow: '0 6px 20px rgba(14, 165, 233, 0.38)',
  },
  brandTitle: {
    fontSize: '1.65rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: '#FFFFFF',
  },
  brandSubtitle: {
    fontSize: '0.72rem',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
  },
  heroHeading: {
    fontSize: '1.95rem',
    fontWeight: 800,
    lineHeight: 1.25,
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
    margin: 0,
  },
  gradientText: {
    background: 'linear-gradient(90deg, #38BDF8, #34D399)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroText: {
    color: '#CBD5E1',
    fontSize: '0.9rem',
    lineHeight: 1.55,
    margin: 0,
  },
  featureGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '0.25rem',
  },
  featureCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.8rem',
    padding: '0.75rem 0.95rem',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
  },
  featureIcon: {
    fontSize: '1.2rem',
    padding: '0.2rem',
  },
  featureTitle: {
    fontSize: '0.88rem',
    fontWeight: 700,
    color: '#F1F5F9',
  },
  featureDesc: {
    fontSize: '0.76rem',
    color: '#94A3B8',
    lineHeight: 1.4,
    marginTop: '0.12rem',
  },
  complianceTag: {
    fontSize: '0.72rem',
    color: '#64748B',
    padding: '0.6rem 0.85rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  // Auth Card — Spacious, comfortable, with internal scroll when needed
  authCard: {
    flex: '1 1 380px',
    maxWidth: '450px',
    width: '100%',
    maxHeight: '88vh',
    overflowY: 'auto',
    background: '#FFFFFF',
    borderRadius: '22px',
    padding: '1.85rem 2rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    boxSizing: 'border-box',
  },
  cardHeader: {
    marginBottom: '1rem',
  },
  loginTitle: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  loginSubtitle: {
    fontSize: '0.85rem',
    color: '#64748B',
    marginTop: '0.25rem',
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    background: '#F0FDF4',
    border: '1px solid #BBF7D0',
    color: '#15803D',
    borderRadius: '12px',
    padding: '0.65rem 0.95rem',
    marginBottom: '0.85rem',
    fontSize: '0.82rem',
  },
  roleGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.35rem',
    background: '#F1F5F9',
    padding: '0.3rem',
    borderRadius: '12px',
    marginBottom: '0.75rem',
  },
  roleTab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.18rem',
    padding: '0.5rem 0.3rem',
    borderRadius: '9px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: '#64748B',
    transition: 'all 0.18s ease',
    fontFamily: 'inherit',
  },
  roleTabActive: {
    background: '#FFFFFF',
    color: '#0369A1',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
    fontWeight: 700,
  },
  roleTabIcon: {
    fontSize: '1.15rem',
  },
  roleTabLabel: {
    fontSize: '0.7rem',
    fontWeight: 600,
  },
  roleContextBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    background: '#F0F9FF',
    border: '1px solid #BAE6FD',
    borderRadius: '10px',
    padding: '0.5rem 0.8rem',
    marginBottom: '1rem',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.6rem',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '10px',
    color: '#B91C1C',
    padding: '0.65rem 0.85rem',
    marginBottom: '0.85rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  formLabel: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#334155',
  },
  passwordLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    color: '#0284C7',
    fontSize: '0.76rem',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputPrefixIcon: {
    position: 'absolute',
    left: '0.85rem',
    fontSize: '0.9rem',
    color: '#94A3B8',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '0.65rem 0.95rem 0.65rem 2.5rem',
    borderRadius: '11px',
    border: '1.5px solid #E2E8F0',
    fontSize: '0.88rem',
    color: '#0F172A',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  passToggleBtn: {
    position: 'absolute',
    right: '0.8rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0.2rem',
  },
  nmcContainer: {
    background: '#FFFBEB',
    border: '1.5px solid #FDE68A',
    borderRadius: '12px',
    padding: '0.75rem 0.9rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
  },
  nmcHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nmcBadge: {
    background: '#FEF3C7',
    color: '#92400E',
    borderRadius: '999px',
    padding: '0.18rem 0.6rem',
    fontSize: '0.72rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
  nmcLink: {
    fontSize: '0.72rem',
    color: '#0284C7',
    textDecoration: 'none',
    fontWeight: 600,
  },
  submitButton: {
    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '11px',
    padding: '0.75rem 1rem',
    fontSize: '0.92rem',
    fontWeight: 700,
    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
    fontFamily: 'inherit',
    marginTop: '0.35rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  cardFooter: {
    textAlign: 'center',
    marginTop: '1.1rem',
    fontSize: '0.82rem',
    color: '#64748B',
  },
  linkAction: {
    color: '#0284C7',
    fontWeight: 700,
    textDecoration: 'none',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '1rem',
  },
  modalBox: {
    background: '#FFFFFF',
    borderRadius: '20px',
    maxWidth: '450px',
    width: '100%',
    padding: '1.75rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.1rem',
    cursor: 'pointer',
    color: '#64748B',
  },
  modalBody: {
    marginBottom: '1.5rem',
  },
  modalContactBox: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '0.85rem 1rem',
    fontSize: '0.82rem',
    color: '#1E293B',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  modalDoneBtn: {
    background: '#0284C7',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    padding: '0.6rem 1.25rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

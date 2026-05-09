import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePatientAuth } from '../contexts/PatientAuthContext';
import { API_BASE } from '../services/api';

export const PatientLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = usePatientAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/patient/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(err.message || 'Invalid email or password');
      }
      const data = await res.json();
      login(data.token, { patientId: data.patientId, fullName: data.fullName, email: data.email, role: 'PATIENT' });
      navigate(`/patient/dashboard`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Animated background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2v-5h2v5zm0-7h-2V7h2v2z" fill="white"/>
            </svg>
          </div>
          <span style={styles.logoText}>MediFlow<span style={styles.logoIQ}>IQ</span></span>
        </div>
        <p style={styles.tagline}>Your health, beautifully managed</p>

        <h1 style={styles.heading}>Patient Login</h1>

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              id="patient-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={styles.input}
              onFocus={e => e.target.style.borderColor = '#0EA5E9'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="patient-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{ ...styles.input, paddingRight: '3rem' }}
                onFocus={e => e.target.style.borderColor = '#0EA5E9'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={styles.eyeBtn}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={styles.forgotRow}>
            <Link to="/patient/forgot-password" style={styles.forgotLink}>Forgot Password?</Link>
          </div>

          <button
            id="patient-login-btn"
            type="submit"
            disabled={loading}
            style={{ ...styles.loginBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '🔄 Signing in…' : '🏥 Sign in to Patient Portal'}
          </button>
        </form>

        <p style={styles.registerText}>
          New patient?{' '}
          <Link to="/patient/register" style={styles.registerLink}>Create Account</Link>
        </p>

        {/* Trust badges */}
        <div style={styles.trustRow}>
          {['🔒 HIPAA Compliant', '🛡️ Secure SSL', '🔐 256-bit Encryption'].map(b => (
            <span key={b} style={styles.trustBadge}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 50%, #BAE6FD 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', sans-serif",
  },
  blob1: {
    position: 'absolute', top: '-10%', right: '-5%',
    width: '400px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', bottom: '-10%', left: '-5%',
    width: '350px', height: '350px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 60px rgba(14,165,233,0.12), 0 4px 16px rgba(0,0,0,0.06)',
    border: '1px solid rgba(226,232,240,0.8)',
    position: 'relative',
    zIndex: 1,
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    justifyContent: 'center', marginBottom: '0.5rem',
  },
  logoIcon: {
    width: '48px', height: '48px', borderRadius: '14px',
    background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(14,165,233,0.3)',
  },
  logoText: {
    fontSize: '1.6rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.5px',
  },
  logoIQ: { color: '#0EA5E9' },
  tagline: {
    textAlign: 'center', color: '#64748B', fontSize: '0.875rem',
    marginBottom: '1.75rem', fontStyle: 'italic',
  },
  heading: {
    fontSize: '1.5rem', fontWeight: 700, color: '#0F172A',
    marginBottom: '1.5rem', textAlign: 'center',
  },
  errorBox: {
    background: '#FFF0F0', border: '1px solid #FECDD3', borderRadius: '10px',
    color: '#BE123C', padding: '0.75rem 1rem', marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.875rem', fontWeight: 600, color: '#374151' },
  input: {
    padding: '0.75rem 1rem', borderRadius: '10px',
    border: '1.5px solid #E2E8F0', fontSize: '0.9rem',
    outline: 'none', transition: 'border-color 0.2s',
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
    color: '#0F172A',
  },
  eyeBtn: {
    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem',
  },
  forgotRow: { display: 'flex', justifyContent: 'flex-end' },
  forgotLink: { fontSize: '0.8rem', color: '#0EA5E9', textDecoration: 'none' },
  loginBtn: {
    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
    color: 'white', border: 'none', borderRadius: '12px',
    padding: '0.9rem', fontSize: '1rem', fontWeight: 600,
    cursor: 'pointer', marginTop: '0.5rem',
    boxShadow: '0 4px 15px rgba(14,165,233,0.35)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    fontFamily: 'inherit',
  },
  registerText: { textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#64748B' },
  registerLink: { color: '#0EA5E9', fontWeight: 600, textDecoration: 'none' },
  trustRow: {
    display: 'flex', justifyContent: 'center', gap: '0.5rem',
    flexWrap: 'wrap', marginTop: '1.5rem',
  },
  trustBadge: {
    background: '#F0F9FF', border: '1px solid #BAE6FD',
    borderRadius: '99px', padding: '0.3rem 0.75rem',
    fontSize: '0.7rem', color: '#0369A1', fontWeight: 500,
  },
};

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const PatientRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '',
    dateOfBirth: '', bloodGroup: '', password: '', confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/patient/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, confirm: undefined }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Registration failed'); }
      navigate('/patient/login', { state: { registered: true } });
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}><span style={{ color: 'white', fontSize: '1.3rem' }}>🏥</span></div>
          <span style={styles.logoText}>MediFlow<span style={{ color: '#0EA5E9' }}>IQ</span></span>
        </div>
        <h1 style={styles.heading}>Create Patient Account</h1>
        <p style={styles.sub}>Register to access your digital health records and book appointments</p>

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.grid2}>
            <Field label="Full Name" id="fullName" value={form.fullName} onChange={handleChange('fullName')} required placeholder="Midhun Kumar" />
            <Field label="Email Address" id="email" type="email" value={form.email} onChange={handleChange('email')} required placeholder="you@example.com" />
            <Field label="Phone Number" id="phone" value={form.phone} onChange={handleChange('phone')} placeholder="+91-9876543210" />
            <Field label="Date of Birth" id="dob" type="date" value={form.dateOfBirth} onChange={handleChange('dateOfBirth')} />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Blood Group</label>
            <select id="bloodGroup" value={form.bloodGroup} onChange={handleChange('bloodGroup')} style={styles.select}>
              <option value="">Select blood group</option>
              {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div style={styles.grid2}>
            <Field label="Password" id="password" type="password" value={form.password} onChange={handleChange('password')} required placeholder="Min. 6 characters" />
            <Field label="Confirm Password" id="confirm" type="password" value={form.confirm} onChange={handleChange('confirm')} required placeholder="Re-enter password" />
          </div>

          <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? '🔄 Creating account…' : '✅ Create My Account'}
          </button>
        </form>

        <p style={styles.loginText}>
          Already have an account?{' '}
          <Link to="/patient/login" style={{ color: '#0EA5E9', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; id: string; value: string; onChange: any; required?: boolean; type?: string; placeholder?: string }> =
  ({ label, id, value, onChange, required, type = 'text', placeholder }) => (
    <div style={styles.fieldGroup}>
      <label htmlFor={id} style={styles.label}>{label}{required && ' *'}</label>
      <input id={id} type={type} value={value} onChange={onChange} required={required}
        placeholder={placeholder} style={styles.input}
        onFocus={e => (e.target.style.borderColor = '#0EA5E9')}
        onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
    </div>
  );

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '2rem', fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: 'white', borderRadius: '20px', padding: '2.5rem',
    width: '100%', maxWidth: '560px',
    boxShadow: '0 20px 60px rgba(14,165,233,0.12)',
    border: '1px solid #E2E8F0',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', marginBottom: '0.5rem' },
  logoIcon: {
    width: '44px', height: '44px', borderRadius: '12px',
    background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' },
  heading: { fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', textAlign: 'center', marginTop: '1rem', marginBottom: '0.25rem' },
  sub: { textAlign: 'center', color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' },
  errorBox: {
    background: '#FFF0F0', border: '1px solid #FECDD3', borderRadius: '10px',
    color: '#BE123C', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#374151' },
  input: {
    padding: '0.7rem 0.9rem', borderRadius: '10px', border: '1.5px solid #E2E8F0',
    fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.2s',
    fontFamily: 'inherit', color: '#0F172A', boxSizing: 'border-box', width: '100%',
  },
  select: {
    padding: '0.7rem 0.9rem', borderRadius: '10px', border: '1.5px solid #E2E8F0',
    fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
    background: 'white', color: '#0F172A', width: '100%',
  },
  btn: {
    background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', color: 'white',
    border: 'none', borderRadius: '12px', padding: '0.9rem',
    fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(14,165,233,0.35)', marginTop: '0.5rem',
    fontFamily: 'inherit',
  },
  loginText: { textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#64748B' },
};

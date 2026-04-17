import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ username, password });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)',
      padding: '1rem',
    }}>
      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(3, 105, 161, 0.12)',
        overflow: 'hidden',
        animation: 'fadeIn 0.4s ease-out',
      }}>

        {/* Header stripe */}
        <div style={{
          background: 'linear-gradient(135deg, #0369a1 0%, #0891b2 100%)',
          padding: '2rem 2rem 1.75rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 1rem',
            backdropFilter: 'blur(8px)',
          }}>🏥</div>
          <h1 style={{
            margin: 0, color: 'white',
            fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em',
          }}>MediFlowIQ</h1>
          <p style={{ margin: '0.35rem 0 0', color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}>
            Hospital Coordination System
          </p>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.75rem 2rem 2rem' }}>
          <p style={{
            margin: '0 0 1.5rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}>
            Sign in with your staff credentials
          </p>

          {/* Error banner */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              borderRadius: 8,
              padding: '0.65rem 0.9rem',
              fontSize: '0.8rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Username */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block', fontSize: '0.78rem',
              fontWeight: 600, color: 'var(--text-secondary)',
              marginBottom: '0.45rem', letterSpacing: '0.01em',
            }}>
              USERNAME
            </label>
            <input
              id="login-username"
              className="input"
              type="text"
              autoComplete="username"
              placeholder="e.g. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block', fontSize: '0.78rem',
              fontWeight: 600, color: 'var(--text-secondary)',
              marginBottom: '0.45rem', letterSpacing: '0.01em',
            }}>
              PASSWORD
            </label>
            <input
              id="login-password"
              className="input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary"
            disabled={loading || !username || !password}
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          >
            {loading ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span>
                Signing in…
              </>
            ) : (
              '→ Sign In'
            )}
          </button>

          {/* Dev hints */}
          <div style={{
            marginTop: '1.5rem',
            padding: '0.85rem 1rem',
            background: 'var(--surface-3)',
            borderRadius: 8,
            border: '1px solid var(--border)',
          }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.73rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              DEV CREDENTIALS
            </p>
            {[
              { u: 'admin',   p: 'Admin@123',  r: 'ADMIN' },
              { u: 'drsmith', p: 'Doctor@123', r: 'DOCTOR' },
              { u: 'nurse1',  p: 'Staff@123',  r: 'STAFF' },
            ].map(({ u, p, r }) => (
              <button
                key={u}
                type="button"
                onClick={() => { setUsername(u); setPassword(p); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0.2rem 0', fontSize: '0.75rem',
                  color: 'var(--brand)', fontFamily: 'inherit',
                }}
              >
                {u} / {p} <span style={{ color: 'var(--text-muted)' }}>— {r}</span>
              </button>
            ))}
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

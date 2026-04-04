import { useState } from 'react';
import type { Priority, RegisterPatientRequest } from '../types';
import { registerPatient } from '../services/api';

interface Props {
  onRegistered: () => void;
}

const PRIORITIES: { value: Priority; label: string; desc: string; accentColor: string; bg: string; border: string }[] = [
  { value: 'EMERGENCY', label: '🔴 Emergency', desc: 'Life-threatening / critical', accentColor: '#b91c1c', bg: '#fef2f2', border: '#fca5a5' },
  { value: 'HIGH_RISK', label: '🟠 High Risk', desc: 'Urgent but stable',          accentColor: '#c2410c', bg: '#fff7ed', border: '#fdba74' },
  { value: 'NORMAL',    label: '🟢 Normal',    desc: 'Standard visit',              accentColor: '#15803d', bg: '#f0fdf4', border: '#86efac' },
];

export default function PatientRegistrationForm({ onRegistered }: Props) {
  const [form, setForm] = useState<RegisterPatientRequest>({ name: '', age: 0, priority: 'NORMAL', symptoms: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.name.trim() || form.age <= 0) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const result = await registerPatient(form);
      setSuccess(`Patient registered! Token: ${result.token} · Position #${result.position}`);
      setForm({ name: '', age: 0, priority: 'NORMAL', symptoms: '' });
      onRegistered();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to register patient. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: '8px',
          backgroundColor: '#e0f2fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          flexShrink: 0,
        }}>🏥</div>
        <div>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>Register Patient</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Add patient to queue</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Name */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
            Patient Name <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            className="input"
            type="text"
            placeholder="e.g. Arjun Sharma"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        {/* Age */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
            Age <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            className="input"
            type="number"
            placeholder="e.g. 34"
            min={0}
            max={150}
            value={form.age || ''}
            onChange={e => setForm(f => ({ ...f, age: parseInt(e.target.value) || 0 }))}
            required
          />
        </div>

        {/* Priority */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Priority <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {PRIORITIES.map(p => (
              <label
                key={p.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  border: `1px solid ${form.priority === p.value ? p.border : 'var(--border)'}`,
                  backgroundColor: form.priority === p.value ? p.bg : 'var(--surface-2)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  checked={form.priority === p.value}
                  onChange={() => setForm(f => ({ ...f, priority: p.value }))}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: `2px solid ${form.priority === p.value ? p.accentColor : 'var(--border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {form.priority === p.value && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.accentColor }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: form.priority === p.value ? p.accentColor : 'var(--text)' }}>
                    {p.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
            Symptoms <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
          </label>
          <textarea
            className="input"
            rows={3}
            style={{ resize: 'none' }}
            placeholder="Brief description of symptoms..."
            value={form.symptoms}
            onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
          />
        </div>

        {/* Feedback */}
        {error && (
          <div style={{
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            fontSize: '0.82rem',
          }}>
            {error}
          </div>
        )}
        {success && (
          <div className="animate-fade-in" style={{
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            color: '#15803d',
            fontSize: '0.82rem',
          }}>
            ✅ {success}
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', width: '100%' }} disabled={loading}>
          {loading ? (
            <>
              <span style={{
                width: '1rem',
                height: '1rem',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.6s linear infinite',
              }} />
              Registering...
            </>
          ) : (
            <>➕ Register Patient</>
          )}
        </button>
      </form>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

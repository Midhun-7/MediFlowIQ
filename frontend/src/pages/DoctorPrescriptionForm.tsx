import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../services/api';

interface MedItem { medicationName: string; dosage: string; frequency: string; durationDays: string; instructions: string; }

const emptyMed = (): MedItem => ({ medicationName: '', dosage: '', frequency: '', durationDays: '', instructions: '' });

export const DoctorPrescriptionForm: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token') ?? '';
  const [patients, setPatients] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [form, setForm] = useState({ patientAccountId: '', hospitalId: '', validUntil: '', specialInstructions: '' });
  const [meds, setMeds] = useState<MedItem[]>([emptyMed()]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    fetch(`${API_BASE}/doctor/patients`, { headers: h }).then(r => r.json()).then(setPatients);
    fetch(`${API_BASE}/discovery/hospitals`).then(r => r.json()).then(setHospitals);
  }, []);

  const updateMed = (i: number, field: keyof MedItem, val: string) =>
    setMeds(ms => ms.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  const addMed = () => setMeds(ms => [...ms, emptyMed()]);
  const removeMed = (i: number) => setMeds(ms => ms.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/doctor/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, patientAccountId: Number(form.patientAccountId), hospitalId: Number(form.hospitalId), medications: meds.map(m => ({ ...m, durationDays: Number(m.durationDays) })) }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to save prescription'); }
      setSuccess(true);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  if (success) return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>✅</div>
          <h2 style={{ fontWeight: 700, color: '#0F172A' }}>Prescription Saved!</h2>
          <p style={{ color: '#64748B' }}>The patient will see it immediately in their portal.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button onClick={() => { setSuccess(false); setForm({ patientAccountId: '', hospitalId: '', validUntil: '', specialInstructions: '' }); setMeds([emptyMed()]); }} style={outlineBtn}>Write Another</button>
            <button onClick={() => navigate(-1)} style={primaryBtn}>← Back</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>💊 Write Prescription</h1>
        <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: '1.5rem' }}>This prescription will be instantly visible to the patient in their portal.</p>
        {error && <div style={errBox}>⚠️ {error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={grid2}>
            <div>
              <label style={lbl}>Patient *</label>
              <select required value={form.patientAccountId} onChange={e => setForm(f => ({ ...f, patientAccountId: e.target.value }))} style={sel}>
                <option value="">Select patient…</option>
                {patients.map((p: any) => <option key={p.id} value={p.id}>{p.fullName} ({p.email})</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Hospital *</label>
              <select required value={form.hospitalId} onChange={e => setForm(f => ({ ...f, hospitalId: e.target.value }))} style={sel}>
                <option value="">Select hospital…</option>
                {hospitals.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Valid Until</label>
              <input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} style={inp} />
            </div>
          </div>

          <div>
            <label style={lbl}>Special Instructions</label>
            <textarea value={form.specialInstructions} onChange={e => setForm(f => ({ ...f, specialInstructions: e.target.value }))} rows={2} placeholder="e.g. Take Metformin after meals. Avoid alcohol." style={{ ...inp, resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={{ ...lbl, margin: 0 }}>Medications *</label>
              <button type="button" onClick={addMed} style={{ ...outlineBtn, fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>+ Add Medication</button>
            </div>
            {meds.map((m, i) => (
              <div key={i} style={{ background: '#F8FAFC', borderRadius: 12, padding: '1rem', marginBottom: '0.75rem', border: '1px solid #E2E8F0' }}>
                <div style={grid2}>
                  <InputF label="Medication Name *" value={m.medicationName} onChange={v => updateMed(i, 'medicationName', v)} required placeholder="e.g. Metformin" />
                  <InputF label="Dosage *" value={m.dosage} onChange={v => updateMed(i, 'dosage', v)} required placeholder="e.g. 500mg" />
                  <InputF label="Frequency *" value={m.frequency} onChange={v => updateMed(i, 'frequency', v)} required placeholder="e.g. Twice daily" />
                  <InputF label="Duration (days)" value={m.durationDays} type="number" onChange={v => updateMed(i, 'durationDays', v)} placeholder="e.g. 90" />
                  <InputF label="Instructions" value={m.instructions} onChange={v => updateMed(i, 'instructions', v)} placeholder="e.g. Take after meals" />
                </div>
                {meds.length > 1 && (
                  <button type="button" onClick={() => removeMed(i)} style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>🗑️ Remove</button>
                )}
              </div>
            ))}
          </div>

          <button type="submit" disabled={loading} style={{ ...primaryBtn, opacity: loading ? 0.7 : 1, padding: '0.9rem', fontSize: '1rem' }}>
            {loading ? '🔄 Saving…' : '💊 Save Prescription'}
          </button>
        </form>
      </div>
    </div>
  );
};

const InputF: React.FC<{ label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string; placeholder?: string }> =
  ({ label, value, onChange, required, type = 'text', placeholder }) => (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} style={inp}
        onFocus={e => (e.target.style.borderColor = '#0EA5E9')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
    </div>
  );

const wrap: React.CSSProperties = { minHeight: '100vh', background: '#F8F9FF', padding: '2rem', fontFamily: "'Inter', sans-serif", display: 'flex', justifyContent: 'center' };
const card: React.CSSProperties = { background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 760, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', alignSelf: 'flex-start' };
const lbl: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.4rem' };
const inp: React.CSSProperties = { padding: '0.7rem 0.9rem', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', color: '#0F172A', width: '100%', boxSizing: 'border-box' };
const sel: React.CSSProperties = { ...inp, background: 'white', cursor: 'pointer' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' };
const errBox: React.CSSProperties = { background: '#FFF0F0', border: '1px solid #FECDD3', borderRadius: 10, color: '#BE123C', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' };
const primaryBtn: React.CSSProperties = { background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', color: 'white', border: 'none', borderRadius: 12, padding: '0.6rem 1.25rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
const outlineBtn: React.CSSProperties = { background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '0.6rem 1.25rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' };

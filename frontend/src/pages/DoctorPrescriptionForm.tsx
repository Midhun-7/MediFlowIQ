import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../services/api';

interface MedItem { medicationName: string; dosage: string; frequency: string; durationDays: string; instructions: string; }

const emptyMed = (): MedItem => ({ medicationName: '', dosage: '', frequency: '', durationDays: '', instructions: '' });

export const DoctorPrescriptionForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [patients, setPatients] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);

  // Pre-fill from query params when navigating from Doctor Dashboard
  const prePatientId = searchParams.get('patientId') ?? '';
  const preHospitalId = searchParams.get('hospitalId') ?? '';
  const preAppointmentId = searchParams.get('appointmentId') ?? '';

  const [form, setForm] = useState({ patientAccountId: prePatientId, hospitalId: preHospitalId, validUntil: '', specialInstructions: '' });
  const [meds, setMeds] = useState<MedItem[]>([emptyMed()]);
  const [noMedications, setNoMedications] = useState(false);
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
      if (noMedications) {
        // Complete appointment without issuing prescriptions
        if (preAppointmentId) {
          const res = await fetch(`${API_BASE}/appointments/${preAppointmentId}/complete`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Failed to complete appointment');
        }
      } else {
        const payload: any = {
          ...form,
          validUntil: form.validUntil?.trim() ? form.validUntil.trim() : undefined,
          patientAccountId: Number(form.patientAccountId),
          hospitalId: Number(form.hospitalId),
          appointmentId: preAppointmentId ? Number(preAppointmentId) : undefined,
          medications: meds.filter(m => m.medicationName.trim() !== '').map(m => ({ ...m, durationDays: Number(m.durationDays) || 0 })),
        };
        const res = await fetch(`${API_BASE}/doctor/prescriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to save prescription'); }

        // Also ensure appointment is marked completed
        if (preAppointmentId) {
          await fetch(`${API_BASE}/appointments/${preAppointmentId}/complete`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
      }

      setSuccess(true);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  if (success) return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>✅</div>
          <h2 style={{ fontWeight: 700, color: '#0F172A' }}>
            {noMedications ? 'Consultation Completed!' : 'Prescription Saved & Attended!'}
          </h2>
          <p style={{ color: '#64748B', maxWidth: 440, margin: '0.5rem auto 1.5rem' }}>
            {preAppointmentId
              ? 'The appointment has been marked as completed and sent to the patient portal in real time.'
              : 'The prescription has been added to the patient records.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button onClick={() => navigate('/doctor/dashboard')} style={primaryBtn}>← Back to Appointments</button>
            <button onClick={() => { setSuccess(false); setForm({ patientAccountId: '', hospitalId: '', validUntil: '', specialInstructions: '' }); setMeds([emptyMed()]); }} style={outlineBtn}>Write Another</button>
          </div>
        </div>
      </div>
    </div>
  );

  const selectedPatient = patients.find(p => String(p.id) === String(form.patientAccountId));

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            {preAppointmentId ? '🩺 Patient Consultation' : '💊 Write Prescription'}
          </h1>
          <button onClick={() => navigate('/doctor/dashboard')} style={outlineBtn}>✕ Cancel</button>
        </div>
        <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Record doctor advice, prescribe medications, and complete the visit.
        </p>

        {selectedPatient && (
          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0EA5E9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {selectedPatient.fullName?.charAt(0) ?? 'P'}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>{selectedPatient.fullName}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                {selectedPatient.email} {selectedPatient.bloodGroup ? `• Blood Group: ${selectedPatient.bloodGroup}` : ''}
              </div>
            </div>
          </div>
        )}

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
          </div>

          <div>
            <label style={lbl}>Clinical Notes / Doctor Advice</label>
            <textarea
              value={form.specialInstructions}
              onChange={e => setForm(f => ({ ...f, specialInstructions: e.target.value }))}
              rows={3}
              placeholder="e.g. Patient advised bed rest for 2 days. Normal blood pressure. Revisit after 1 week if symptoms persist."
              style={{ ...inp, resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Routine Checkup toggle */}
          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '0.75rem 1rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="checkbox"
              id="noMeds"
              checked={noMedications}
              onChange={e => setNoMedications(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="noMeds" style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600, cursor: 'pointer' }}>
              No medications needed (General checkup / All clear)
            </label>
          </div>

          {!noMedications && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ ...lbl, margin: 0 }}>Medications</label>
                <button type="button" onClick={addMed} style={{ ...outlineBtn, fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>+ Add Medication</button>
              </div>
              {meds.map((m, i) => (
                <div key={i} style={{ background: '#F8FAFC', borderRadius: 12, padding: '1rem', marginBottom: '0.75rem', border: '1px solid #E2E8F0' }}>
                  <div style={grid2}>
                    <InputF label="Medication Name *" value={m.medicationName} onChange={v => updateMed(i, 'medicationName', v)} required={!noMedications} placeholder="e.g. Paracetamol" />
                    <InputF label="Dosage *" value={m.dosage} onChange={v => updateMed(i, 'dosage', v)} required={!noMedications} placeholder="e.g. 500mg" />
                    <InputF label="Frequency *" value={m.frequency} onChange={v => updateMed(i, 'frequency', v)} required={!noMedications} placeholder="e.g. Twice daily" />
                    <InputF label="Duration (days)" value={m.durationDays} type="number" onChange={v => updateMed(i, 'durationDays', v)} placeholder="e.g. 5" />
                    <InputF label="Instructions" value={m.instructions} onChange={v => updateMed(i, 'instructions', v)} placeholder="e.g. After food" />
                  </div>
                  {meds.length > 1 && (
                    <button type="button" onClick={() => removeMed(i)} style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>🗑️ Remove</button>
                  )}
                </div>
              ))}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ ...primaryBtn, opacity: loading ? 0.7 : 1, padding: '0.9rem', fontSize: '1rem', width: '100%' }}>
            {loading ? '🔄 Completing…' : noMedications ? '✅ Complete Consultation' : '✅ Complete Consultation & Send Prescription'}
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

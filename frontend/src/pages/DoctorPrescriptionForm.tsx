import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../services/api';
import { DoctorSidebar } from '../components/DoctorSidebar';

interface MedItem {
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: string;
  instructions: string;
}

const emptyMed = (): MedItem => ({
  medicationName: '',
  dosage: '',
  frequency: '',
  durationDays: '',
  instructions: '',
});

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

  const [form, setForm] = useState({
    patientAccountId: prePatientId,
    hospitalId: preHospitalId,
    validUntil: '',
    specialInstructions: '',
  });
  const [meds, setMeds] = useState<MedItem[]>([emptyMed()]);
  const [noMedications, setNoMedications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API_BASE}/doctor/patients`, { headers })
      .then(r => r.json())
      .then(data => setPatients(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch(`${API_BASE}/discovery/hospitals`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setHospitals(list);
        if (!preHospitalId && list.length > 0) {
          setForm(f => ({ ...f, hospitalId: String(list[0].id) }));
        }
      })
      .catch(() => {});
  }, [token, preHospitalId]);

  const updateMed = (i: number, field: keyof MedItem, val: string) =>
    setMeds(ms => ms.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)));
  const addMed = () => setMeds(ms => [...ms, emptyMed()]);
  const removeMed = (i: number) => setMeds(ms => ms.filter((_, idx) => idx !== i));

  const handleClear = () => {
    setForm(f => ({
      ...f,
      specialInstructions: '',
      validUntil: '',
      ...(!prePatientId ? { patientAccountId: '' } : {}),
      ...(!preHospitalId ? { hospitalId: hospitals[0]?.id ? String(hospitals[0].id) : '' } : {}),
    }));
    setMeds([emptyMed()]);
    setNoMedications(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
          medications: meds
            .filter(m => m.medicationName.trim() !== '')
            .map(m => ({
              ...m,
              durationDays: Number(m.durationDays) || 0,
            })),
        };

        const res = await fetch(`${API_BASE}/doctor/prescriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to save prescription');
        }

        // Also ensure appointment is marked completed
        if (preAppointmentId) {
          await fetch(`${API_BASE}/appointments/${preAppointmentId}/complete`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the prescription');
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => String(p.id) === String(form.patientAccountId));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* Sidebar with active link set to /doctor/prescriptions */}
      <DoctorSidebar active="/doctor/prescriptions" />

      {/* Main Container */}
      <main className="ml-60 flex-1 h-screen flex flex-col px-6 md:px-8 pt-5 md:pt-6 pb-3.5 md:pb-4 overflow-hidden box-border">
        {/* Header Bar */}
        <div className="mb-3.5 shrink-0">
          <div className="flex items-center gap-1.5 mb-1">
            <button
              type="button"
              onClick={() => navigate('/doctor/dashboard')}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-transparent border-none cursor-pointer p-0 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 m-0">
            {preAppointmentId ? '🩺 Patient Consultation & Prescription' : '💊 Write Digital Prescription'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5 m-0">
            Record diagnosis, doctor advice, and issue verified digital prescriptions in real time.
          </p>
        </div>

        {/* Card Container */}
        <div className="flex-1 flex justify-center items-stretch overflow-hidden pb-1">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-3xl w-full border border-slate-200/90 shadow-sm box-border flex flex-col h-full overflow-hidden">
            {success ? (
              <div className="text-center py-8 px-4 overflow-y-auto">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="font-bold text-slate-900 text-2xl mb-2">
                  {noMedications ? 'Consultation Completed Successfully!' : 'Prescription Saved & Sent!'}
                </h2>
                <p className="text-slate-500 max-w-md mx-auto mb-6 text-sm leading-relaxed">
                  {preAppointmentId
                    ? 'The appointment has been marked as attended and completed. The digital prescription and advice are instantly visible in the patient portal.'
                    : 'The prescription has been successfully filed in the patient health record.'}
                </p>
                <div className="flex gap-4 justify-center mt-6">
                  <button
                    onClick={() => navigate('/doctor/dashboard')}
                    className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold rounded-xl px-5 py-2.5 text-sm shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                  >
                    ← Back to Appointments
                  </button>
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setForm({
                        patientAccountId: '',
                        hospitalId: hospitals[0]?.id ? String(hospitals[0].id) : '',
                        validUntil: '',
                        specialInstructions: '',
                      });
                      setMeds([emptyMed()]);
                    }}
                    className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all cursor-pointer"
                  >
                    + Write Another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                {/* Scrollable Form Body inside the card */}
                <div className="overflow-y-auto flex-1 pr-2 space-y-4">
                  {/* Selected Patient Banner */}
                  {selectedPatient && (
                    <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-600 to-sky-500 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                        {selectedPatient.fullName?.charAt(0) ?? 'P'}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 text-base">{selectedPatient.fullName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          📧 {selectedPatient.email} {selectedPatient.phone ? `• 📞 ${selectedPatient.phone}` : ''} {selectedPatient.bloodGroup ? `• 🩸 Blood Group: ${selectedPatient.bloodGroup}` : ''}
                        </div>
                      </div>
                      {preAppointmentId && (
                        <span className="bg-indigo-100 text-indigo-700 rounded-full px-3 py-1 text-xs font-bold">
                          Appt #{preAppointmentId}
                        </span>
                      )}
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl text-red-700 p-3.5 text-sm font-medium">
                      ⚠️ {error}
                    </div>
                  )}

                  {/* Patient & Hospital Pickers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Patient Account *
                      </label>
                      <select
                        required
                        value={form.patientAccountId}
                        onChange={e => setForm(f => ({ ...f, patientAccountId: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 text-slate-900 bg-white cursor-pointer transition-all box-border"
                      >
                        <option value="">Select patient…</option>
                        {patients.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.fullName} ({p.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Hospital / Facility *
                      </label>
                      <select
                        required
                        value={form.hospitalId}
                        onChange={e => setForm(f => ({ ...f, hospitalId: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 text-slate-900 bg-white cursor-pointer transition-all box-border"
                      >
                        <option value="">Select hospital…</option>
                        {hospitals.map((h: any) => (
                          <option key={h.id} value={h.id}>
                            {h.name} {h.city ? `(${h.city})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Doctor Notes & Clinical Advice */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Clinical Notes / Doctor Advice & Diagnosis
                    </label>
                    <textarea
                      value={form.specialInstructions}
                      onChange={e => setForm(f => ({ ...f, specialInstructions: e.target.value }))}
                      rows={3}
                      placeholder="e.g. Mild viral fever. Patient advised bed rest for 2 days. Drink plenty of fluids. Follow up in 3 days if symptoms persist."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 text-slate-900 transition-all box-border resize-y leading-relaxed"
                    />
                  </div>

                  {/* Checkup / No Meds Toggle */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="noMeds"
                      checked={noMedications}
                      onChange={e => setNoMedications(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 accent-sky-500 cursor-pointer"
                    />
                    <label htmlFor="noMeds" className="text-xs sm:text-sm text-slate-800 font-semibold cursor-pointer">
                      No medications needed (Routine checkup / Consultation advice only)
                    </label>
                  </div>

                  {/* Prescribed Medications Section */}
                  {!noMedications && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <label className="block text-sm font-bold text-slate-900 m-0">
                            Prescribed Medications
                          </label>
                          <p className="m-0 text-xs text-slate-500 mt-0.5">
                            Add drug dosage, frequencies, and administration instructions.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={addMed}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-sky-300 text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors cursor-pointer"
                        >
                          + Add Medication
                        </button>
                      </div>

                      <div className="flex flex-col gap-3">
                        {meds.map((m, i) => (
                          <div key={i} className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200 relative">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Medication #{i + 1}
                              </span>
                              {meds.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeMed(i)}
                                  className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-2.5 py-1 transition-colors cursor-pointer"
                                >
                                  🗑️ Remove
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              <InputF label="Medication Name *" value={m.medicationName} onChange={v => updateMed(i, 'medicationName', v)} required={!noMedications} placeholder="e.g. Amoxicillin / Paracetamol" />
                              <InputF label="Dosage *" value={m.dosage} onChange={v => updateMed(i, 'dosage', v)} required={!noMedications} placeholder="e.g. 500 mg" />
                              <InputF label="Frequency *" value={m.frequency} onChange={v => updateMed(i, 'frequency', v)} required={!noMedications} placeholder="e.g. Twice daily (1-0-1)" />
                              <InputF label="Duration (days)" value={m.durationDays} type="number" onChange={v => updateMed(i, 'durationDays', v)} placeholder="e.g. 5" />
                              <div className="sm:col-span-2">
                                <InputF label="Instructions / Timing" value={m.instructions} onChange={v => updateMed(i, 'instructions', v)} placeholder="e.g. Take after meals with warm water" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Action Buttons - Pinned at bottom of card */}
                <div className="flex gap-3 pt-4 mt-3 border-t border-slate-100 shrink-0 bg-white">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-semibold rounded-xl px-5 py-3 text-sm transition-all cursor-pointer"
                    title="Reset form fields"
                  >
                    🔄 Clear
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 disabled:opacity-70 text-white font-semibold rounded-xl px-5 py-3 text-sm shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                  >
                    {loading
                      ? '🔄 Saving & Completing…'
                      : noMedications
                        ? '✅ Complete Consultation'
                        : '✅ Complete Consultation & Issue Prescription'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const InputF: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}> = ({ label, value, onChange, required, type = 'text', placeholder }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 text-slate-900 transition-all box-border bg-white"
    />
  </div>
);

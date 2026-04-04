import { useState } from 'react';
import type { Priority, RegisterPatientRequest } from '../types';
import { registerPatient } from '../services/api';

interface Props {
  onRegistered: () => void;
}

const PRIORITIES: { value: Priority; label: string; desc: string; color: string }[] = [
  { value: 'EMERGENCY', label: '🔴 Emergency', desc: 'Life-threatening / critical', color: 'border-red-500/50 bg-red-500/10 text-red-300' },
  { value: 'HIGH_RISK', label: '🟠 High Risk', desc: 'Urgent but stable', color: 'border-orange-500/50 bg-orange-500/10 text-orange-300' },
  { value: 'NORMAL',    label: '🟢 Normal',    desc: 'Standard visit', color: 'border-green-500/50 bg-green-500/10 text-green-300' },
];

export default function PatientRegistrationForm({ onRegistered }: Props) {
  const [form, setForm] = useState<RegisterPatientRequest>({
    name: '',
    age: 0,
    priority: 'NORMAL',
    symptoms: '',
  });
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
      setSuccess(`✅ Patient registered! Token: ${result.token} · Position #${result.position}`);
      setForm({ name: '', age: 0, priority: 'NORMAL', symptoms: '' });
      onRegistered();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to register patient. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-sky-500/15 flex items-center justify-center text-lg">🏥</div>
        <div>
          <h2 className="text-base font-semibold text-white">Register Patient</h2>
          <p className="text-xs text-slate-400">Add a new patient to the queue</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Patient Name <span className="text-red-400">*</span>
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
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Age <span className="text-red-400">*</span>
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
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Priority <span className="text-red-400">*</span>
          </label>
          <div className="space-y-2">
            {PRIORITIES.map(p => (
              <label
                key={p.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  form.priority === p.value
                    ? p.color + ' border-opacity-100'
                    : 'border-white/5 bg-white/2 hover:bg-white/5'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  checked={form.priority === p.value}
                  onChange={() => setForm(f => ({ ...f, priority: p.value }))}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  form.priority === p.value ? 'border-current' : 'border-slate-600'
                }`}>
                  {form.priority === p.value && (
                    <div className="w-2 h-2 rounded-full bg-current" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium">{p.label}</div>
                  <div className="text-xs text-slate-400">{p.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Symptoms <span className="text-slate-500">(optional)</span>
          </label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Brief description of symptoms..."
            value={form.symptoms}
            onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
          />
        </div>

        {/* Feedback */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm animate-fade-in">
            {success}
          </div>
        )}

        <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Registering...
            </>
          ) : (
            <>➕ Register Patient</>
          )}
        </button>
      </form>
    </div>
  );
}

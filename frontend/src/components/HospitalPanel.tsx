import { useState, useEffect, useCallback } from 'react';
import type { Hospital, HospitalRecommendation, Priority } from '../types';
import { getHospitals, getHospitalRecommendation, importPatient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// ── Colour helpers ──────────────────────────────────────────────────────────

const LOAD_COLOR = (pct: number) => {
  if (pct >= 90) return '#dc2626';
  if (pct >= 70) return '#d97706';
  if (pct >= 40) return '#0369a1';
  return '#16a34a';
};

const LOAD_LABEL = (pct: number) => {
  if (pct >= 90) return 'CRITICAL';
  if (pct >= 70) return 'HIGH';
  if (pct >= 40) return 'MODERATE';
  return 'LOW';
};

// ── Import history record ───────────────────────────────────────────────────

interface ImportRecord {
  token: string;
  name: string;
  priority: string;
  hospital: string;
  time: string;
  message: string;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function HospitalPanel() {
  const { isAdmin } = useAuth();
  const [hospitals, setHospitals]           = useState<Hospital[]>([]);
  const [recommendation, setRecommendation] = useState<HospitalRecommendation | null>(null);
  const [loading, setLoading]               = useState(true);

  // Selection state
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);

  // Import form state
  const [importForm, setImportForm] = useState({
    name: '', age: '', priority: 'NORMAL' as Priority | 'NORMAL',
    symptoms: '', sourceSystem: 'Apollo Hospitals EMR', externalId: '',
  });
  const [importing, setImporting] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportRecord[]>([]);
  const [importError, setImportError] = useState<string | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      const [h, r] = await Promise.all([
        getHospitals(),
        getHospitalRecommendation(),
      ]);
      setHospitals(h);
      setRecommendation(r);
      // Auto-select primary hospital on first load
      if (h.length > 0 && selectedHospitalId === null) {
        setSelectedHospitalId(h[0].id);
      }
    } catch { /* backend offline */ }
    finally { setLoading(false); }
  }, [selectedHospitalId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [load]);

  // ── Import submit ─────────────────────────────────────────────────────────

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    setImportError(null);

    const targetHospital = hospitals.find(h => h.id === selectedHospitalId);
    const hospitalTag    = targetHospital ? targetHospital.name : 'Bengaluru City Hospital';
    const externalId     = importForm.externalId || `EXT-${Date.now()}`;

    try {
      const res = await importPatient({
        name:          importForm.name,
        age:           importForm.age,
        priority:      importForm.priority,
        symptoms:      `[Routed to: ${hospitalTag}] ${importForm.symptoms}`,
        sourceSystem:  importForm.sourceSystem,
        externalId,
      });

      // Extract token from message e.g. "…token E1000"
      const tokenMatch = res.message?.match(/token\s+([A-Z]\d+)/);
      const token = tokenMatch ? tokenMatch[1] : '—';

      setImportHistory(prev => [
        {
          token,
          name:     importForm.name,
          priority: importForm.priority,
          hospital: hospitalTag,
          time:     new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          message:  res.message,
        },
        ...prev,
      ].slice(0, 10)); // keep last 10

      // Reset name/age/symptoms but keep defaults
      setImportForm(f => ({ ...f, name: '', age: '', symptoms: '', externalId: '' }));
      load(); // refresh hospital loads
    } catch {
      setImportError('Import failed — make sure you are logged in as Admin and the backend is running.');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        Loading hospital network…
      </div>
    );
  }

  const selectedHospital = hospitals.find(h => h.id === selectedHospitalId) ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Load-balancing recommendation banner ── */}
      {recommendation?.recommended && recommendation.hospital && (
        <div style={{
          background: '#fff7ed', border: '1px solid #fed7aa',
          borderLeft: '4px solid #f97316', borderRadius: '10px',
          padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.3rem' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#9a3412' }}>
              Load-Balancing Recommendation
            </div>
            <div style={{ fontSize: '0.82rem', color: '#7c2d12', marginTop: '0.25rem' }}>
              Primary hospital exceeds 80% capacity. Consider routing new patients to{' '}
              <strong>{recommendation.hospital.name}</strong> —{' '}
              currently at <strong>{recommendation.hospital.loadPercent}%</strong>.
            </div>
            <button
              onClick={() => setSelectedHospitalId(recommendation.hospital!.id)}
              style={{
                marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 600,
                color: 'white', background: '#f97316', border: 'none',
                borderRadius: '6px', padding: '0.25rem 0.75rem', cursor: 'pointer',
              }}
            >
              Select {recommendation.hospital.name} as Routing Target
            </button>
          </div>
        </div>
      )}

      {/* ── Hospital grid — clickable cards ─────────────────────────────────── */}
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '1rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            🏥 Bengaluru Hospital Network
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {hospitals.filter(h => h.active).length} of {hospitals.length} active · click a card to select routing target
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {hospitals.map((h, idx) => {
            const loadColor = LOAD_COLOR(h.loadPercent);
            const loadLabel = LOAD_LABEL(h.loadPercent);
            const isSelected = h.id === selectedHospitalId;
            const isPrimary  = idx === 0;

            return (
              <div
                key={h.id}
                onClick={() => setSelectedHospitalId(h.id)}
                style={{
                  background:  isSelected ? 'var(--brand-light)' : 'var(--surface-2)',
                  border:      isSelected
                    ? '2px solid var(--brand)'
                    : isPrimary
                    ? '2px solid #c7d2fe'
                    : '1px solid var(--border)',
                  borderRadius: '12px',
                  padding:      '1.25rem',
                  position:     'relative',
                  overflow:     'hidden',
                  cursor:       'pointer',
                  transition:   'all 0.15s ease',
                  boxShadow:    isSelected ? '0 0 0 3px rgba(3,105,161,0.15)' : 'none',
                }}
              >
                {/* Badges row */}
                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '4px' }}>
                  {isPrimary && (
                    <span style={{
                      background: '#6366f1', color: 'white',
                      fontSize: '0.62rem', fontWeight: 700,
                      padding: '2px 7px', borderRadius: '999px',
                    }}>PRIMARY</span>
                  )}
                  {isSelected && (
                    <span style={{
                      background: 'var(--brand)', color: 'white',
                      fontSize: '0.62rem', fontWeight: 700,
                      padding: '2px 7px', borderRadius: '999px',
                    }}>✓ SELECTED</span>
                  )}
                </div>

                {/* Active dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: h.active ? '#22c55e' : '#94a3b8',
                  }} />
                  <span style={{ fontSize: '0.7rem', color: h.active ? '#16a34a' : 'var(--text-muted)', fontWeight: 600 }}>
                    {h.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem', paddingRight: '5rem' }}>
                  {h.name}
                </h3>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 0.9rem' }}>
                  📍 {h.address}
                </p>

                {/* Load bar */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: loadColor }}>{loadLabel}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {h.currentLoad}/{h.maxCapacity} patients
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${Math.min(h.loadPercent, 100)}%`,
                      background: loadColor, borderRadius: '999px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {h.loadPercent}% capacity
                  </div>
                </div>

                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>📞 {h.phone}</div>
              </div>
            );
          })}
        </div>

        {selectedHospital && (
          <div style={{
            marginTop: '0.75rem', padding: '0.6rem 1rem',
            background: 'var(--brand-light)', border: '1px solid #bae6fd',
            borderRadius: '8px', fontSize: '0.8rem', color: '#0369a1', fontWeight: 600,
          }}>
            ✓ Routing target: <strong>{selectedHospital.name}</strong> — all imports will be directed here
          </div>
        )}
      </div>

      {/* ── Patient Import Form (Admin only) — always expanded ──────────────── */}
      {isAdmin && (
        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: '12px', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.25rem',
            background: 'linear-gradient(90deg, #f0fdf4, var(--surface-2))',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '0.6rem',
          }}>
            <span style={{ fontSize: '1.1rem' }}>📥</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                External Patient Import (HL7-lite)
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                Simulate importing a patient from an external EMR system. Routed to the selected hospital above.
              </div>
            </div>
          </div>

          <form onSubmit={handleImport} style={{ padding: '1.25rem' }}>

            {/* Hospital routing target indicator */}
            <div style={{
              marginBottom: '1rem', padding: '0.6rem 0.85rem',
              background: selectedHospital ? '#eff6ff' : '#fef9c3',
              border: `1px solid ${selectedHospital ? '#bfdbfe' : '#fde68a'}`,
              borderRadius: '8px', fontSize: '0.78rem',
              color: selectedHospital ? '#1d4ed8' : '#92400e',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              🏥 {selectedHospital
                ? <>Routing to: <strong style={{ marginLeft: 4 }}>{selectedHospital.name}</strong></>
                : 'Select a hospital card above to set the routing target'}
            </div>

            {/* Form grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>

              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Patient Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  required
                  value={importForm.name}
                  onChange={e => setImportForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Rahul Mehta"
                  style={inputStyle}
                />
              </div>

              {/* Age */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Age <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  required type="number" min="0" max="150"
                  value={importForm.age}
                  onChange={e => setImportForm(f => ({ ...f, age: e.target.value }))}
                  placeholder="e.g. 45"
                  style={inputStyle}
                />
              </div>

              {/* Priority */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Priority
                </label>
                <select
                  value={importForm.priority}
                  onChange={e => setImportForm(f => ({ ...f, priority: e.target.value as Priority }))}
                  style={inputStyle}
                >
                  <option value="EMERGENCY">🔴 EMERGENCY</option>
                  <option value="HIGH_RISK">🟠 HIGH_RISK</option>
                  <option value="NORMAL">🟢 NORMAL</option>
                </select>
              </div>

              {/* Source system */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Source System
                </label>
                <input
                  value={importForm.sourceSystem}
                  onChange={e => setImportForm(f => ({ ...f, sourceSystem: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              {/* External ID */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  External ID
                </label>
                <input
                  value={importForm.externalId}
                  placeholder="e.g. APL-2024-08932 (auto if blank)"
                  onChange={e => setImportForm(f => ({ ...f, externalId: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              {/* Symptoms */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Symptoms / Clinical Notes
                </label>
                <textarea
                  value={importForm.symptoms}
                  onChange={e => setImportForm(f => ({ ...f, symptoms: e.target.value }))}
                  placeholder="e.g. Chest pain, shortness of breath"
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {/* Submit row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="submit"
                id="import-patient-btn"
                disabled={importing || !selectedHospitalId}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: importing || !selectedHospitalId ? '#94a3b8' : 'var(--brand)',
                  color: 'white',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: importing || !selectedHospitalId ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                {importing ? '⏳ Importing…' : '📥 Import Patient'}
              </button>
              {!selectedHospitalId && (
                <span style={{ fontSize: '0.75rem', color: '#d97706' }}>
                  ← Select a hospital card first
                </span>
              )}
            </div>

            {/* Error */}
            {importError && (
              <div style={{
                marginTop: '0.75rem', padding: '0.6rem 0.85rem',
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '8px', fontSize: '0.78rem', color: '#dc2626',
              }}>
                ❌ {importError}
              </div>
            )}
          </form>

          {/* ── Import History Table ── */}
          {importHistory.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                📋 Recent Imports ({importHistory.length})
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface)', borderBottom: '2px solid var(--border)' }}>
                      {['Token', 'Patient Name', 'Priority', 'Routed Hospital', 'Imported At'].map(h => (
                        <th key={h} style={{
                          padding: '0.4rem 0.75rem', textAlign: 'left',
                          fontWeight: 700, color: 'var(--text-secondary)',
                          fontSize: '0.7rem', textTransform: 'uppercase',
                          letterSpacing: '0.04em', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importHistory.map((rec, i) => (
                      <tr key={i} style={{
                        borderBottom: '1px solid var(--border)',
                        background: i === 0 ? '#f0fdf4' : 'transparent',
                      }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--brand)', fontFamily: 'monospace' }}>
                          {rec.token}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {rec.name}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700,
                            background: rec.priority === 'EMERGENCY' ? '#fef2f2'
                              : rec.priority === 'HIGH_RISK' ? '#fff7ed' : '#f0fdf4',
                            color: rec.priority === 'EMERGENCY' ? '#dc2626'
                              : rec.priority === 'HIGH_RISK' ? '#d97706' : '#16a34a',
                          }}>
                            {rec.priority}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>
                          {rec.hospital}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                          {rec.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared input style ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text-primary)',
  fontSize: '0.82rem',
  boxSizing: 'border-box',
  outline: 'none',
};

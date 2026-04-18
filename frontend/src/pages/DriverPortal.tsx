import { useState, useEffect, useRef, useCallback } from 'react';
import { updateAmbulanceLocation } from '../services/api';

// ── Ambulance options matching the backend seed ──────────────────────────────

const AMBULANCES = [
  { id: 1, callSign: 'AMB-01', driver: 'Ravi Kumar' },
  { id: 2, callSign: 'AMB-02', driver: 'Priya Singh' },
  { id: 3, callSign: 'AMB-03', driver: 'Arjun Nair' },
];

type Status = 'idle' | 'requesting' | 'active' | 'error';

export default function DriverPortal() {
  const [selectedId, setSelectedId] = useState<number>(1);
  const [status, setStatus] = useState<Status>('idle');
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [updateCount, setUpdateCount] = useState(0);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus('idle');
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setStatus('requesting');
    setErrorMsg('');

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCurrentPos({ lat, lng });
        setStatus('active');
        try {
          await updateAmbulanceLocation(selectedId, lat, lng);
          setLastUpdate(new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
          }));
          setUpdateCount(c => c + 1);
        } catch {
          // Don't stop tracking on a single failed push
          console.warn('[Driver] Failed to push GPS update');
        }
      },
      (err) => {
        setStatus('error');
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setErrorMsg('Location permission denied. Please allow access in browser settings.');
            break;
          case err.POSITION_UNAVAILABLE:
            setErrorMsg('Location unavailable. Make sure GPS is enabled.');
            break;
          default:
            setErrorMsg('Unable to get location. Please try again.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Stop tracking when ambulance selection changes
  useEffect(() => {
    stopTracking();
    setUpdateCount(0);
    setCurrentPos(null);
    setLastUpdate(null);
  }, [selectedId, stopTracking]);

  // Clean up on unmount
  useEffect(() => () => stopTracking(), [stopTracking]);

  const selectedAmb = AMBULANCES.find(a => a.id === selectedId)!;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '2rem 1rem',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          width: '64px', height: '64px',
          background: 'linear-gradient(135deg, #0369a1, #0891b2)',
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', margin: '0 auto 1rem',
          boxShadow: '0 8px 24px rgba(8,145,178,0.4)',
        }}>
          🚑
        </div>
        <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
          MediFlowIQ Driver Portal
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.4rem' }}>
          Share your real-time GPS location with the hospital
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        {/* Ambulance selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block', color: '#cbd5e1',
            fontSize: '0.8rem', fontWeight: 600,
            marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Select Your Ambulance
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {AMBULANCES.map(amb => (
              <button
                key={amb.id}
                onClick={() => status === 'idle' && setSelectedId(amb.id)}
                disabled={status === 'active' || status === 'requesting'}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: `2px solid ${selectedId === amb.id ? '#0891b2' : 'rgba(255,255,255,0.1)'}`,
                  background: selectedId === amb.id
                    ? 'rgba(8,145,178,0.2)'
                    : 'rgba(255,255,255,0.04)',
                  color: selectedId === amb.id ? '#38bdf8' : '#94a3b8',
                  cursor: status === 'active' ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  opacity: (status === 'active' || status === 'requesting') && selectedId !== amb.id ? 0.4 : 1,
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>🚑</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{amb.callSign}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Driver: {amb.driver}</div>
                </div>
                {selectedId === amb.id && (
                  <span style={{
                    marginLeft: 'auto',
                    background: '#0891b2',
                    color: 'white',
                    borderRadius: '999px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                  }}>Selected</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Status display */}
        <div style={{
          padding: '1rem',
          borderRadius: '12px',
          background: 'rgba(0,0,0,0.2)',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: status === 'active' ? '#22c55e'
                : status === 'requesting' ? '#f59e0b'
                : status === 'error' ? '#ef4444'
                : '#64748b',
              boxShadow: status === 'active' ? '0 0 8px #22c55e' : 'none',
              animation: status === 'active' ? 'pulse 1.5s infinite' : 'none',
            }} />
            <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
              {status === 'active'    ? `Live GPS — ${selectedAmb.callSign}`
               : status === 'requesting' ? 'Requesting location access…'
               : status === 'error'      ? 'GPS Error'
               : 'GPS Inactive'}
            </span>
          </div>

          {currentPos && (
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              📍 {currentPos.lat.toFixed(6)}, {currentPos.lng.toFixed(6)}
            </div>
          )}
          {lastUpdate && (
            <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.3rem' }}>
              Last push: {lastUpdate} · {updateCount} update{updateCount !== 1 ? 's' : ''} sent
            </div>
          )}
          {status === 'error' && (
            <div style={{ color: '#fca5a5', fontSize: '0.78rem', marginTop: '0.4rem' }}>
              {errorMsg}
            </div>
          )}
        </div>

        {/* CTA button */}
        {status !== 'active' ? (
          <button
            id="driver-share-location"
            onClick={startTracking}
            disabled={status === 'requesting'}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '12px',
              border: 'none',
              background: status === 'requesting'
                ? '#475569'
                : 'linear-gradient(135deg, #0369a1, #0891b2)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: status === 'requesting' ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: status !== 'requesting' ? '0 4px 16px rgba(8,145,178,0.4)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {status === 'requesting' ? (
              <>⏳ Requesting Permission…</>
            ) : (
              <>📍 Share My Location</>
            )}
          </button>
        ) : (
          <button
            id="driver-stop-sharing"
            onClick={stopTracking}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '12px',
              border: '2px solid #ef4444',
              background: 'rgba(239,68,68,0.15)',
              color: '#fca5a5',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            ■ Stop Sharing Location
          </button>
        )}

        {/* Info note */}
        <p style={{
          color: '#475569', fontSize: '0.72rem', textAlign: 'center',
          marginTop: '1rem', marginBottom: 0, lineHeight: 1.5,
        }}>
          Location updates are sent every ~2–5 seconds. The hospital dashboard will
          show your real position instead of the simulated route.
        </p>
      </div>

      {/* Back link */}
      <a
        href="/"
        style={{
          color: '#64748b', fontSize: '0.8rem',
          marginTop: '1.5rem', textDecoration: 'none',
        }}
      >
        ← Back to MediFlowIQ dashboard
      </a>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

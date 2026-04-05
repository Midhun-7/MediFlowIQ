import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import type { Ambulance } from '../types';
import { getAmbulances } from '../services/api';
import { subscribeAmbulance, unsubscribeAmbulance } from '../services/socket';
import AmbulanceStatusBadge from './AmbulanceStatusBadge';

// ── Leaflet default icon fix for bundlers ─────────────────────────
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const HOSPITAL_LAT = 12.9716;
const HOSPITAL_LNG = 77.5946;

// ── Custom icons (created once, outside component) ────────────────
const makeAmbIcon = (dispatched: boolean) =>
  L.divIcon({
    className: '',
    html: `<div class="amb-marker ${dispatched ? 'amb-dispatched' : 'amb-available'}">🚑</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
  });

const hospitalIcon = L.divIcon({
  className: '',
  html: `<div class="hosp-marker">🏥</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -24],
});

// Injected once as a global style
const LEAFLET_CUSTOM_CSS = `
  .amb-marker {
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .amb-available { background: #0369a1; }
  .amb-dispatched {
    background: #dc2626;
    animation: amb-pulse 1.5s infinite;
  }
  @keyframes amb-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(220,38,38,.5); }
    70%  { box-shadow: 0 0 0 12px rgba(220,38,38,0); }
    100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
  }
  .hosp-marker {
    width: 40px; height: 40px;
    background: #0369a1;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .leaflet-container { font-family: 'Inter', sans-serif; }
`;

export default function AmbulanceMap({ wsConnected }: { wsConnected: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const hospitalMarkerRef = useRef<L.Marker | null>(null);

  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Inject custom CSS once ────────────────────────────────────────
  useEffect(() => {
    if (!document.getElementById('amb-map-styles')) {
      const style = document.createElement('style');
      style.id = 'amb-map-styles';
      style.textContent = LEAFLET_CUSTOM_CSS;
      document.head.appendChild(style);
    }
  }, []);

  // ── Initialise Leaflet map imperatively ───────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [HOSPITAL_LAT, HOSPITAL_LNG],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Hospital marker
    hospitalMarkerRef.current = L.marker([HOSPITAL_LAT, HOSPITAL_LNG], { icon: hospitalIcon })
      .addTo(map)
      .bindPopup(`
        <div style="min-width:140px">
          <p style="font-weight:700;margin:0 0 4px">🏥 City Hospital</p>
          <p style="font-size:12px;color:#64748b;margin:0">Ambulance Base &amp; Destination</p>
          <p style="font-size:11px;color:#94a3b8;margin:4px 0 0">${HOSPITAL_LAT}, ${HOSPITAL_LNG}</p>
        </div>
      `);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // ── Update markers when ambulances change ─────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentIds = new Set(ambulances.map(a => a.id));

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add / update markers
    ambulances.forEach(amb => {
      const isActive = amb.status === 'DISPATCHED' || amb.status === 'ON_SCENE';
      const icon = makeAmbIcon(isActive);

      const popup = `
        <div style="min-width:160px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="font-size:20px">🚑</span>
            <strong style="font-size:14px">${amb.callSign}</strong>
          </div>
          <div style="font-size:12px;line-height:1.8;color:#475569">
            <div><b>Driver:</b> ${amb.driverName}</div>
            <div><b>Status:</b> ${amb.status.replace('_', ' ')}</div>
            ${amb.status !== 'AVAILABLE' ? `<div><b>ETA:</b> <span style="color:#0369a1;font-weight:700">${amb.etaMinutes} min</span></div>` : ''}
            <div style="font-size:11px;color:#94a3b8;margin-top:4px">${amb.lat.toFixed(4)}, ${amb.lng.toFixed(4)}</div>
          </div>
        </div>
      `;

      if (markersRef.current.has(amb.id)) {
        const marker = markersRef.current.get(amb.id)!;
        marker.setLatLng([amb.lat, amb.lng]);
        marker.setIcon(icon);
        marker.setPopupContent(popup);
      } else {
        const marker = L.marker([amb.lat, amb.lng], { icon })
          .addTo(map)
          .bindPopup(popup);
        markersRef.current.set(amb.id, marker);
      }
    });

    // Fit bounds on first load
    if (ambulances.length > 0 && loading) {
      const allCoords: L.LatLngExpression[] = [
        [HOSPITAL_LAT, HOSPITAL_LNG],
        ...ambulances.map(a => [a.lat, a.lng] as L.LatLngExpression),
      ];
      map.fitBounds(L.latLngBounds(allCoords), { padding: [50, 50] });
    }
  }, [ambulances, loading]);

  // ── REST fetch on mount ───────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const data = await getAmbulances();
      setAmbulances(data);
    } catch {
      // backend may still be starting
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── WebSocket subscription ────────────────────────────────────────
  useEffect(() => {
    if (!wsConnected) return;
    const timer = setTimeout(() => {
      subscribeAmbulance(setAmbulances);
    }, 600);
    return () => {
      clearTimeout(timer);
      unsubscribeAmbulance();
    };
  }, [wsConnected]);

  const dispatched = ambulances.filter(a => a.status === 'DISPATCHED').length;
  const onScene   = ambulances.filter(a => a.status === 'ON_SCENE').length;
  const available = ambulances.filter(a => a.status === 'AVAILABLE').length;

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* ── Header ── */}
      <div className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🚑</span>
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              Ambulance Fleet
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Live GPS simulation · Updates every 3s via WebSocket
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          <span style={{ color: 'var(--amb-dispatched)' }}>🔴 {dispatched} Dispatched</span>
          <span style={{ color: 'var(--amb-on-scene)' }}>🟡 {onScene} On Scene</span>
          <span style={{ color: 'var(--amb-available)' }}>🟢 {available} Available</span>
        </div>
      </div>

      {/* ── Map ── */}
      <div style={{ position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1000,
            background: 'rgba(248,250,252,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🗺️</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Loading map data…
              </p>
            </div>
          </div>
        )}
        <div
          ref={mapRef}
          id="ambulance-leaflet-map"
          style={{ height: '480px', width: '100%' }}
        />
      </div>

      {/* ── Fleet list ── */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        {ambulances.map(amb => (
          <div
            key={amb.id}
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
          >
            <div className="flex items-center gap-3">
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: amb.status === 'DISPATCHED' || amb.status === 'ON_SCENE'
                  ? 'var(--amb-dispatched-bg)' : 'var(--surface-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>🚑</div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  {amb.callSign}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {amb.driverName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {amb.status !== 'AVAILABLE' && (
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>
                    ETA {amb.etaMinutes} min
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {amb.lat.toFixed(3)}, {amb.lng.toFixed(3)}
                  </p>
                </div>
              )}
              <AmbulanceStatusBadge status={amb.status} />
            </div>
          </div>
        ))}

        {!loading && ambulances.length === 0 && (
          <div className="py-10 text-center">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No ambulances found — is the backend running?
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

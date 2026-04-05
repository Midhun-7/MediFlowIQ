import type { AmbulanceStatus } from '../types';

interface Props {
  status: AmbulanceStatus;
}

const STATUS_CONFIG: Record<AmbulanceStatus, { label: string; icon: string; color: string; bg: string }> = {
  AVAILABLE:  { label: 'Available',  icon: '🟢', color: 'var(--amb-available)',    bg: 'var(--amb-available-bg)' },
  DISPATCHED: { label: 'Dispatched', icon: '🔴', color: 'var(--amb-dispatched)',   bg: 'var(--amb-dispatched-bg)' },
  ON_SCENE:   { label: 'On Scene',   icon: '🟡', color: 'var(--amb-on-scene)',     bg: 'var(--amb-on-scene-bg)' },
  RETURNING:  { label: 'Returning',  icon: '🔵', color: 'var(--amb-returning)',    bg: 'var(--amb-returning-bg)' },
};

export default function AmbulanceStatusBadge({ status }: Props) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="badge"
      style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.color}33` }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

import type { PatientStatus } from '../types';

interface StatusBadgeProps {
  status: PatientStatus;
}

const config: Record<PatientStatus, { label: string; color: string; icon: string }> = {
  WAITING: {
    label: 'Waiting',
    color: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    icon: '⏳',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-violet-500/15 text-violet-400 border border-violet-500/30',
    icon: '🩺',
  },
  DONE: {
    label: 'Done',
    color: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    icon: '✓',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const c = config[status];
  return (
    <span className={`status-badge ${c.color}`}>
      <span className="text-xs">{c.icon}</span>
      {c.label}
    </span>
  );
}

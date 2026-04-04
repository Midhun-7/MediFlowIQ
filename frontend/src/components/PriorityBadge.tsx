import type { Priority } from '../types';

interface PriorityBadgeProps {
  priority: Priority;
  animate?: boolean;
}

const config: Record<Priority, { label: string; color: string; dot: string; ring?: boolean }> = {
  EMERGENCY: {
    label: 'Emergency',
    color: 'bg-red-500/15 text-red-400 border border-red-500/30',
    dot: 'bg-red-400',
    ring: true,
  },
  HIGH_RISK: {
    label: 'High Risk',
    color: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    dot: 'bg-orange-400',
  },
  NORMAL: {
    label: 'Normal',
    color: 'bg-green-500/15 text-green-400 border border-green-500/30',
    dot: 'bg-green-400',
  },
};

export default function PriorityBadge({ priority, animate = true }: PriorityBadgeProps) {
  const c = config[priority];
  return (
    <span className={`status-badge ${c.color} ${c.ring && animate ? 'pulse-ring' : ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${c.ring && animate ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  );
}

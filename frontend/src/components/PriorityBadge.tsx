interface Props {
  priority: string;
}

const CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  EMERGENCY: { label: 'Emergency',  bg: '#fef2f2', color: '#b91c1c', dot: '#dc2626' },
  HIGH_RISK: { label: 'High Risk',  bg: '#fff7ed', color: '#c2410c', dot: '#ea580c' },
  NORMAL:    { label: 'Normal',     bg: '#f0fdf4', color: '#15803d', dot: '#16a34a' },
};

export default function PriorityBadge({ priority }: Props) {
  const cfg = CONFIG[priority] ?? { label: priority, bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      padding: '0.2rem 0.6rem',
      borderRadius: '9999px',
      fontSize: '0.72rem',
      fontWeight: 600,
      letterSpacing: '0.03em',
      backgroundColor: cfg.bg,
      color: cfg.color,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

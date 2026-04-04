interface Props {
  status: string;
}

const CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  WAITING:     { label: 'Waiting',     bg: '#fffbeb', color: '#92400e', dot: '#d97706' },
  IN_PROGRESS: { label: 'In Progress', bg: '#f5f3ff', color: '#5b21b6', dot: '#7c3aed' },
  DONE:        { label: 'Done',        bg: '#f0fdf4', color: '#15803d', dot: '#16a34a' },
};

export default function StatusBadge({ status }: Props) {
  const cfg = CONFIG[status] ?? { label: status, bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
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

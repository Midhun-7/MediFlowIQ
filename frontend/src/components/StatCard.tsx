
interface Props {
  title: string;
  value: number | string;
  icon: string;
  subtitle: string;
  accentColor: string;
}

export default function StatCard({ title, value, icon, subtitle, accentColor }: Props) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem 1.25rem',
        borderLeft: `4px solid ${accentColor}`,
      }}>
        <div style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '10px',
          backgroundColor: `${accentColor}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{title}</p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1, color: accentColor }}>{value}</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

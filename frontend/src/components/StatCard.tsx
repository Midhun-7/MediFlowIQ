interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  subtitle?: string;
  accentColor?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function StatCard({
  title,
  value,
  icon,
  subtitle,
  accentColor = '#0ea5e9',
}: StatCardProps) {
  return (
    <div
      className="glass-card p-5 flex items-start gap-4 hover:border-white/10 transition-all duration-300"
      style={{ borderTopColor: accentColor, borderTopWidth: '2px' }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
        style={{ background: `${accentColor}18` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-400 font-medium">{title}</p>
        <p className="text-3xl font-bold mt-0.5" style={{ color: accentColor }}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

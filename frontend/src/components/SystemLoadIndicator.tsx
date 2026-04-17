import type { SystemLoad } from '../types';

interface SystemLoadIndicatorProps {
  load: SystemLoad;
}

const loadConfig = {
  LOW: {
    label: 'Optimal',
    color: '#10b981', // green-500
    bg: '#ecfdf5',    // green-50
    description: 'Smooth operations, low waiting times.'
  },
  MODERATE: {
    label: 'Steady',
    color: '#3b82f6', // blue-500
    bg: '#eff6ff',    // blue-50
    description: 'Manageable load, standard processing.'
  },
  HIGH: {
    label: 'High Capacity',
    color: '#f59e0b', // amber-500
    bg: '#fffbeb',    // amber-50
    description: 'Near capacity, expected delays.'
  },
  CRITICAL: {
    label: 'Critical / Overloaded',
    color: '#ef4444', // red-500
    bg: '#fef2f2',    // red-50
    description: 'Exceeds capacity, diverting non-criticals.'
  }
};

export default function SystemLoadIndicator({ load }: SystemLoadIndicatorProps) {
  const config = loadConfig[load] || loadConfig.LOW;

  return (
    <div 
      className="p-4 rounded-xl border flex items-center justify-between gap-4 transition-all"
      style={{ 
        borderColor: `${config.color}20`,
        background: `linear-gradient(135deg, ${config.bg} 0%, #ffffff 100%)`
      }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
          style={{ background: `${config.color}15`, color: config.color }}
        >
          {load === 'CRITICAL' ? '⚠️' : load === 'HIGH' ? '⚡' : '🛡️'}
        </div>
        <div>
          <h4 className="font-bold text-sm tracking-tight" style={{ color: 'var(--text)' }}>
            System Status: <span style={{ color: config.color }}>{config.label}</span>
          </h4>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {config.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3].map((i) => {
          const isActive = (load === 'LOW' && i === 0) || 
                           (load === 'MODERATE' && i <= 1) || 
                           (load === 'HIGH' && i <= 2) || 
                           (load === 'CRITICAL');
          return (
            <div 
              key={i}
              className="w-1.5 h-6 rounded-full"
              style={{ background: isActive ? config.color : 'var(--surface-3)' }}
            />
          );
        })}
      </div>
    </div>
  );
}

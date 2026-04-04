import { useState } from 'react';
import type { QueueEntry } from '../types';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import { updateStatus } from '../services/api';

interface Props {
  entries: QueueEntry[];
  onUpdate: () => void;
  connected: boolean;
}

export default function QueueBoard({ entries, onUpdate, connected }: Props) {
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleStatusChange = async (patientId: number, status: string) => {
    setUpdatingId(patientId);
    try {
      await updateStatus(patientId, status);
      onUpdate();
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--surface-2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '8px',
            backgroundColor: '#ede9fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
          }}>📋</div>
          <div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Live Patient Queue
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              {entries.length} patient{entries.length !== 1 ? 's' : ''} in queue
            </p>
          </div>
        </div>

        {/* Live indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '0.7rem',
          fontWeight: 500,
          color: connected ? '#16a34a' : '#dc2626',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: connected ? '#22c55e' : '#ef4444',
            display: 'inline-block',
            ...(connected ? { animationName: 'blink', animationDuration: '1.5s', animationIterationCount: 'infinite' } : {}),
          }} />
          {connected ? 'Live' : 'Offline'}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', flex: 1 }}>
        {entries.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 1rem',
            color: 'var(--text-muted)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏥</div>
            <p style={{ fontWeight: 500, margin: '0 0 0.25rem' }}>Queue is empty</p>
            <p style={{ fontSize: '0.8rem', margin: 0 }}>Register a patient to get started</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-3)', borderBottom: '1px solid var(--border)' }}>
                {['#', 'Token', 'Patient', 'Priority', 'Status', 'Est. Wait', 'Registered', 'Action'].map(col => (
                  <th key={col} style={{
                    textAlign: 'left',
                    padding: '0.65rem 1rem',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const isEmergency = entry.priority === 'EMERGENCY';
                const isHighRisk = entry.priority === 'HIGH_RISK';

                return (
                  <tr
                    key={entry.id}
                    className="animate-slide-in"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      borderLeft: `3px solid ${isEmergency ? 'var(--emergency)' : isHighRisk ? 'var(--high-risk)' : '#e2e8f0'}`,
                      backgroundColor: isEmergency ? '#fef2f2' : isHighRisk ? '#fff7ed' : 'var(--surface-2)',
                      animationDelay: `${i * 30}ms`,
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = isEmergency ? '#fee2e2' : isHighRisk ? '#ffedd5' : 'var(--surface-3)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = isEmergency ? '#fef2f2' : isHighRisk ? '#fff7ed' : 'var(--surface-2)')}
                  >
                    {/* Position */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        width: '1.75rem',
                        height: '1.75rem',
                        borderRadius: '50%',
                        backgroundColor: 'var(--surface-3)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                      }}>
                        {entry.position}
                      </span>
                    </td>

                    {/* Token */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: 'var(--brand)',
                        fontSize: '0.85rem',
                        letterSpacing: '0.05em',
                      }}>
                        {entry.token}
                      </span>
                    </td>

                    {/* Patient */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{entry.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Age {entry.patientAge}</div>
                      {entry.symptoms && (
                        <div style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          maxWidth: '160px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: '1px',
                        }} title={entry.symptoms}>
                          {entry.symptoms}
                        </div>
                      )}
                    </td>

                    {/* Priority */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <PriorityBadge priority={entry.priority} />
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <StatusBadge status={entry.status} />
                    </td>

                    {/* Est. Wait */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>⏱</span>
                        {entry.estimatedWaitMinutes} min
                      </div>
                    </td>

                    {/* Time */}
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {formatTime(entry.registeredAt)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        {entry.status === 'WAITING' && (
                          <button
                            onClick={() => handleStatusChange(entry.patientId, 'IN_PROGRESS')}
                            disabled={updatingId === entry.patientId}
                            className="btn btn-ghost-blue"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                          >
                            {updatingId === entry.patientId ? '...' : '🩺 Attend'}
                          </button>
                        )}
                        {entry.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleStatusChange(entry.patientId, 'DONE')}
                            disabled={updatingId === entry.patientId}
                            className="btn btn-ghost-green"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                          >
                            {updatingId === entry.patientId ? '...' : '✓ Done'}
                          </button>
                        )}
                        {entry.status === 'DONE' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Completed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

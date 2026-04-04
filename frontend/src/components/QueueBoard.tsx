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

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="glass-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center text-lg">📋</div>
          <div>
            <h2 className="text-base font-semibold text-white">Live Queue</h2>
            <p className="text-xs text-slate-400">{entries.length} patient{entries.length !== 1 ? 's' : ''} waiting</p>
          </div>
        </div>
        {/* WS connection indicator */}
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 blink' : 'bg-red-400'}`}
          />
          <span className={connected ? 'text-green-400' : 'text-red-400'}>
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <div className="text-5xl mb-4">🏥</div>
            <p className="text-sm font-medium">Queue is empty</p>
            <p className="text-xs mt-1">Register a patient to get started</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-white/5">
                <th className="text-left px-5 py-3 font-medium">#</th>
                <th className="text-left px-5 py-3 font-medium">Token</th>
                <th className="text-left px-5 py-3 font-medium">Patient</th>
                <th className="text-left px-5 py-3 font-medium">Priority</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Est. Wait</th>
                <th className="text-left px-5 py-3 font-medium">Registered</th>
                <th className="text-left px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {entries.map((entry, i) => {
                const rowClass =
                  entry.priority === 'EMERGENCY'
                    ? 'row-emergency'
                    : entry.priority === 'HIGH_RISK'
                    ? 'row-high-risk'
                    : 'row-normal';

                return (
                  <tr
                    key={entry.id}
                    className={`${rowClass} animate-slide-in hover:bg-white/[0.02] transition-colors`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {/* Position */}
                    <td className="px-5 py-3.5">
                      <span className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                        {entry.position}
                      </span>
                    </td>

                    {/* Token */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-sky-400 text-sm tracking-wide">
                        {entry.token}
                      </span>
                    </td>

                    {/* Patient */}
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-white">{entry.patientName}</div>
                      <div className="text-xs text-slate-400">Age {entry.patientAge}</div>
                      {entry.symptoms && (
                        <div
                          className="text-xs text-slate-500 truncate max-w-[160px] mt-0.5"
                          title={entry.symptoms}
                        >
                          {entry.symptoms}
                        </div>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="px-5 py-3.5">
                      <PriorityBadge priority={entry.priority} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={entry.status} />
                    </td>

                    {/* Est. Wait */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <span className="text-slate-500">⏱</span>
                        {entry.estimatedWaitMinutes} min
                      </div>
                    </td>

                    {/* Time */}
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {formatTime(entry.registeredAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        {entry.status === 'WAITING' && (
                          <button
                            onClick={() => handleStatusChange(entry.patientId, 'IN_PROGRESS')}
                            disabled={updatingId === entry.patientId}
                            className="text-xs px-2.5 py-1 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/20 hover:bg-violet-500/25 transition-colors disabled:opacity-50"
                          >
                            {updatingId === entry.patientId ? '...' : '🩺 Attend'}
                          </button>
                        )}
                        {entry.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleStatusChange(entry.patientId, 'DONE')}
                            disabled={updatingId === entry.patientId}
                            className="text-xs px-2.5 py-1 rounded-md bg-green-500/15 text-green-300 border border-green-500/20 hover:bg-green-500/25 transition-colors disabled:opacity-50"
                          >
                            {updatingId === entry.patientId ? '...' : '✓ Done'}
                          </button>
                        )}
                        {entry.status === 'DONE' && (
                          <span className="text-xs text-slate-500 italic">Completed</span>
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

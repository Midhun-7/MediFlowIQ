import { useState, useEffect, useRef } from 'react';
import type { AppNotification, NotificationEventType } from '../types';

interface Props {
  notifications: AppNotification[];
  unreadCount: number;
  onMarkRead: () => void;
}

// ── Event type metadata ──────────────────────────────────────────────────────

const EVENT_META: Record<NotificationEventType, { icon: string; color: string }> = {
  PATIENT_REGISTERED:  { icon: '🔔', color: '#0369a1' },
  STATUS_CHANGED:      { icon: '✅', color: '#16a34a' },
  AMBULANCE_ARRIVED:   { icon: '🚑', color: '#7c3aed' },
  AMBULANCE_LIVE_GPS:  { icon: '📍', color: '#0891b2' },
  HIGH_LOAD_ALERT:     { icon: '⚠️', color: '#dc2626' },
  PATIENT_IMPORTED:    { icon: '📥', color: '#d97706' },
};

const SEVERITY_BG: Record<string, string> = {
  EMERGENCY: '#fef2f2',
  HIGH:      '#fff7ed',
  INFO:      '#f0f9ff',
};

function formatRelTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

// ── Toast pop-up component ───────────────────────────────────────────────────

interface ToastProps { notification: AppNotification; onClose: () => void; }

function NotificationToast({ notification, onClose }: ToastProps) {
  const meta = EVENT_META[notification.type] ?? { icon: '🔔', color: '#6b7280' };
  
  useEffect(() => {
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        background: 'white',
        border: `1px solid ${meta.color}30`,
        borderLeft: `4px solid ${meta.color}`,
        borderRadius: '10px',
        padding: '0.85rem 1rem',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        maxWidth: '340px',
        animation: 'slideInRight 0.3s ease-out',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start',
      }}
    >
      <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{meta.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b', marginBottom: '0.2rem' }}>
          {notification.title}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
          {notification.message}
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#94a3b8', fontSize: '1rem', padding: 0, lineHeight: 1,
          flexShrink: 0,
        }}
      >×</button>
    </div>
  );
}

// ── Main NotificationCenter ──────────────────────────────────────────────────

export default function NotificationCenter({ notifications, unreadCount, onMarkRead }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) onMarkRead();
  };

  const reversed = [...notifications].reverse();

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      {/* Bell button */}
      <button
        id="notification-bell"
        onClick={handleOpen}
        title="Notifications"
        style={{
          position: 'relative',
          background: open ? 'var(--brand-light)' : 'none',
          border: '1px solid',
          borderColor: open ? 'var(--brand)' : 'var(--border)',
          borderRadius: '8px',
          padding: '0.35rem 0.6rem',
          cursor: 'pointer',
          color: open ? 'var(--brand)' : 'var(--text-muted)',
          fontSize: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.15s ease',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            background: '#dc2626',
            color: 'white',
            borderRadius: '999px',
            fontSize: '0.62rem',
            fontWeight: 700,
            minWidth: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid white',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '360px',
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.14)',
          zIndex: 200,
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}>
          {/* Header */}
          <div style={{
            padding: '0.85rem 1rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-2)',
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              Notifications
            </div>
            <span style={{
              fontSize: '0.7rem', color: 'var(--text-muted)',
              background: 'var(--border)', padding: '2px 8px',
              borderRadius: '999px',
            }}>
              {notifications.length} events
            </span>
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {reversed.length === 0 ? (
              <div style={{
                padding: '2rem', textAlign: 'center',
                color: 'var(--text-muted)', fontSize: '0.82rem',
              }}>
                No notifications yet
              </div>
            ) : (
              reversed.map((n, i) => {
                const meta = EVENT_META[n.type] ?? { icon: '🔔', color: '#6b7280' };
                const bg = SEVERITY_BG[n.severity] ?? '#f8fafc';
                return (
                  <div
                    key={i}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: i < reversed.length - 1 ? '1px solid var(--border)' : 'none',
                      background: i === 0 ? bg : 'white',
                      display: 'flex',
                      gap: '0.65rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span style={{
                      fontSize: '1rem',
                      lineHeight: 1,
                      marginTop: '2px',
                      flexShrink: 0,
                    }}>{meta.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        color: meta.color,
                        marginBottom: '0.15rem',
                      }}>
                        {n.title}
                      </div>
                      <div style={{
                        fontSize: '0.73rem',
                        color: '#475569',
                        lineHeight: 1.4,
                        wordBreak: 'break-word',
                      }}>
                        {n.message}
                      </div>
                      <div style={{
                        fontSize: '0.68rem',
                        color: '#94a3b8',
                        marginTop: '0.25rem',
                      }}>
                        {formatRelTime(n.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '0.6rem 1rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface-2)',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}>
            Events are real-time — last 50 shown
          </div>
        </div>
      )}
    </div>
  );
}

// ── Export toast separately for use in App ───────────────────────────────────
export { NotificationToast };

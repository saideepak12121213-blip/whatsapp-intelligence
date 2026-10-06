import React, { useState } from 'react';
import { Bell, ShieldAlert, Calendar, Clock, Check, Send, Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';

export default function NotificationsView({
  notifications,
  user,
  onBroadcastNotification,
  onMarkRead,
  onSelectTask
}) {
  const isAdmin = user?.role === 'ADMIN';
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    setIsSending(true);
    try {
      await onBroadcastNotification({
        title: broadcastTitle,
        message: broadcastMessage,
        type: isMandatory ? 'MANDATORY' : 'ANNOUNCEMENT',
        is_mandatory: isMandatory
      });
      setBroadcastTitle('');
      setBroadcastMessage('');
    } finally {
      setIsSending(false);
    }
  };

  const getTypeBadge = (notif) => {
    if (notif.is_mandatory || notif.type === 'MANDATORY') {
      return <span className="badge badge-critical" style={{ fontSize: '0.68rem' }}><ShieldAlert size={11} /> MANDATORY</span>;
    }
    if (notif.type === 'DEADLINE') {
      return <span className="badge badge-medium" style={{ fontSize: '0.68rem', color: '#fbbf24' }}><Calendar size={11} /> DEADLINE</span>;
    }
    if (notif.type === 'REMINDER') {
      return <span className="badge badge-low" style={{ fontSize: '0.68rem', color: '#38bdf8' }}><Clock size={11} /> REMINDER</span>;
    }
    return <span className="badge badge-high" style={{ fontSize: '0.68rem' }}><Bell size={11} /> UPDATE</span>;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
          Class Notifications & Real-Time Alerts
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Sections 10 & 11: Real-time alerts for deadline changes, newly published posts, personal reminders, and mandatory announcements.
        </p>
      </div>

      {/* Admin Broadcast Card */}
      {isAdmin && (
        <form onSubmit={handleSendBroadcast} className="glass-panel" style={{
          padding: '22px',
          background: 'rgba(30, 41, 59, 0.85)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontWeight: 700, fontSize: '0.95rem' }}>
            <Send size={16} /> Broadcast Notification to All Students
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Alert Title</label>
              <input
                type="text"
                placeholder="e.g. Mandatory Lab Submission Notice"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isMandatory}
                  onChange={(e) => setIsMandatory(e.target.checked)}
                />
                Mark as Mandatory Requirement
              </label>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Message Context</label>
            <input
              type="text"
              placeholder="e.g. Python Assignment deadline changed to 8 October, 11:59 PM. Please verify your files."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={isSending} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
              <Send size={14} /> Send Broadcast
            </button>
          </div>
        </form>
      )}

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {(!notifications || notifications.length === 0) ? (
          <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={40} style={{ margin: '0 auto 12px' }} />
            <h3 style={{ color: '#f8fafc' }}>No notifications yet</h3>
            <p style={{ fontSize: '0.85rem' }}>Updates for deadline changes, mandatory announcements, and personal reminders will appear here.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className="glass-panel"
              onClick={() => {
                if (onMarkRead) onMarkRead(n.id);
                if (n.task_id && onSelectTask) onSelectTask(n.task_id);
              }}
              style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: n.task_id ? 'pointer' : 'default',
                borderLeft: n.is_mandatory
                  ? '4px solid #ef4444'
                  : n.type === 'DEADLINE'
                  ? '4px solid #f59e0b'
                  : n.type === 'REMINDER'
                  ? '4px solid #38bdf8'
                  : '4px solid #6366f1',
                background: !n.is_read ? 'rgba(99, 102, 241, 0.06)' : undefined,
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getTypeBadge(n)}
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>
                    {n.title}
                  </h4>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {n.message}
                </p>
                {n.task_id && (
                  <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 600 }}>
                    Click to view related post & source details →
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {new Date(n.created_at).toLocaleString()}
                </span>
                {!n.is_read && (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

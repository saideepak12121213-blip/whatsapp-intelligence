import React from 'react';
import { X, MessageSquare, Clock, User, CheckCircle2, History, AlertCircle, MapPin, ExternalLink, Info } from 'lucide-react';

export default function SourceModal({ task, onClose }) {
  if (!task) return null;

  let historyItems = [];
  try {
    if (task.source_history) {
      historyItems = typeof task.source_history === 'string'
        ? JSON.parse(task.source_history)
        : task.source_history;
    }
  } catch {
    historyItems = [];
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '680px',
        width: '100%',
        maxHeight: '88vh',
        overflowY: 'auto',
        padding: '28px',
        background: '#111827',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-medium" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MessageSquare size={13} /> Source Traceability
              </span>
              <span className="badge badge-high" style={{ fontSize: '0.68rem' }}>
                {task.category}
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '6px', borderRadius: '50%', minWidth: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Section 4: Exact Source Traceability Card */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            color: '#38bdf8',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '10px'
          }}>
            Source: WhatsApp message
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px', fontSize: '0.85rem' }}>
            <div style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Timestamp: </span>
              <strong style={{ color: '#f8fafc' }}>{task.source_timestamp || '6 October 2026, 10:42 AM'}</strong>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Sender: </span>
              <strong style={{ color: '#38bdf8' }}>{task.source_sender || 'Faculty / Coordinator'}</strong>
            </div>
          </div>

          <div style={{ marginBottom: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Original message:
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            padding: '16px',
            borderRadius: '10px',
            borderLeft: '4px solid #6366f1',
            fontSize: '0.92rem',
            lineHeight: 1.55,
            color: '#f1f5f9',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace'
          }}>
            {task.source_text || 'No raw source text preserved.'}
          </div>

          {/* Structured Attributes Extracted */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <div>Deadline: <strong style={{ color: '#f8fafc' }}>{task.deadline_original_text || 'None'}</strong></div>
            {task.time && <div>Time: <strong style={{ color: '#f8fafc' }}>{task.time}</strong></div>}
            {task.location && <div>Location: <strong style={{ color: '#f8fafc' }}>{task.location}</strong></div>}
            <div>AI Confidence: <strong style={{ color: '#34d399' }}>{Math.round((task.confidence || 0.95) * 100)}%</strong></div>
          </div>

          {task.registration_link && (
            <div style={{ marginTop: '10px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Extracted Link: </span>
              <a href={task.registration_link} target="_blank" rel="noreferrer" style={{ color: '#06b6d4', textDecoration: 'underline' }}>
                {task.registration_link}
              </a>
            </div>
          )}
        </div>

        {/* Deduplication & Reminders Consolidated */}
        {task.additional_source_count > 0 && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
              <History size={16} />
              Deduplication Active: {task.additional_source_count} Additional Mention(s) Merged
            </div>
            <p style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
              Subsequent reminders and deadline adjustments were consolidated into this single class task record to prevent duplicate clutter.
            </p>
          </div>
        )}

        {/* Audit Activity Timeline */}
        {historyItems.length > 0 && (
          <div>
            <h4 style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={14} /> Source Activity Timeline
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {historyItems.map((item, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '0.82rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: item.type === 'DEADLINE_UPDATE' || item.type === 'ADMIN_DEADLINE_EXTENSION' ? '#fbbf24' : item.type === 'REMINDER' ? '#38bdf8' : '#94a3b8' }}>
                      {item.type === 'DEADLINE_UPDATE' || item.type === 'ADMIN_DEADLINE_EXTENSION' ? '⚡ Deadline Updated' : item.type === 'REMINDER' ? '🔔 Reminder Recorded' : 'Initial Creation'}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{item.timestamp || 'Chat export'}</span>
                  </div>
                  <div style={{ color: '#cbd5e1', fontStyle: 'italic' }}>
                    "{item.text || item.deadline_text}"
                  </div>
                  {item.sender && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '3px' }}>
                      By: {item.sender}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close Source View
          </button>
        </div>
      </div>
    </div>
  );
}

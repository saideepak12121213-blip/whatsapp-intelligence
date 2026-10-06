import React from 'react';
import { History, FileText, Trash2, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminHistoryView({ uploads, onDeleteUpload }) {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
          WhatsApp Processing History & Audit Log
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Section 14: Comprehensive audit trail of imported WhatsApp chat exports, deduplication metrics, and privacy purge controls.
        </p>
      </div>

      <div className="glass-panel" style={{
        padding: '18px 22px',
        background: 'rgba(6, 182, 212, 0.08)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <ShieldCheck size={28} color="#06b6d4" />
        <div>
          <h4 style={{ color: '#f8fafc', fontSize: '0.92rem', marginBottom: '2px' }}>Privacy & Data Minimization Guaranteed</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Only authorized operators upload class chats. Raw chat messages can be purged anytime while preserving official class tasks.
          </p>
        </div>
      </div>

      {uploads.length === 0 ? (
        <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <History size={40} style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: '#f8fafc' }}>No chat upload logs</h3>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '8px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 16px' }}>Upload Date/Time</th>
                <th style={{ padding: '14px 16px' }}>File Name</th>
                <th style={{ padding: '14px 16px' }}>Messages Found</th>
                <th style={{ padding: '14px 16px' }}>New Messages</th>
                <th style={{ padding: '14px 16px' }}>Duplicate / Skipped</th>
                <th style={{ padding: '14px 16px' }}>AI Extracted</th>
                <th style={{ padding: '14px 16px' }}>Approved</th>
                <th style={{ padding: '14px 16px' }}>Rejected</th>
                <th style={{ padding: '14px 16px' }}>Status / Errors</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map(u => (
                <tr key={u.upload_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                    {new Date(u.uploaded_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#38bdf8', fontWeight: 600 }}>
                    {u.file_name}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#f8fafc' }}>
                    {u.message_count}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#34d399', fontWeight: 700 }}>
                    +{u.new_message_count}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#94a3b8' }}>
                    {u.skipped_message_count || 0}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#fbbf24', fontWeight: 700 }}>
                    {u.items_extracted || 0}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#10b981' }}>
                    {u.items_approved || 0}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#f87171' }}>
                    {u.items_rejected || 0}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {u.error_message ? (
                      <span className="badge badge-critical" title={u.error_message}>
                        ERROR
                      </span>
                    ) : (
                      <span className="badge badge-completed">
                        {u.processing_status}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => onDeleteUpload(u.upload_id)}
                      className="btn btn-danger"
                      style={{ padding: '5px 10px', fontSize: '0.74rem' }}
                      title="Purge raw chat text for privacy compliance"
                    >
                      <Trash2 size={12} /> Purge Raw Data
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

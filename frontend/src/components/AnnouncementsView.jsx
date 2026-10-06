import React from 'react';
import { Bell, User, Clock, AlertCircle, Sparkles } from 'lucide-react';

export default function AnnouncementsView({ announcements }) {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
          Class Announcements & Notices
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Official updates, schedule adjustments, and notifications from instructors
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Bell size={40} style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: '#f8fafc' }}>No announcements posted</h3>
          <p style={{ fontSize: '0.85rem' }}>No class announcements found in uploaded chats.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {announcements.map((item) => {
            const isHigh = item.priority === 'HIGH' || item.priority === 'CRITICAL';
            return (
              <div key={item.announcement_id} className="glass-panel" style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: isHigh ? '5px solid #ef4444' : '5px solid #06b6d4'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="badge badge-medium" style={{ fontSize: '0.68rem' }}>
                      {item.category || 'ANNOUNCEMENT'}
                    </span>
                    <span className={`badge ${isHigh ? 'badge-critical' : 'badge-low'}`} style={{ fontSize: '0.68rem' }}>
                      {item.priority}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
                    {item.title}
                  </h3>

                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    color: '#e2e8f0',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    marginBottom: '16px'
                  }}>
                    {item.content}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={13} color="#38bdf8" /> {item.source_sender || 'Faculty'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} /> {item.source_timestamp || 'Recent'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

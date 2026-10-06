import React from 'react';
import { ExternalLink, Link2, User, Clock, Globe } from 'lucide-react';

export default function LinksView({ links }) {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
          Extracted Class Links & Portals
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Verified submission forms, workshop registrations, and portals extracted from messages
        </p>
      </div>

      {links.length === 0 ? (
        <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Link2 size={40} style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: '#f8fafc' }}>No links extracted</h3>
          <p style={{ fontSize: '0.85rem' }}>No web links or portal URLs found in uploaded chats.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {links.map((link) => (
            <div key={link.link_id} className="glass-panel" style={{
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderLeft: '5px solid #06b6d4'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge badge-medium" style={{ fontSize: '0.68rem' }}>
                    {link.category || 'PORTAL'}
                  </span>
                  <Globe size={16} color="#06b6d4" />
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                  {link.title || 'Class Resource'}
                </h3>

                <div style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  marginBottom: '16px',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  color: '#38bdf8'
                }}>
                  {link.url}
                </div>
              </div>

              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px',
                  marginBottom: '14px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={13} color="#38bdf8" /> {link.sender || 'Sender'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} /> {link.timestamp || 'Exported'}
                  </span>
                </div>

                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '9px', fontSize: '0.82rem' }}
                >
                  <ExternalLink size={14} /> Open Resource Link
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

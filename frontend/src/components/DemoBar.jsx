import React from 'react';
import { UserCheck, Shield, Sparkles } from 'lucide-react';

export default function DemoBar({ currentUser, onQuickLogin }) {
  const accounts = [
    { name: 'Prof. Vance (Admin)', email: 'admin@classflow.demo', pass: 'admin123', role: 'ADMIN', color: '#6366f1' },
    { name: 'Alice (Student A)', email: 'studentA@classflow.demo', pass: 'student123', role: 'STUDENT', color: '#10b981' },
    { name: 'Bob (Student B)', email: 'studentB@classflow.demo', pass: 'student123', role: 'STUDENT', color: '#06b6d4' },
    { name: 'Charlie (Student C)', email: 'studentC@classflow.demo', pass: 'student123', role: 'STUDENT', color: '#f59e0b' },
  ];

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.95)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '8px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '0.82rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)',
      flexWrap: 'wrap',
      gap: '10px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(99, 102, 241, 0.2)',
          color: '#818cf8',
          padding: '3px 8px',
          borderRadius: '6px',
          fontWeight: 700,
          fontSize: '0.74rem'
        }}>
          <Sparkles size={12} /> HACKATHON LIVE DEMO BAR
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          Active View:
        </span>
        <strong style={{
          color: currentUser?.role === 'ADMIN' ? '#818cf8' : '#34d399',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          {currentUser?.role === 'ADMIN' ? <Shield size={13} /> : <UserCheck size={13} />}
          {currentUser?.name || 'Guest'} ({currentUser?.role || 'NONE'})
        </strong>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>1-Click Switch:</span>
        {accounts.map(acc => {
          const isActive = currentUser?.email === acc.email;
          return (
            <button
              key={acc.email}
              onClick={() => onQuickLogin(acc.email, acc.pass)}
              className="btn"
              style={{
                padding: '4px 10px',
                fontSize: '0.76rem',
                borderRadius: '8px',
                background: isActive ? acc.color : 'rgba(255, 255, 255, 0.06)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                border: isActive ? `1px solid ${acc.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {acc.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

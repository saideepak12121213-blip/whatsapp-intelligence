import React from 'react';
import { ShieldCheck, Lock, EyeOff, Trash2, Server, Key, AlertTriangle } from 'lucide-react';

export default function PrivacyView() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '850px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
          Data Privacy & Architecture Guarantees
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          How ClassFlow AI protects student confidentiality while making group communications structured
        </p>
      </div>

      {/* Official Notice */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '14px',
        padding: '20px 24px',
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start'
      }}>
        <AlertTriangle size={24} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ color: '#fbbf24', fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
            Privacy Notice
          </h4>
          <p style={{ fontSize: '0.86rem', color: '#f1f5f9', lineHeight: 1.55 }}>
            "Only authorized class chat data should be uploaded. Do not upload private conversations without appropriate authorization."
          </p>
        </div>
      </div>

      {/* 5 Core Architectural Pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <EyeOff size={20} color="#06b6d4" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              Zero Personal Account Harvesting
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Students never log in with WhatsApp, share session cookies, or connect personal phone numbers. The system works strictly from operator-exported academic logs.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Lock size={20} color="#10b981" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              Strict State Isolation
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Tasks belong to the class; completions belong to the individual. Database constraints enforce that Student A can never query or mutate Student B's completion records.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Server size={20} color="#6366f1" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              Operator Gatekeeping
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Students cannot inject or upload raw files. Only verified class representatives and professors have ingestion rights, eliminating spam or forged task announcements.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Trash2 size={20} color="#f43f5e" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              Purge Controls & Minimization
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Administrators can purge raw WhatsApp message records at any time. Verified academic task items remain intact without storing sensitive student chat transcripts.
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { MessageSquareCode, Shield, User, Lock, Mail, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function AuthView({ onAuthSuccess, onQuickLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let res;
      if (isRegister) {
        res = await api.auth.register({
          name,
          email,
          password,
          student_id: studentId || undefined,
          role: 'STUDENT',
        });
      } else {
        res = await api.auth.login(email, password);
      }
      localStorage.setItem('classflow_token', res.access_token);
      onAuthSuccess(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { title: 'Prof. Vance (Class Operator)', role: 'ADMIN', email: 'admin@classflow.demo', pass: 'admin123', desc: 'Can upload chats, review items & see aggregate completion stats', color: '#6366f1' },
    { title: 'Alice (Student A)', role: 'STUDENT', email: 'studentA@classflow.demo', pass: 'student123', desc: 'Use to mark Python assignment complete', color: '#10b981' },
    { title: 'Bob (Student B)', role: 'STUDENT', email: 'studentB@classflow.demo', pass: 'student123', desc: 'Verify Python assignment remains pending for Bob!', color: '#06b6d4' },
    { title: 'Charlie (Student C)', role: 'STUDENT', email: 'studentC@classflow.demo', pass: 'student123', desc: 'Independent student view & private notes', color: '#f59e0b' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at 50% 10%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)'
    }}>
      <div style={{ maxWidth: '960px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '30px', alignItems: 'center' }}>
        {/* Left Branding & Demo Accounts */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              background: 'var(--gradient-brand)',
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 6px 20px rgba(99, 102, 241, 0.45)'
            }}>
              <MessageSquareCode size={26} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                ClassFlow <span style={{ color: '#06b6d4' }}>AI</span>
              </h1>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                WhatsApp Intelligence & Student Task Assistant
              </p>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
            Transform noisy WhatsApp class groups into clean, shared assignments and announcements — with 100% private and independent student completion states.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⚡ 1-Click Demo Accounts (Instant Hackathon Access):
            </span>
            {demoAccounts.map(acc => (
              <button
                key={acc.email}
                onClick={() => onQuickLogin(acc.email, acc.pass)}
                className="btn btn-secondary"
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'left',
                  borderLeft: `4px solid ${acc.color}`
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.86rem' }}>
                    {acc.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {acc.desc}
                  </div>
                </div>
                <ArrowRight size={14} color={acc.color} />
              </button>
            ))}
          </div>
        </div>

        {/* Right Form Card */}
        <div className="glass-panel" style={{ padding: '32px', background: '#111827' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <button
              onClick={() => { setIsRegister(false); setError(null); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: !isRegister ? '#f8fafc' : 'var(--text-muted)',
                fontWeight: !isRegister ? 700 : 500,
                fontSize: '1rem',
                cursor: 'pointer',
                borderBottom: !isRegister ? '2px solid #6366f1' : 'none',
                paddingBottom: '8px'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(null); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: isRegister ? '#f8fafc' : 'var(--text-muted)',
                fontWeight: isRegister ? 700 : 500,
                fontSize: '1rem',
                cursor: 'pointer',
                borderBottom: isRegister ? '2px solid #6366f1' : 'none',
                paddingBottom: '8px'
              }}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '0.82rem',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {isRegister && (
              <>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alice Johnson"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    Student ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. STU-2026-001"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '10px', fontSize: '0.92rem' }}
            >
              {loading ? 'Authenticating...' : isRegister ? 'Register Student Account' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

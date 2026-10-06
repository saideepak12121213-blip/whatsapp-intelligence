import React from 'react';
import { Users, CheckCircle2, Clock, Award, Shield } from 'lucide-react';

export default function AdminStudentsView({ students }) {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
          Registered Student Roster
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Individual student progress monitoring. Completion states are tracked independently per student.
        </p>
      </div>

      {students.length === 0 ? (
        <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Users size={40} style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: '#f8fafc' }}>No students registered</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {students.map(s => {
            return (
              <div key={s.id} className="glass-panel" style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: '5px solid #6366f1'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="badge badge-medium" style={{ fontSize: '0.68rem' }}>
                      {s.student_id || `STU-${s.id}`}
                    </span>
                    <span className="badge badge-completed" style={{ fontSize: '0.68rem' }}>
                      {s.completion_rate}% Complete
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                    {s.name}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    {s.email}
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: `${s.completion_rate}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #6366f1, #10b981)',
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '0.82rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399' }}>
                    <CheckCircle2 size={16} />
                    <span>Completed: <strong>{s.completed_tasks}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24' }}>
                    <Clock size={16} />
                    <span>Pending: <strong>{s.pending_tasks}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

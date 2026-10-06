import React from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DeadlinesView({ tasks, onStatusChange, onViewSource }) {
  // Sort tasks by deadline
  const tasksWithDeadlines = tasks
    .filter(t => t.deadline || t.deadline_original_text)
    .sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
          Class Deadlines Timeline
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Sequential chronological roadmap of upcoming assignments & exams
        </p>
      </div>

      {tasksWithDeadlines.length === 0 ? (
        <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Calendar size={40} style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: '#f8fafc' }}>No deadlines scheduled</h3>
          <p style={{ fontSize: '0.85rem' }}>No upcoming deadlines found in current class uploads.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
          {tasksWithDeadlines.map((task, idx) => {
            const isCompleted = task.personal_status === 'COMPLETED';
            let deadlineDateStr = task.deadline_original_text || 'Date TBD';
            let daysDiffText = '';

            if (task.deadline) {
              const d = new Date(task.deadline);
              deadlineDateStr = `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
              const diffMs = d - new Date();
              const diffHours = Math.round(diffMs / (1000 * 60 * 60));
              if (diffHours < 0) {
                daysDiffText = `Overdue by ${Math.abs(diffHours)}h`;
              } else if (diffHours < 24) {
                daysDiffText = `In ${diffHours} hours`;
              } else {
                daysDiffText = `In ${Math.round(diffHours / 24)} days`;
              }
            }

            return (
              <div key={task.task_id} className="glass-panel" style={{
                padding: '18px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                borderLeft: isCompleted
                  ? '5px solid #10b981'
                  : task.is_overdue
                  ? '5px solid #ef4444'
                  : '5px solid #6366f1'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <div style={{
                    background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                    padding: '12px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '70px',
                    textAlign: 'center'
                  }}>
                    <Calendar size={18} color={isCompleted ? '#10b981' : '#818cf8'} style={{ marginBottom: '4px' }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f8fafc' }}>
                      {daysDiffText || 'Upcoming'}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                      <span className="badge badge-medium" style={{ fontSize: '0.65rem' }}>
                        {task.category}
                      </span>
                      <span className={`badge ${task.priority === 'CRITICAL' ? 'badge-critical' : task.priority === 'HIGH' ? 'badge-high' : 'badge-low'}`}>
                        {task.priority}
                      </span>
                    </div>

                    <h4 style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: isCompleted ? 'var(--text-secondary)' : '#f8fafc',
                      textDecoration: isCompleted ? 'line-through' : 'none'
                    }}>
                      {task.title}
                    </h4>

                    <div style={{ fontSize: '0.82rem', color: task.is_overdue ? '#f87171' : 'var(--text-secondary)', marginTop: '4px' }}>
                      📅 Due: <strong>{deadlineDateStr}</strong>
                      {task.deadline_original_text && task.deadline && (
                        <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                          (Export phrasing: "{task.deadline_original_text}")
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => onViewSource(task)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  >
                    View Source
                  </button>
                  <button
                    onClick={() => onStatusChange(task.task_id, isCompleted ? 'PENDING' : 'COMPLETED')}
                    className={`btn ${isCompleted ? 'btn-secondary' : 'btn-success'}`}
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    {isCompleted ? 'Reopen' : '✓ Mark Complete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import {
  Clock, CheckCircle2, AlertTriangle, Calendar, Bell, ArrowRight,
  TrendingUp, Sparkles, BookOpen, BellRing, MapPin, ExternalLink,
  ShieldAlert, RefreshCw, Layers
} from 'lucide-react';
import TaskCard from './TaskCard';

export default function StudentDashboardView({
  dashboardStats,
  tasks,
  announcements,
  notifications,
  onStatusChange,
  onViewSource,
  onNavigateToTasks,
  onSelectCategory
}) {
  const pendingTasks = tasks.filter(t => t.personal_status !== 'COMPLETED').slice(0, 4);
  const reminderTasks = tasks.filter(t => t.personal_status === 'REMIND_LATER');
  const upcomingDeadlines = tasks
    .filter(t => t.deadline && new Date(t.deadline) > new Date() && t.personal_status !== 'COMPLETED')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4);
  const recentlyUpdated = tasks
    .filter(t => t.additional_source_count > 0 || (t.source_history && t.source_history.includes('UPDATE')))
    .slice(0, 3);

  const importantNotifs = (notifications || []).filter(n => n.is_mandatory || n.type === 'DEADLINE' || n.type === 'MANDATORY').slice(0, 3);

  const statCards = [
    { label: 'Pending Tasks', value: dashboardStats?.pending_count || 0, icon: Clock, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    { label: 'Completed Tasks', value: dashboardStats?.completed_count || 0, icon: CheckCircle2, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    { label: 'Personal Reminders', value: dashboardStats?.reminders_count || reminderTasks.length, icon: BellRing, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)' },
    { label: 'Due Today', value: dashboardStats?.due_today_count || 0, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    { label: 'Due This Week', value: dashboardStats?.due_this_week_count || 0, icon: Calendar, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
    { label: 'Overdue', value: dashboardStats?.overdue_count || 0, icon: AlertTriangle, color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)' },
  ];

  const quickCategories = [
    { label: 'Hackathons', slug: 'HACKATHON', color: '#ec4899' },
    { label: 'Workshops', slug: 'WORKSHOP', color: '#8b5cf6' },
    { label: 'Events', slug: 'EVENT', color: '#3b82f6' },
    { label: 'Exams', slug: 'EXAM', color: '#ef4444' },
    { label: 'Exam Fees', slug: 'EXAM_FEE', color: '#f59e0b' },
    { label: 'Semester Fees', slug: 'SEMESTER_FEE', color: '#eab308' },
    { label: 'Registrations', slug: 'REGISTRATION', color: '#06b6d4' },
    { label: 'Assignments', slug: 'ASSIGNMENT', color: '#10b981' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '28px',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '750px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>
            <Sparkles size={14} /> CLASSFLOW AI STUDENT PORTAL
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Your Academic Intelligence Dashboard
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
            Authorized WhatsApp class announcements distilled into structured deliverables. Posts belong to the entire class, but your <strong>DONE / REMIND ME LATER</strong> states are 100% personal and private.
          </p>
        </div>
      </div>

      {/* Quick Category Badges */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
        <button
          onClick={() => onSelectCategory && onSelectCategory('ALL')}
          className="btn"
          style={{ padding: '6px 14px', fontSize: '0.78rem', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', color: '#fff' }}
        >
          All Categories
        </button>
        {quickCategories.map(c => (
          <button
            key={c.slug}
            onClick={() => onSelectCategory && onSelectCategory(c.slug)}
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-secondary)',
              border: `1px solid ${c.color}40`,
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: c.color, marginRight: '6px' }} />
            {c.label}
          </button>
        ))}
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '14px'
      }}>
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-panel" style={{
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: stat.bg,
              border: `1px solid ${stat.color}30`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {stat.label}
                </span>
                <Icon size={16} color={stat.color} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: stat.color, letterSpacing: '-0.03em' }}>
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 17 REQUIREMENT 1: Important Notifications */}
      {importantNotifs.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '16px',
          padding: '18px 22px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px' }}>
            <ShieldAlert size={17} /> Important Faculty & Mandatory Updates
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {importantNotifs.map((n, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.86rem',
                color: '#f1f5f9'
              }}>
                <div>
                  <span className="badge badge-critical" style={{ fontSize: '0.65rem', marginRight: '8px' }}>
                    {n.type}
                  </span>
                  <strong>{n.title}:</strong> {n.message}
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 17 REQUIREMENT 2: Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="#818cf8" /> Upcoming Deadlines
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Time-sensitive submissions sorted by urgency
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '14px'
          }}>
            {upcomingDeadlines.map(t => {
              const d = new Date(t.deadline);
              const diffDays = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={t.task_id} className="glass-panel" style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                  borderTop: diffDays <= 1 ? '3px solid #ef4444' : '3px solid #6366f1'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="badge badge-medium" style={{ fontSize: '0.68rem' }}>{t.category}</span>
                      <span style={{ fontSize: '0.74rem', color: diffDays <= 1 ? '#f87171' : '#38bdf8', fontWeight: 700 }}>
                        {diffDays <= 0 ? 'Due Today' : diffDays === 1 ? 'Due Tomorrow' : `In ${diffDays} days`}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                      {t.title}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {t.deadline_original_text}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button onClick={() => onViewSource(t)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.74rem', color: '#38bdf8' }}>
                      Source
                    </button>
                    <button
                      onClick={() => onStatusChange(t.task_id, 'COMPLETED', null, t.student_note)}
                      className="btn btn-success"
                      style={{ padding: '4px 12px', fontSize: '0.74rem' }}
                    >
                      Mark Done
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 17 REQUIREMENT 3: Pending Tasks */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#f59e0b" /> Pending Tasks
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Actionable class items awaiting your completion
            </p>
          </div>
          <button onClick={onNavigateToTasks} className="btn btn-secondary" style={{ fontSize: '0.82rem', gap: '5px' }}>
            View All ({tasks.length}) <ArrowRight size={14} />
          </button>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ color: '#f8fafc', marginBottom: '6px' }}>You're all caught up!</h4>
            <p style={{ fontSize: '0.85rem' }}>No pending class assignments right now.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '18px'
          }}>
            {pendingTasks.map(task => (
              <TaskCard
                key={task.task_id}
                task={task}
                onStatusChange={onStatusChange}
                onViewSource={onViewSource}
              />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 17 REQUIREMENT 4: Recently Updated Information */}
      {recentlyUpdated.length > 0 && (
        <div>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={17} color="#38bdf8" /> Recently Updated Information
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Posts with extended deadlines or consolidated WhatsApp reminders
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {recentlyUpdated.map(t => (
              <div key={t.task_id} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-high" style={{ fontSize: '0.68rem' }}>{t.category}</span>
                  <span style={{ fontSize: '0.74rem', color: '#fbbf24' }}>
                    {t.additional_source_count > 0 ? `${t.additional_source_count} reminders merged` : 'Timeline extended'}
                  </span>
                </div>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#f8fafc' }}>{t.title}</h4>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Current Deadline: <strong style={{ color: '#f8fafc' }}>{t.deadline_original_text}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button onClick={() => onViewSource(t)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.74rem', color: '#38bdf8' }}>
                    View History
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

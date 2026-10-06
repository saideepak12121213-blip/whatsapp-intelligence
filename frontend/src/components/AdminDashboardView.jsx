import React from 'react';
import {
  BarChart3, UploadCloud, ListChecks, Users, History, TrendingUp,
  CheckCircle2, AlertCircle, FileText, Sparkles, Layers, Clock,
  Calendar, ShieldAlert, ArrowRight, RefreshCw, Tag
} from 'lucide-react';

export default function AdminDashboardView({ adminStats, tasks, onNavigate }) {
  const pendingReviewTasks = (tasks || []).filter(t => t.status === 'PENDING_REVIEW');
  const approvedTasks = (tasks || []).filter(t => t.status === 'APPROVED');
  const importantTasks = approvedTasks.filter(t => t.priority === 'CRITICAL' || t.priority === 'HIGH' || t.is_mandatory_notification).slice(0, 4);

  const statCards = [
    { label: 'Chat Uploads', value: adminStats?.total_uploads || 0, icon: UploadCloud, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
    { label: 'Messages Processed', value: adminStats?.total_messages || 0, icon: FileText, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
    { label: 'Awaiting AI Review', value: adminStats?.pending_review_tasks || pendingReviewTasks.length, icon: Clock, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    { label: 'Approved Posts', value: adminStats?.approved_tasks || approvedTasks.length, icon: CheckCircle2, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    { label: 'Registered Students', value: adminStats?.total_students || 0, icon: Users, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
    { label: 'Overall Completion', value: `${adminStats?.overall_completion_rate || 0}%`, icon: TrendingUp, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Admin Hero */}
      <div className="glass-panel" style={{
        padding: '28px',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '750px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>
            <Sparkles size={14} /> CLASS OPERATOR & ADMINISTRATOR CONTROL CONSOLE
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            ClassFlow Intelligence Console
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
            Upload authorized WhatsApp class-group exports to extract actionable academic intelligence. Review AI-extracted items before publishing. Only approved posts become visible to students.
          </p>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-panel" style={{
              padding: '18px',
              background: stat.bg,
              border: `1px solid ${stat.color}35`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {stat.label}
                </span>
                <Icon size={17} color={stat.color} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: stat.color, letterSpacing: '-0.03em' }}>
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 17 REQUIREMENT 1 & 2: New WhatsApp Upload & AI Items Awaiting Review */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Item 1: New WhatsApp Upload */}
        <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UploadCloud size={19} color="#6366f1" /> 1. New WhatsApp Upload
            </h3>
            <span className="badge badge-medium" style={{ fontSize: '0.72rem' }}>INCREMENTAL</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
            Upload raw WhatsApp exported .txt chats. Incremental updates automatically skip duplicate messages and extract only new deliverables.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => onNavigate('admin_upload')} className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '0.84rem' }}>
              <UploadCloud size={15} /> Open Upload Center
            </button>
            <button onClick={() => onNavigate('admin_history')} className="btn btn-secondary" style={{ padding: '10px 14px', fontSize: '0.84rem' }}>
              <History size={15} /> Upload History
            </button>
          </div>
        </div>

        {/* Item 2: AI Items Awaiting Review */}
        <div className="glass-panel" style={{
          padding: '24px',
          borderLeft: pendingReviewTasks.length > 0 ? '4px solid #f59e0b' : '4px solid #10b981',
          background: pendingReviewTasks.length > 0 ? 'rgba(245, 158, 11, 0.05)' : undefined
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={19} color={pendingReviewTasks.length > 0 ? '#f59e0b' : '#10b981'} />
              2. AI Items Awaiting Review
            </h3>
            <span className={`badge ${pendingReviewTasks.length > 0 ? 'badge-high' : 'badge-completed'}`}>
              {pendingReviewTasks.length} PENDING
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
            {pendingReviewTasks.length > 0
              ? `${pendingReviewTasks.length} newly extracted items require your review and approval before students can see them.`
              : 'All extracted items have been reviewed! All active class posts are verified.'}
          </p>
          <button
            onClick={() => onNavigate('admin_review')}
            className={`btn ${pendingReviewTasks.length > 0 ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '10px 18px',
              fontSize: '0.84rem',
              background: pendingReviewTasks.length > 0 ? '#f59e0b' : undefined,
              color: pendingReviewTasks.length > 0 ? '#0f172a' : undefined,
              fontWeight: 700
            }}
          >
            Review Extracted Items ({pendingReviewTasks.length}) <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* SECTION 17 REQUIREMENT 3: Important Posts */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListChecks size={18} color="#10b981" /> 3. Important Published Posts
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Official class posts published and visible to all registered students
            </p>
          </div>
          <button onClick={() => onNavigate('admin_tasks')} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
            View All Approved ({approvedTasks.length}) <ArrowRight size={14} />
          </button>
        </div>

        {importantTasks.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            No high-priority approved tasks right now.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {importantTasks.map(t => (
              <div key={t.task_id} style={{
                background: 'rgba(15, 23, 42, 0.7)',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-medium" style={{ fontSize: '0.68rem' }}>{t.category}</span>
                  <span className={`badge ${t.priority === 'CRITICAL' ? 'badge-critical' : 'badge-high'}`} style={{ fontSize: '0.65rem' }}>
                    {t.priority}
                  </span>
                </div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>{t.title}</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Due: <strong style={{ color: '#f8fafc' }}>{t.deadline_original_text || 'None'}</strong>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#34d399', marginTop: '4px' }}>
                  Student Completion: {t.completed_by_count || 0} / {t.total_students || 0} ({t.completion_percentage || 0}%)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 17 REQUIREMENT 4: Recent Changes & Architecture */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '22px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={17} color="#38bdf8" /> 4. Recent System Changes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Last WhatsApp Ingestion:</span>
              <strong style={{ color: '#f8fafc' }}>
                {adminStats?.last_upload_time ? new Date(adminStats.last_upload_time).toLocaleString() : 'Ready for upload'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Centralized Categories Active:</span>
              <strong style={{ color: '#38bdf8' }}>10 Academic Categories</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Deduplication Status:</span>
              <strong style={{ color: '#34d399' }}>Active (SHA256 message hashes)</strong>
            </div>
          </div>
        </div>

        {/* Isolation reminder */}
        <div className="glass-panel" style={{ padding: '22px', borderLeft: '4px solid #10b981' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={17} color="#10b981" /> Data Isolation Rule
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '10px' }}>
            Posts belong to the class. Student completion states are strictly isolated: Student A marking DONE never changes status for Student B or Student C.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => onNavigate('admin_students')} className="btn btn-secondary" style={{ fontSize: '0.78rem' }}>
              <Users size={13} /> View Student Progress
            </button>
            <button onClick={() => onNavigate('admin_categories')} className="btn btn-secondary" style={{ fontSize: '0.78rem' }}>
              <Tag size={13} /> Manage Categories
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

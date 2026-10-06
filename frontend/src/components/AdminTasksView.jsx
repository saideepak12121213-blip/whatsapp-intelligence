import React, { useState, useEffect } from 'react';
import {
  Check, X, Edit2, Trash2, Calendar, MessageSquare, AlertCircle,
  Eye, CheckCircle2, Clock, Sparkles, ShieldAlert, BellRing,
  ExternalLink, MapPin, RefreshCw, Layers, Tag
} from 'lucide-react';

export default function AdminTasksView({
  tasks,
  categories,
  onReviewTask,
  onDeleteTask,
  onUpdateDeadline,
  onSendMandatoryNotify,
  onViewSource,
  initialTab = 'PENDING_REVIEW'
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ALL'
  const [editingTask, setEditingTask] = useState(null);
  const [deadlineModalTask, setDeadlineModalTask] = useState(null);
  const [newDeadlineDate, setNewDeadlineDate] = useState('');
  const [newDeadlineText, setNewDeadlineText] = useState('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Rich Edit Form State
  const [editForm, setEditForm] = useState({
    title: '',
    category: '',
    priority: '',
    description: '',
    deadline: '',
    deadline_original_text: '',
    time: '',
    location: '',
    registration_link: '',
    submission_instructions: '',
    is_mandatory_notification: false,
    notification_message: ''
  });

  const pendingCount = tasks.filter(t => t.status === 'PENDING_REVIEW').length;
  const approvedCount = tasks.filter(t => t.status === 'APPROVED').length;
  const rejectedCount = tasks.filter(t => t.status === 'REJECTED').length;

  const filteredTasks = tasks.filter(t => {
    if (activeTab === 'ALL') return true;
    return t.status === activeTab;
  });

  const handleStartEdit = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title || '',
      category: task.category || 'ASSIGNMENT',
      priority: task.priority || 'HIGH',
      description: task.description || '',
      deadline: task.deadline ? task.deadline.slice(0, 16) : '',
      deadline_original_text: task.deadline_original_text || '',
      time: task.time || '',
      location: task.location || '',
      registration_link: task.registration_link || '',
      submission_instructions: task.submission_instructions || '',
      is_mandatory_notification: Boolean(task.is_mandatory_notification),
      notification_message: task.notification_message || ''
    });
  };

  const handleSaveEdit = async (action = 'update') => {
    if (!editingTask) return;
    const payload = {
      ...editForm,
      deadline: editForm.deadline ? new Date(editForm.deadline).toISOString() : null
    };
    await onReviewTask(editingTask.task_id, action, payload);
    setEditingTask(null);
  };

  const handleQuickApprove = async (task) => {
    await onReviewTask(task.task_id, 'approve');
  };

  const handleQuickReject = async (task) => {
    await onReviewTask(task.task_id, 'reject');
  };

  const handleSaveDeadlineExtension = async () => {
    if (!deadlineModalTask) return;
    const dlIso = newDeadlineDate ? new Date(newDeadlineDate).toISOString() : null;
    await onReviewTask(deadlineModalTask.task_id, 'update', {
      deadline: dlIso,
      deadline_original_text: newDeadlineText || 'Extended timeline',
    });
    setDeadlineModalTask(null);
  };

  const defaultCategories = [
    'HACKATHON', 'WORKSHOP', 'EVENT', 'EXAM', 'EXAM_FEE', 'SEMESTER_FEE', 'REGISTRATION', 'ASSIGNMENT', 'ANNOUNCEMENT', 'RESOURCE'
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
          AI Information Review & Publishing
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Review extracted items before publishing. Only approved posts become visible to students.
        </p>
      </div>

      {/* Review Workflow Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('PENDING_REVIEW')}
          className="btn"
          style={{
            padding: '8px 18px',
            fontSize: '0.84rem',
            fontWeight: 700,
            borderRadius: '10px',
            background: activeTab === 'PENDING_REVIEW' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'PENDING_REVIEW' ? '#fbbf24' : 'var(--text-secondary)',
            border: activeTab === 'PENDING_REVIEW' ? '1px solid #f59e0b' : '1px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Clock size={15} /> Pending Review ({pendingCount})
        </button>

        <button
          onClick={() => setActiveTab('APPROVED')}
          className="btn"
          style={{
            padding: '8px 18px',
            fontSize: '0.84rem',
            fontWeight: 700,
            borderRadius: '10px',
            background: activeTab === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'APPROVED' ? '#34d399' : 'var(--text-secondary)',
            border: activeTab === 'APPROVED' ? '1px solid #10b981' : '1px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={15} /> Approved Posts ({approvedCount})
        </button>

        <button
          onClick={() => setActiveTab('REJECTED')}
          className="btn"
          style={{
            padding: '8px 18px',
            fontSize: '0.84rem',
            fontWeight: 700,
            borderRadius: '10px',
            background: activeTab === 'REJECTED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'REJECTED' ? '#f87171' : 'var(--text-secondary)',
            border: activeTab === 'REJECTED' ? '1px solid #ef4444' : '1px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <X size={15} /> Rejected Items ({rejectedCount})
        </button>

        <button
          onClick={() => setActiveTab('ALL')}
          className="btn"
          style={{
            padding: '8px 18px',
            fontSize: '0.84rem',
            fontWeight: 600,
            borderRadius: '10px',
            background: activeTab === 'ALL' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'ALL' ? '#818cf8' : 'var(--text-secondary)',
            border: activeTab === 'ALL' ? '1px solid #6366f1' : '1px solid transparent'
          }}
        >
          All Items ({tasks.length})
        </button>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Sparkles size={40} color="#6366f1" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: '#f8fafc', marginBottom: '6px' }}>No items in this view</h3>
          <p style={{ fontSize: '0.85rem' }}>
            {activeTab === 'PENDING_REVIEW'
              ? 'Great work! All extracted items have been reviewed.'
              : 'No items match the selected tab filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredTasks.map(task => {
            const completionPct = task.completion_percentage || 0;
            const isPending = task.status === 'PENDING_REVIEW';
            const isApproved = task.status === 'APPROVED';

            return (
              <div key={task.task_id} className="glass-panel" style={{
                padding: '22px 26px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                borderLeft: isApproved
                  ? '5px solid #10b981'
                  : isPending
                  ? '5px solid #f59e0b'
                  : '5px solid #ef4444'
              }}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span className="badge badge-medium" style={{ fontSize: '0.68rem' }}>
                        {task.category}
                      </span>
                      <span className={`badge ${task.priority === 'CRITICAL' ? 'badge-critical' : task.priority === 'HIGH' ? 'badge-high' : 'badge-low'}`}>
                        {task.priority}
                      </span>
                      <span className={`badge ${isApproved ? 'badge-completed' : isPending ? 'badge-medium' : 'badge-critical'}`}>
                        {task.status}
                      </span>
                      {task.is_mandatory_notification && (
                        <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>
                          MANDATORY
                        </span>
                      )}
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        AI Confidence: <strong>{Math.round((task.confidence || 0.95) * 100)}%</strong>
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => onViewSource(task)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.76rem', color: '#38bdf8' }}
                    >
                      <MessageSquare size={13} /> Source
                    </button>

                    {/* Pending Review Actions: Approve / Edit / Reject */}
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleQuickApprove(task)}
                          className="btn btn-success"
                          style={{ padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700 }}
                        >
                          <Check size={14} /> Approve & Publish
                        </button>
                        <button
                          onClick={() => handleStartEdit(task)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleQuickReject(task)}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                        >
                          <X size={13} /> Reject
                        </button>
                      </>
                    )}

                    {/* Approved Actions: Edit, Extend Deadline, Mandatory Notify, Delete */}
                    {isApproved && (
                      <>
                        <button
                          onClick={() => handleStartEdit(task)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeadlineModalTask(task);
                            setNewDeadlineDate(task.deadline ? task.deadline.slice(0, 16) : '');
                            setNewDeadlineText(task.deadline_original_text || '');
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.76rem', color: '#fbbf24' }}
                        >
                          <Calendar size={13} /> Extend Deadline
                        </button>
                        <button
                          onClick={() => onSendMandatoryNotify(task.task_id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.76rem', color: '#f87171' }}
                          title="Broadcast mandatory notification to all students"
                        >
                          <ShieldAlert size={13} /> Send Mandatory
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.task_id)}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </>
                    )}

                    {/* Rejected Actions: Restore or Delete */}
                    {task.status === 'REJECTED' && (
                      <>
                        <button
                          onClick={() => handleQuickApprove(task)}
                          className="btn btn-success"
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                        >
                          <Check size={14} /> Restore & Approve
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.task_id)}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                        >
                          <Trash2 size={13} /> Purge
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Structured Metadata Box */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#818cf8" />
                      <span>Deadline: <strong style={{ color: '#f8fafc' }}>{task.deadline_original_text || 'None specified'}</strong></span>
                    </div>
                    {task.time && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} color="#38bdf8" />
                        <span>Time: <strong>{task.time}</strong></span>
                      </div>
                    )}
                    {task.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} color="#ec4899" />
                        <span>Location: <strong>{task.location}</strong></span>
                      </div>
                    )}
                    {task.additional_source_count > 0 && (
                      <span style={{ color: '#fbbf24' }}>
                        ({task.additional_source_count} merged reminders)
                      </span>
                    )}
                  </div>

                  {/* Student completion meter (only on approved tasks) */}
                  {isApproved && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Class Completion:</span>
                      <strong style={{ color: '#34d399' }}>{task.completed_by_count} / {task.total_students} ({completionPct}%)</strong>
                      <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${completionPct}%`, height: '100%', background: '#10b981', borderRadius: '3px' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RICH EDIT MODAL */}
      {editingTask && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            background: '#111827',
            borderRadius: '20px',
            border: '1px solid rgba(99, 102, 241, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc' }}>
                Edit Academic Deliverable
              </h3>
              <button onClick={() => setEditingTask(null)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '9px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                    Category
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
                  >
                    {(categories && categories.length > 0 ? categories.map(c => c.slug) : defaultCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                    Priority
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                    Deadline Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.deadline}
                    onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                    Deadline Context String
                  </label>
                  <input
                    type="text"
                    value={editForm.deadline_original_text}
                    onChange={(e) => setEditForm({ ...editForm, deadline_original_text: e.target.value })}
                    placeholder="e.g. Friday 5 PM"
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                    Time String
                  </label>
                  <input
                    type="text"
                    value={editForm.time}
                    onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                    placeholder="e.g. 2:00 PM"
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                    Location / Venue
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="e.g. Room 402 or Online"
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Registration Link
                </label>
                <input
                  type="text"
                  value={editForm.registration_link}
                  onChange={(e) => setEditForm({ ...editForm, registration_link: e.target.value })}
                  placeholder="https://..."
                  style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Submission Instructions
                </label>
                <input
                  type="text"
                  value={editForm.submission_instructions}
                  onChange={(e) => setEditForm({ ...editForm, submission_instructions: e.target.value })}
                  placeholder="e.g. Submit PDF on college portal"
                  style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              {/* Mandatory Notification Toggle */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: '12px',
                borderRadius: '8px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#f87171', fontWeight: 600, fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={editForm.is_mandatory_notification}
                    onChange={(e) => setEditForm({ ...editForm, is_mandatory_notification: e.target.checked })}
                  />
                  Broadcast as MANDATORY Notification to All Students
                </label>
                {editForm.is_mandatory_notification && (
                  <input
                    type="text"
                    value={editForm.notification_message}
                    onChange={(e) => setEditForm({ ...editForm, notification_message: e.target.value })}
                    placeholder="Custom mandatory notification message..."
                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', marginTop: '8px' }}
                  />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
              <button onClick={() => setEditingTask(null)} className="btn btn-secondary">
                Cancel
              </button>
              {editingTask.status === 'PENDING_REVIEW' && (
                <button onClick={() => handleSaveEdit('approve')} className="btn btn-success" style={{ fontWeight: 700 }}>
                  <Check size={14} /> Save & Approve
                </button>
              )}
              <button onClick={() => handleSaveEdit('update')} className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXTEND DEADLINE MODAL */}
      {deadlineModalTask && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            background: '#111827',
            borderRadius: '16px',
            border: '1px solid rgba(245, 158, 11, 0.4)'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
              Extend Deadline: {deadlineModalTask.title}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Section 9: When deadline is extended, the item automatically becomes active again and a notification is sent to students.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  New Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newDeadlineDate}
                  onChange={(e) => setNewDeadlineDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Context / Label (e.g. Saturday 6 PM)
                </label>
                <input
                  type="text"
                  value={newDeadlineText}
                  onChange={(e) => setNewDeadlineText(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button onClick={() => setDeadlineModalTask(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveDeadlineExtension} className="btn btn-primary" style={{ background: '#f59e0b' }}>
                Update Deadline & Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import {
  Calendar, Clock, CheckCircle2, Circle, AlertTriangle, Eye,
  Edit3, Bookmark, MessageSquare, ChevronDown, ChevronUp, Check,
  MapPin, ExternalLink, BellRing, Info, ShieldAlert
} from 'lucide-react';

export default function TaskCard({ task, onStatusChange, onViewSource }) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isRemindOpen, setIsRemindOpen] = useState(false);
  const [noteText, setNoteText] = useState(task.student_note || '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [customRemindDate, setCustomRemindDate] = useState('');

  const isCompleted = task.personal_status === 'COMPLETED';
  const isRemindLater = task.personal_status === 'REMIND_LATER';

  const handleMarkDone = () => {
    onStatusChange(task.task_id, 'COMPLETED', null, noteText);
  };

  const handleReopen = () => {
    onStatusChange(task.task_id, 'PENDING', null, noteText);
  };

  const handleQuickRemind = (hoursAhead) => {
    const targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + hoursAhead);
    onStatusChange(task.task_id, 'REMIND_LATER', targetDate.toISOString(), noteText);
    setIsRemindOpen(false);
  };

  const handleTomorrowMorningRemind = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    onStatusChange(task.task_id, 'REMIND_LATER', tomorrow.toISOString(), noteText);
    setIsRemindOpen(false);
  };

  const handleCustomRemind = () => {
    if (!customRemindDate) return;
    onStatusChange(task.task_id, 'REMIND_LATER', new Date(customRemindDate).toISOString(), noteText);
    setIsRemindOpen(false);
  };

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    await onStatusChange(task.task_id, task.personal_status, task.remind_at, noteText);
    setIsSavingNote(false);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const priorityClass = {
    CRITICAL: 'badge-critical',
    HIGH: 'badge-high',
    MEDIUM: 'badge-medium',
    LOW: 'badge-low',
  }[task.priority] || 'badge-medium';

  // Format deadline date if available
  let formattedDeadline = task.deadline_original_text || 'Unknown deadline';
  if (task.deadline) {
    try {
      const d = new Date(task.deadline);
      formattedDeadline = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      if (task.deadline_original_text && task.deadline_original_text !== 'Unknown') {
        formattedDeadline += ` (${task.deadline_original_text})`;
      }
    } catch {}
  }

  // Format remind_at if present
  let formattedRemindAt = null;
  if (task.remind_at) {
    try {
      const rd = new Date(task.remind_at);
      formattedRemindAt = `${rd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${rd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {}
  }

  return (
    <div className="glass-panel" style={{
      padding: '22px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      borderLeft: isCompleted
        ? '5px solid #10b981'
        : isRemindLater
        ? '5px solid #f59e0b'
        : task.is_overdue
        ? '5px solid #ef4444'
        : '5px solid #6366f1',
      background: isCompleted ? 'rgba(16, 185, 129, 0.04)' : undefined,
    }}>
      {/* Top Meta: Category, Priority, Mandatory, Status */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              {task.category || 'ASSIGNMENT'}
            </span>

            <span className={`badge ${priorityClass}`}>
              {task.priority || 'MEDIUM'}
            </span>

            {task.is_mandatory_notification && (
              <span className="badge badge-critical" style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldAlert size={11} /> MANDATORY
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {task.is_overdue && !isCompleted && (
              <span className="badge badge-overdue">
                <AlertTriangle size={11} /> OVERDUE
              </span>
            )}
            <span className={`badge ${isCompleted ? 'badge-completed' : isRemindLater ? 'badge-medium' : 'badge-pending'}`}>
              {isCompleted ? <CheckCircle2 size={11} /> : isRemindLater ? <BellRing size={11} /> : <Clock size={11} />}
              {task.personal_status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Task Title */}
        <h3 style={{
          fontSize: '1.15rem',
          fontWeight: 700,
          color: isCompleted ? 'var(--text-secondary)' : '#f8fafc',
          textDecoration: isCompleted ? 'line-through' : 'none',
          marginBottom: '8px',
          lineHeight: 1.35
        }}>
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p style={{
            fontSize: '0.86rem',
            color: 'var(--text-secondary)',
            marginBottom: '14px',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {task.description}
          </p>
        )}

        {/* Structured Metadata Box */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          background: task.is_overdue && !isCompleted ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
          padding: '10px 12px',
          borderRadius: '8px',
          marginBottom: '14px',
          fontSize: '0.82rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {/* Deadline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: task.is_overdue && !isCompleted ? '#f87171' : 'var(--text-secondary)' }}>
            <Calendar size={14} color={task.is_overdue && !isCompleted ? '#f87171' : '#818cf8'} />
            <span>Deadline: <strong style={{ color: '#f8fafc' }}>{formattedDeadline}</strong></span>
          </div>

          {/* Time & Location if present */}
          {(task.time || task.location) && (
            <div style={{ display: 'flex', gap: '14px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
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
            </div>
          )}

          {/* Registration Link if present */}
          {task.registration_link && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <ExternalLink size={13} color="#06b6d4" />
              <a
                href={task.registration_link}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#06b6d4', textDecoration: 'underline', wordBreak: 'break-all' }}
              >
                Registration / Submission Portal Link
              </a>
            </div>
          )}

          {/* Submission Instructions */}
          {task.submission_instructions && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.78rem' }}>
              <Info size={12} />
              <span>{task.submission_instructions}</span>
            </div>
          )}

          {/* Personal Reminder Time banner if REMIND_LATER */}
          {isRemindLater && formattedRemindAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '0.78rem', marginTop: '2px' }}>
              <BellRing size={12} />
              <span>Reminder scheduled for: <strong>{formattedRemindAt}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Controls */}
      <div>
        {/* Toggle Personal Note Drawer */}
        <div style={{ marginBottom: '12px' }}>
          <button
            onClick={() => setIsNotesOpen(!isNotesOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              padding: '4px 0'
            }}
          >
            <Edit3 size={12} />
            {task.student_note ? 'Personal Note (Saved)' : 'Add Personal Note'}
            {isNotesOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {isNotesOpen && (
            <div style={{
              marginTop: '8px',
              background: 'rgba(15, 23, 42, 0.8)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Personal reminder notes (only visible to you)..."
                rows={2}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '0.82rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  onClick={handleSaveNote}
                  disabled={isSavingNote}
                  className="btn btn-secondary"
                  style={{ padding: '3px 10px', fontSize: '0.74rem' }}
                >
                  {isSavedNotice ? <><Check size={12} color="#10b981" /> Saved</> : 'Save Note'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Remind Me Later Popup / Drawer */}
        {isRemindOpen && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            animation: 'fadeIn 0.15s ease'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BellRing size={13} /> Set Personal Reminder:
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={() => handleQuickRemind(1)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.74rem' }}>
                +1 Hour
              </button>
              <button onClick={() => handleQuickRemind(3)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.74rem' }}>
                +3 Hours
              </button>
              <button onClick={handleTomorrowMorningRemind} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.74rem' }}>
                Tomorrow 9 AM
              </button>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
              <input
                type="datetime-local"
                value={customRemindDate}
                onChange={(e) => setCustomRemindDate(e.target.value)}
                style={{
                  padding: '4px 8px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '0.76rem',
                  flex: 1
                }}
              />
              <button onClick={handleCustomRemind} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.74rem', background: '#f59e0b' }}>
                Set
              </button>
              <button onClick={() => setIsRemindOpen(false)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.74rem' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Section 8: Action Buttons (DONE / REMIND ME LATER / VIEW SOURCE) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '14px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => onViewSource(task)}
            className="btn btn-secondary"
            style={{
              padding: '7px 12px',
              fontSize: '0.78rem',
              color: '#38bdf8'
            }}
          >
            <MessageSquare size={13} /> Source
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* REMIND ME LATER Button */}
            {!isCompleted && (
              <button
                onClick={() => setIsRemindOpen(!isRemindOpen)}
                className="btn btn-secondary"
                style={{
                  padding: '7px 12px',
                  fontSize: '0.8rem',
                  color: isRemindLater ? '#fbbf24' : 'var(--text-secondary)',
                  border: isRemindLater ? '1px solid #f59e0b' : undefined
                }}
              >
                <BellRing size={13} /> Remind Me Later
              </button>
            )}

            {/* DONE / REOPEN Button */}
            {isCompleted ? (
              <button
                onClick={handleReopen}
                className="btn btn-secondary"
                style={{
                  padding: '7px 14px',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)'
                }}
              >
                Mark Pending
              </button>
            ) : (
              <button
                onClick={handleMarkDone}
                className="btn btn-success"
                style={{
                  padding: '7px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}
              >
                <Check size={14} /> DONE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

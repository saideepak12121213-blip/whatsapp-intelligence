import React, { useState } from 'react';
import { Search, Filter, Inbox, CheckCircle2, Layers, Tag } from 'lucide-react';
import TaskCard from './TaskCard';

export default function TasksView({
  tasks,
  filterType,
  setFilterType,
  selectedCategory,
  setSelectedCategory,
  categories,
  searchQuery,
  setSearchQuery,
  onStatusChange,
  onViewSource
}) {
  const filters = [
    { id: 'all', label: 'All Tasks' },
    { id: 'pending', label: 'Pending' },
    { id: 'completed', label: 'Completed' },
    { id: 'reminders', label: 'Reminders' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'important', label: 'Important' },
  ];

  const defaultCategoryList = [
    { slug: 'ALL', name: 'All Categories' },
    { slug: 'HACKATHON', name: 'Hackathons' },
    { slug: 'WORKSHOP', name: 'Workshops' },
    { slug: 'EVENT', name: 'Events' },
    { slug: 'EXAM', name: 'Exams' },
    { slug: 'EXAM_FEE', name: 'Exam Fees' },
    { slug: 'SEMESTER_FEE', name: 'Semester Fees' },
    { slug: 'REGISTRATION', name: 'Registrations' },
    { slug: 'ASSIGNMENT', name: 'Assignments' },
  ];

  const categoryOptions = categories && categories.length > 0
    ? [{ slug: 'ALL', name: 'All Categories' }, ...categories]
    : defaultCategoryList;

  // Filter tasks locally by category if needed
  const displayTasks = tasks.filter(t => {
    if (!selectedCategory || selectedCategory === 'ALL') return true;
    return (t.category || '').toUpperCase() === selectedCategory.toUpperCase();
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header and Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Class Tasks & Academic Deliverables
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Shared tasks extracted from authorized WhatsApp exports — independent personal status for each student
          </p>
        </div>

        {/* Search and Category Filter */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Category Dropdown */}
          <select
            value={selectedCategory || 'ALL'}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid var(--border-subtle)',
              color: '#f8fafc',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {categoryOptions.map(c => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, hackathons, exams..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
        scrollbarWidth: 'none'
      }}>
        {filters.map(f => {
          const isActive = filterType === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                borderRadius: '9999px',
                background: isActive ? 'var(--gradient-brand)' : 'rgba(255, 255, 255, 0.05)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                border: isActive ? '1px solid transparent' : '1px solid var(--border-subtle)',
                whiteSpace: 'nowrap'
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Tasks Grid */}
      {displayTasks.length === 0 ? (
        <div className="glass-panel" style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Inbox size={42} color="#64748b" />
          <h3 style={{ color: '#f8fafc', fontSize: '1.1rem' }}>No tasks found in this view</h3>
          <p style={{ fontSize: '0.85rem', maxWidth: '420px' }}>
            {searchQuery
              ? `No assignments match "${searchQuery}". Try a different keyword.`
              : 'Either you have completed all tasks in this filter or no matching tasks have been published.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
          gap: '18px'
        }}>
          {displayTasks.map(task => (
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
  );
}

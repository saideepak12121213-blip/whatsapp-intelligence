import React from 'react';
import {
  LayoutDashboard, CheckSquare, Calendar, Bell, Link2, ShieldCheck,
  BarChart3, UploadCloud, ListChecks, Users, History, LogOut, MessageSquareCode,
  Tag, Clock, BellRing, Settings, CheckCircle2
} from 'lucide-react';

export default function Sidebar({
  currentTab,
  setCurrentTab,
  user,
  onLogout,
  pendingCount = 0,
  unreadNotifsCount = 0
}) {
  const isAdmin = user?.role === 'ADMIN';

  const studentNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Class Tasks', icon: CheckSquare },
    { id: 'deadlines', label: 'Deadlines Timeline', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount > 0 ? unreadNotifsCount : null },
    { id: 'announcements', label: 'Announcements', icon: BellRing },
    { id: 'links', label: 'Important Links', icon: Link2 },
    { id: 'privacy', label: 'Privacy & Architecture', icon: ShieldCheck },
  ];

  const adminNavItems = [
    { id: 'admin_dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'admin_upload', label: 'WhatsApp Upload', icon: UploadCloud },
    { id: 'admin_history', label: 'Processing History', icon: History },
    { id: 'admin_review', label: 'AI Review', icon: Clock, badge: pendingCount > 0 ? pendingCount : null, badgeColor: '#f59e0b' },
    { id: 'admin_tasks', label: 'Approved Posts', icon: CheckCircle2 },
    { id: 'admin_categories', label: 'Categories', icon: Tag },
    { id: 'admin_students', label: 'Students', icon: Users },
    { id: 'admin_notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy Architecture', icon: ShieldCheck },
  ];

  const items = isAdmin ? adminNavItems : studentNavItems;

  return (
    <aside style={{
      width: '260px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: 'calc(100vh - 42px)',
      position: 'sticky',
      top: '42px',
      padding: '24px 16px',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingLeft: '8px' }}>
          <div style={{
            background: 'var(--gradient-brand)',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
          }}>
            <MessageSquareCode size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.12rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              ClassFlow <span style={{ color: '#06b6d4' }}>AI</span>
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              WhatsApp Intelligence
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '0.86rem',
                  fontWeight: isActive ? 600 : 500,
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={17} color={isActive ? '#818cf8' : 'var(--text-muted)'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '10px',
                    background: item.badgeColor || '#ef4444',
                    color: '#fff'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User info & Logout at footer */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        padding: '14px',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {user?.email}
            </div>
          </div>
          <span className={`badge ${isAdmin ? 'badge-high' : 'badge-completed'}`} style={{ fontSize: '0.65rem' }}>
            {user?.role}
          </span>
        </div>

        <button
          onClick={onLogout}
          className="btn btn-secondary"
          style={{
            width: '100%',
            padding: '7px',
            fontSize: '0.78rem',
            marginTop: '6px',
            color: 'var(--text-muted)'
          }}
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </aside>
  );
}

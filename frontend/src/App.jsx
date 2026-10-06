import React, { useState, useEffect, useCallback } from 'react';
import DemoBar from './components/DemoBar';
import Sidebar from './components/Sidebar';
import StudentDashboardView from './components/StudentDashboardView';
import TasksView from './components/TasksView';
import DeadlinesView from './components/DeadlinesView';
import AnnouncementsView from './components/AnnouncementsView';
import LinksView from './components/LinksView';
import NotificationsView from './components/NotificationsView';
import PrivacyView from './components/PrivacyView';
import AdminDashboardView from './components/AdminDashboardView';
import AdminUploadView from './components/AdminUploadView';
import AdminTasksView from './components/AdminTasksView';
import AdminCategoriesView from './components/AdminCategoriesView';
import AdminStudentsView from './components/AdminStudentsView';
import AdminHistoryView from './components/AdminHistoryView';
import SourceModal from './components/SourceModal';
import AuthView from './components/AuthView';
import { api } from './api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Data states
  const [studentStats, setStudentStats] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [links, setLinks] = useState([]);
  const [students, setStudents] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // UI state
  const [filterType, setFilterType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSourceTask, setSelectedSourceTask] = useState(null);

  // Fetch initial profile
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('classflow_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const user = await api.auth.me();
      setCurrentUser(user);
      if (user.role === 'ADMIN') {
        setCurrentTab('admin_dashboard');
      } else {
        setCurrentTab('dashboard');
      }
    } catch {
      localStorage.removeItem('classflow_token');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch data depending on active role and tab
  const refreshData = useCallback(async () => {
    if (!currentUser) return;

    try {
      if (currentUser.role === 'STUDENT') {
        const [dash, taskList, annList, linkList, catList, notifList] = await Promise.all([
          api.student.getDashboard().catch(() => null),
          api.student.getTasks(filterType, selectedCategory, searchQuery).catch(() => []),
          api.student.getAnnouncements().catch(() => []),
          api.student.getLinks().catch(() => []),
          api.student.getCategories().catch(() => []),
          api.student.getNotifications().catch(() => []),
        ]);
        if (dash) setStudentStats(dash);
        if (taskList) setTasks(taskList);
        if (annList) setAnnouncements(annList);
        if (linkList) setLinks(linkList);
        if (catList) setCategories(catList);
        if (notifList) setNotifications(notifList);
      } else if (currentUser.role === 'ADMIN') {
        const [dash, taskList, studentList, uploadList, annList, catList, notifList] = await Promise.all([
          api.admin.getDashboard().catch(() => null),
          api.admin.getTasks().catch(() => []),
          api.admin.getStudents().catch(() => []),
          api.admin.getUploads().catch(() => []),
          api.student.getAnnouncements().catch(() => []),
          api.admin.getCategories().catch(() => []),
          api.admin.getNotifications().catch(() => []),
        ]);
        if (dash) setAdminStats(dash);
        if (taskList) setTasks(taskList);
        if (studentList) setStudents(studentList);
        if (uploadList) setUploads(uploadList);
        if (annList) setAnnouncements(annList);
        if (catList) setCategories(catList);
        if (notifList) setNotifications(notifList);
      }
    } catch (err) {
      console.error('Data refresh error:', err);
    }
  }, [currentUser, filterType, selectedCategory, searchQuery]);

  // Periodic polling every 8 seconds for real-time alerts
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 8000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Quick switch between demo accounts
  const handleQuickLogin = async (email, password) => {
    try {
      setLoading(true);
      const res = await api.auth.login(email, password);
      localStorage.setItem('classflow_token', res.access_token);
      setCurrentUser(res.user);
      if (res.user.role === 'ADMIN') {
        setCurrentTab('admin_dashboard');
      } else {
        setCurrentTab('dashboard');
      }
    } catch (err) {
      console.error('Quick login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('classflow_token');
    setCurrentUser(null);
    setCurrentTab('dashboard');
  };

  // Student task completion toggle / personal reminder
  const handleStatusChange = async (taskId, nextStatus, remindAt = null, studentNote = null) => {
    try {
      // Optimistic update in UI
      setTasks(prev =>
        prev.map(t =>
          t.task_id === taskId
            ? {
                ...t,
                personal_status: nextStatus,
                remind_at: remindAt !== null ? remindAt : t.remind_at,
                student_note: studentNote !== undefined ? studentNote : t.student_note,
                is_overdue: nextStatus === 'COMPLETED' ? false : t.is_overdue,
              }
            : t
        )
      );

      await api.student.updateTaskStatus(taskId, nextStatus, remindAt, studentNote);
      // Refresh dashboard counters & tasks
      refreshData();
    } catch (err) {
      console.error('Failed to update status:', err);
      refreshData();
    }
  };

  // Admin task review
  const handleReviewTask = async (taskId, action, data) => {
    try {
      await api.admin.reviewTask(taskId, action, data);
      refreshData();
    } catch (err) {
      console.error('Failed to review task:', err);
      alert('Error updating task review: ' + err.message);
    }
  };

  // Admin deadline modification
  const handleUpdateDeadline = async (taskId, deadlineDate, deadlineText, note) => {
    try {
      await api.admin.updateDeadline(taskId, deadlineDate, deadlineText, note);
      refreshData();
    } catch (err) {
      console.error('Failed to update deadline:', err);
      alert('Error extending deadline: ' + err.message);
    }
  };

  // Admin mandatory notification dispatch
  const handleSendMandatoryNotify = async (taskId) => {
    try {
      await api.admin.sendMandatoryNotify(taskId);
      refreshData();
    } catch (err) {
      console.error('Failed to send mandatory notify:', err);
      alert('Error sending mandatory notification: ' + err.message);
    }
  };

  // Admin category management
  const handleAddCategory = async (catData) => {
    try {
      await api.admin.addCategory(catData);
      refreshData();
    } catch (err) {
      console.error('Failed to add category:', err);
      alert('Error adding category: ' + err.message);
    }
  };

  const handleUpdateCategory = async (id, catData) => {
    try {
      await api.admin.updateCategory(id, catData);
      refreshData();
    } catch (err) {
      console.error('Failed to update category:', err);
      alert('Error updating category: ' + err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await api.admin.deleteCategory(id);
      refreshData();
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert('Error deleting category: ' + err.message);
    }
  };

  // Broadcast notification
  const handleBroadcastNotification = async (payload) => {
    try {
      await api.admin.broadcastNotification(payload);
      refreshData();
    } catch (err) {
      console.error('Failed to broadcast notification:', err);
      alert('Error broadcasting notification: ' + err.message);
    }
  };

  // Mark notification read
  const handleMarkNotificationRead = async (notificationId) => {
    try {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      await api.student.markNotificationRead(notificationId);
      refreshData();
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this shared task?')) return;
    try {
      await api.admin.deleteTask(taskId);
      refreshData();
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert('Error deleting task: ' + err.message);
    }
  };

  const handleDeleteUpload = async (uploadId) => {
    if (!window.confirm('Purge raw messages for this upload? Verified tasks will remain.')) return;
    try {
      await api.admin.deleteUpload(uploadId);
      refreshData();
    } catch (err) {
      console.error('Failed to purge upload:', err);
      alert('Error purging upload: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f19' }}>
        <div style={{ color: '#818cf8', fontWeight: 600 }}>Loading ClassFlow AI...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthView
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setCurrentTab(user.role === 'ADMIN' ? 'admin_dashboard' : 'dashboard');
        }}
        onQuickLogin={handleQuickLogin}
      />
    );
  }

  const pendingCount = tasks.filter(t => t.status === 'PENDING_REVIEW').length;
  const unreadNotifsCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Hackathon Demo Switch Bar */}
      <DemoBar currentUser={currentUser} onQuickLogin={handleQuickLogin} />

      {/* Main App Layout */}
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          user={currentUser}
          onLogout={handleLogout}
          pendingCount={pendingCount}
          unreadNotifsCount={unreadNotifsCount}
        />

        {/* Dynamic Content Area */}
        <main style={{
          flex: 1,
          padding: '30px 40px',
          maxWidth: '1240px',
          width: '100%',
          overflowY: 'auto'
        }}>
          {/* STUDENT ROUTES */}
          {currentUser.role === 'STUDENT' && (
            <>
              {currentTab === 'dashboard' && (
                <StudentDashboardView
                  dashboardStats={studentStats}
                  tasks={tasks}
                  announcements={announcements}
                  notifications={notifications}
                  onStatusChange={handleStatusChange}
                  onViewSource={(task) => setSelectedSourceTask(task)}
                  onNavigateToTasks={(cat) => {
                    if (cat) setSelectedCategory(cat);
                    setCurrentTab('tasks');
                  }}
                  onSelectCategory={(cat) => {
                    setSelectedCategory(cat);
                    setCurrentTab('tasks');
                  }}
                />
              )}
              {currentTab === 'tasks' && (
                <TasksView
                  tasks={tasks}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  filterType={filterType}
                  setFilterType={setFilterType}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onStatusChange={handleStatusChange}
                  onViewSource={(task) => setSelectedSourceTask(task)}
                />
              )}
              {currentTab === 'deadlines' && (
                <DeadlinesView
                  tasks={tasks}
                  onStatusChange={handleStatusChange}
                  onViewSource={(task) => setSelectedSourceTask(task)}
                />
              )}
              {currentTab === 'notifications' && (
                <NotificationsView
                  notifications={notifications}
                  user={currentUser}
                  onMarkRead={handleMarkNotificationRead}
                  onSelectTask={() => setCurrentTab('tasks')}
                />
              )}
              {currentTab === 'announcements' && (
                <AnnouncementsView announcements={announcements} />
              )}
              {currentTab === 'links' && (
                <LinksView links={links} />
              )}
            </>
          )}

          {/* ADMIN ROUTES */}
          {currentUser.role === 'ADMIN' && (
            <>
              {currentTab === 'admin_dashboard' && (
                <AdminDashboardView
                  adminStats={adminStats}
                  tasks={tasks}
                  onNavigate={(tab) => setCurrentTab(tab)}
                />
              )}
              {currentTab === 'admin_upload' && (
                <AdminUploadView
                  onUploadComplete={refreshData}
                  onNavigateToReview={() => setCurrentTab('admin_review')}
                />
              )}
              {currentTab === 'admin_history' && (
                <AdminHistoryView
                  uploads={uploads}
                  onDeleteUpload={handleDeleteUpload}
                />
              )}
              {currentTab === 'admin_review' && (
                <AdminTasksView
                  tasks={tasks}
                  categories={categories}
                  onReviewTask={handleReviewTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdateDeadline={handleUpdateDeadline}
                  onSendMandatoryNotify={handleSendMandatoryNotify}
                  onViewSource={(task) => setSelectedSourceTask(task)}
                  initialTab="PENDING_REVIEW"
                />
              )}
              {currentTab === 'admin_tasks' && (
                <AdminTasksView
                  tasks={tasks}
                  categories={categories}
                  onReviewTask={handleReviewTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdateDeadline={handleUpdateDeadline}
                  onSendMandatoryNotify={handleSendMandatoryNotify}
                  onViewSource={(task) => setSelectedSourceTask(task)}
                  initialTab="APPROVED"
                />
              )}
              {currentTab === 'admin_categories' && (
                <AdminCategoriesView
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              )}
              {currentTab === 'admin_notifications' && (
                <NotificationsView
                  notifications={notifications}
                  user={currentUser}
                  onBroadcastNotification={handleBroadcastNotification}
                  onMarkRead={handleMarkNotificationRead}
                  onSelectTask={() => setCurrentTab('admin_tasks')}
                />
              )}
              {currentTab === 'admin_students' && (
                <AdminStudentsView students={students} />
              )}
            </>
          )}

          {/* SHARED ROUTE */}
          {currentTab === 'privacy' && <PrivacyView />}
        </main>
      </div>

      {/* WhatsApp Source Verification Modal */}
      {selectedSourceTask && (
        <SourceModal
          task={selectedSourceTask}
          onClose={() => setSelectedSourceTask(null)}
        />
      )}
    </div>
  );
}

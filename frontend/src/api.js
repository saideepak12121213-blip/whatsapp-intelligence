const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('classflow_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeader(),
    ...options.headers,
  };

  // If body is FormData, do not set Content-Type header (browser sets boundary)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Network request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (userData) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    me: () => request('/auth/me'),
  },

  student: {
    getDashboard: () => request('/student/dashboard'),
    getTasks: (filterType = 'all', category = null, search = '') => {
      const params = new URLSearchParams();
      if (filterType && filterType !== 'all') params.append('filter_type', filterType);
      if (category && category !== 'ALL') params.append('category', category);
      if (search) params.append('search', search);
      return request(`/student/tasks?${params.toString()}`);
    },
    updateTaskStatus: (taskId, status, remindAt = null, studentNote = null) =>
      request(`/student/tasks/${taskId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, remind_at: remindAt, student_note: studentNote }),
      }),
    getCategories: () => request('/student/categories'),
    getAnnouncements: () => request('/student/announcements'),
    getLinks: () => request('/student/links'),
    getNotifications: () => request('/student/notifications'),
    markNotificationRead: (notificationId) =>
      request(`/student/notifications/${notificationId}/read`, {
        method: 'PUT',
      }),
  },

  admin: {
    getDashboard: () => request('/admin/dashboard'),
    uploadChat: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return request('/admin/upload-chat', {
        method: 'POST',
        body: formData,
      });
    },
    loadSampleChat: (sampleKey) =>
      request(`/admin/load-sample-chat/${sampleKey}`, {
        method: 'POST',
      }),
    getTasks: (statusFilter = null, category = null) => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'ALL') params.append('status_filter', statusFilter);
      if (category && category !== 'ALL') params.append('category', category);
      const qs = params.toString() ? `?${params.toString()}` : '';
      return request(`/admin/tasks${qs}`);
    },
    reviewTask: (taskId, action, data = {}) =>
      request(`/admin/tasks/${taskId}/review`, {
        method: 'PUT',
        body: JSON.stringify({ action, ...data }),
      }),
    updateDeadline: (taskId, deadline, deadlineOriginalText, notificationMessage = null) =>
      request(`/admin/tasks/${taskId}/deadline`, {
        method: 'PUT',
        body: JSON.stringify({
          deadline,
          deadline_original_text: deadlineOriginalText,
          notification_message: notificationMessage,
        }),
      }),
    sendMandatoryNotify: (taskId) =>
      request(`/admin/tasks/${taskId}/mandatory-notify`, {
        method: 'POST',
      }),
    deleteTask: (taskId) =>
      request(`/admin/tasks/${taskId}`, {
        method: 'DELETE',
      }),
    getCategories: () => request('/admin/categories'),
    addCategory: (data) =>
      request('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateCategory: (id, data) =>
      request(`/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteCategory: (id) =>
      request(`/admin/categories/${id}`, {
        method: 'DELETE',
      }),
    getNotifications: () => request('/admin/notifications'),
    broadcastNotification: (data) =>
      request('/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getStudents: () => request('/admin/students'),
    getUploads: () => request('/admin/uploads'),
    deleteUpload: (uploadId) =>
      request(`/admin/uploads/${uploadId}`, {
        method: 'DELETE',
      }),
  },
};

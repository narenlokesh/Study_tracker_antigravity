const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Subjects
  getSubjects: () => request('/subjects'),
  createSubject: (data) => request('/subjects', { method: 'POST', body: JSON.stringify(data) }),
  updateSubject: (id, data) => request(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: 'DELETE' }),

  // Sessions
  getSessions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/sessions${qs ? `?${qs}` : ''}`);
  },
  createSession: (data) => request('/sessions', { method: 'POST', body: JSON.stringify(data) }),
  updateSession: (id, data) => request(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSession: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),

  // Calendar
  getCalendarData: (year, month) => request(`/calendar?year=${year}&month=${month}`),

  // Stats & Heatmap
  getHeatmapData: (days = 365) => request(`/stats/heatmap?days=${days}`),
  getSummaryStats: () => request('/stats/summary'),

  // Goals
  getMonthlyGoal: (year, month) => request(`/goals/monthly?year=${year}&month=${month}`),
  saveMonthlyGoal: (data) => request('/goals/monthly', { method: 'POST', body: JSON.stringify(data) }),

  // Reset
  resetDatabase: () => request('/reset', { method: 'POST' }),
};

const BASE_URL = '/api';

// Check if backend API is reachable
let isBackendAvailable = null;

async function checkBackend() {
  if (isBackendAvailable !== null) return isBackendAvailable;
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    isBackendAvailable = res.ok;
  } catch {
    isBackendAvailable = false;
  }
  return isBackendAvailable;
}

// LocalStorage Fallback Store (Used when deployed on Vercel, Netlify, GitHub Pages, etc.)
const STORAGE_KEYS = {
  SUBJECTS: 'focustrack_subjects',
  SESSIONS: 'focustrack_sessions',
  GOALS: 'focustrack_goals',
};

// Automatic cleanup: Remove sessions whose subjects have been deleted
function cleanupOrphanedSessions() {
  try {
    const subsRaw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (!subsRaw) return;
    const subs = JSON.parse(subsRaw);
    if (!Array.isArray(subs)) return;
    const validSubjectIds = new Set(subs.map(s => String(s.id)));

    const sessRaw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!sessRaw) return;
    const sess = JSON.parse(sessRaw);
    if (!Array.isArray(sess)) return;

    const filtered = sess.filter(s => validSubjectIds.has(String(s.subject_id)));
    if (filtered.length !== sess.length) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('Error cleaning up orphaned sessions:', e);
  }
}

function initLocalDataIfEmpty() {
  if (localStorage.getItem(STORAGE_KEYS.SUBJECTS)) {
    cleanupOrphanedSessions();
    return;
  }

  const initialSubjects = [
    { id: 1, name: 'Computer Science & Algorithms', color: '#3b82f6', icon: 'Code', target_hours_per_week: 10 },
    { id: 2, name: 'Applied Mathematics', color: '#8b5cf6', icon: 'Binary', target_hours_per_week: 8 },
    { id: 3, name: 'Machine Learning & AI', color: '#10b981', icon: 'Cpu', target_hours_per_week: 12 },
    { id: 4, name: 'System Design & Architecture', color: '#f59e0b', icon: 'Layers', target_hours_per_week: 6 },
    { id: 5, name: 'Technical Reading & Docs', color: '#ec4899', icon: 'BookOpen', target_hours_per_week: 4 },
  ];
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(initialSubjects));

  // Seed sample sessions for past 45 days
  const sampleNotes = [
    'Deep focus session on dynamic programming and graphs',
    'Worked on neural network forward & backprop implementations',
    'Distributed systems caching & consensus protocols review',
    'Linear algebra matrix decomposition exercises',
    'Read documentation and built quick micro-benchmarks',
    'Reviewed flashcards and solved 4 LeetCode practice problems'
  ];

  const sessions = [];
  const today = new Date();
  let idCounter = 1;

  for (let i = 45; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    if (Math.random() < 0.85) {
      const count = Math.floor(Math.random() * 3) + 1;
      for (let s = 0; s < count; s++) {
        const sub = initialSubjects[Math.floor(Math.random() * initialSubjects.length)];
        const durations = [30, 45, 60, 75, 90, 120];
        sessions.push({
          id: idCounter++,
          subject_id: sub.id,
          subject_name: sub.name,
          subject_color: sub.color,
          date: dateStr,
          duration_minutes: durations[Math.floor(Math.random() * durations.length)],
          notes: sampleNotes[Math.floor(Math.random() * sampleNotes.length)],
          focus_rating: Math.floor(Math.random() * 2) + 4,
          created_at: dateStr + ' 12:00:00'
        });
      }
    }
  }
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

  // Current month goal
  const curYear = today.getFullYear();
  const curMonth = today.getMonth() + 1;
  const initialGoals = [
    { year: curYear, month: curMonth, target_hours: 80, notes: 'Target: 80 hours this month' }
  ];
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(initialGoals));
}

// LocalStorage API Implementation
const localApi = {
  getSubjects: () => {
    initLocalDataIfEmpty();
    cleanupOrphanedSessions();
    const subs = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS) || '[]');
    const sess = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    return subs.map(s => {
      const total_minutes = sess
        .filter(x => String(x.subject_id) === String(s.id))
        .reduce((sum, x) => sum + x.duration_minutes, 0);
      return { ...s, total_minutes };
    });
  },
  createSubject: (data) => {
    initLocalDataIfEmpty();
    const subs = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS) || '[]');
    const newSub = { id: Date.now(), ...data };
    subs.push(newSub);
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subs));
    return newSub;
  },
  updateSubject: (id, data) => {
    const subs = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS) || '[]');
    const idx = subs.findIndex(s => String(s.id) === String(id));
    if (idx !== -1) {
      subs[idx] = { ...subs[idx], ...data };
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subs));

      // Also update subject_name and color in sessions
      let sess = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
      sess = sess.map(s => {
        if (String(s.subject_id) === String(id)) {
          return {
            ...s,
            subject_name: data.name || s.subject_name,
            subject_color: data.color || s.subject_color
          };
        }
        return s;
      });
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sess));

      return subs[idx];
    }
    return null;
  },
  deleteSubject: (id) => {
    // 1. Remove subject
    let subs = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS) || '[]');
    subs = subs.filter(s => String(s.id) !== String(id));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subs));

    // 2. Cascade delete: remove all sessions that belonged to this subject!
    let sess = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    sess = sess.filter(s => String(s.subject_id) !== String(id));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sess));

    return { success: true };
  },
  getSessions: (params = {}) => {
    initLocalDataIfEmpty();
    cleanupOrphanedSessions();
    let sess = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    if (params.month && params.year) {
      const padM = String(params.month).padStart(2, '0');
      const prefix = `${params.year}-${padM}`;
      sess = sess.filter(s => s.date.startsWith(prefix));
    }
    if (params.subjectId) {
      sess = sess.filter(s => String(s.subject_id) === String(params.subjectId));
    }
    return sess.sort((a, b) => b.date.localeCompare(a.date));
  },
  createSession: (data) => {
    initLocalDataIfEmpty();
    const subs = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS) || '[]');
    const sess = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    const sub = subs.find(s => String(s.id) === String(data.subject_id)) || {};
    const newSession = {
      id: Date.now(),
      ...data,
      subject_name: sub.name || 'General',
      subject_color: sub.color || '#3b82f6',
      created_at: new Date().toISOString()
    };
    sess.unshift(newSession);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sess));
    return newSession;
  },
  updateSession: (id, data) => {
    const sess = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    const idx = sess.findIndex(s => String(s.id) === String(id));
    if (idx !== -1) {
      sess[idx] = { ...sess[idx], ...data };
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sess));
      return sess[idx];
    }
    return null;
  },
  deleteSession: (id) => {
    let sess = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    sess = sess.filter(s => String(s.id) !== String(id));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sess));
    return { success: true };
  },
  deleteSessionsByDate: (dateStr) => {
    let sess = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    sess = sess.filter(s => s.date !== dateStr);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sess));
    return { success: true };
  },
  getCalendarData: (year, month) => {
    initLocalDataIfEmpty();
    cleanupOrphanedSessions();
    const padM = String(month).padStart(2, '0');
    const prefix = `${year}-${padM}`;
    const allSess = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    const monthSess = allSess.filter(s => s.date.startsWith(prefix));

    // Daily summary
    const summaryMap = {};
    monthSess.forEach(s => {
      if (!summaryMap[s.date]) summaryMap[s.date] = { date: s.date, total_minutes: 0, session_count: 0 };
      summaryMap[s.date].total_minutes += s.duration_minutes;
      summaryMap[s.date].session_count += 1;
    });

    const goals = JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS) || '[]');
    const goal = goals.find(g => g.year === Number(year) && g.month === Number(month)) || { year, month, target_hours: 60 };

    return {
      year,
      month,
      dailySummary: Object.values(summaryMap),
      sessions: monthSess,
      goal
    };
  },
  getHeatmapData: (days = 365) => {
    initLocalDataIfEmpty();
    cleanupOrphanedSessions();
    const allSess = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    const summaryMap = {};
    allSess.forEach(s => {
      if (!summaryMap[s.date]) summaryMap[s.date] = { date: s.date, total_minutes: 0, session_count: 0 };
      summaryMap[s.date].total_minutes += s.duration_minutes;
      summaryMap[s.date].session_count += 1;
    });
    return Object.values(summaryMap).sort((a, b) => a.date.localeCompare(b.date));
  },
  getSummaryStats: () => {
    initLocalDataIfEmpty();
    cleanupOrphanedSessions();
    const today = new Date().toISOString().split('T')[0];
    const allSess = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    const subs = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS) || '[]');

    const todaySess = allSess.filter(s => s.date === today);
    const todayMinutes = todaySess.reduce((sum, s) => sum + s.duration_minutes, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];
    const weekMinutes = allSess.filter(s => s.date >= sevenDaysStr).reduce((sum, s) => sum + s.duration_minutes, 0);

    const currentMonthPrefix = today.slice(0, 7);
    const monthSess = allSess.filter(s => s.date.startsWith(currentMonthPrefix));
    const monthMinutes = monthSess.reduce((sum, s) => sum + s.duration_minutes, 0);
    const totalMinutes = allSess.reduce((sum, s) => sum + s.duration_minutes, 0);

    // Streaks
    const datesStudied = Array.from(new Set(allSess.map(s => s.date))).sort().reverse();
    let currentStreak = 0;
    let checkDate = new Date();
    const isStudiedToday = datesStudied.includes(today);
    if (!isStudiedToday) checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
      const curStr = checkDate.toISOString().split('T')[0];
      if (datesStudied.includes(curStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const subjectBreakdown = subs.map(sub => {
      const subMonthMinutes = monthSess
        .filter(s => String(s.subject_id) === String(sub.id))
        .reduce((sum, s) => sum + s.duration_minutes, 0);
      return { id: sub.id, name: sub.name, color: sub.color, total_minutes: subMonthMinutes };
    }).sort((a, b) => b.total_minutes - a.total_minutes);

    return {
      todayMinutes,
      weekMinutes,
      monthMinutes,
      totalMinutes,
      totalSessions: allSess.length,
      totalDaysStudied: datesStudied.length,
      currentStreak,
      longestStreak: Math.max(currentStreak, datesStudied.length > 0 ? 1 : 0),
      isStudiedToday,
      subjectBreakdown,
      recentSessions: allSess.slice(0, 6)
    };
  },
  getMonthlyGoal: (year, month) => {
    initLocalDataIfEmpty();
    const goals = JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS) || '[]');
    return goals.find(g => g.year === Number(year) && g.month === Number(month)) || { year, month, target_hours: 60 };
  },
  saveMonthlyGoal: (data) => {
    initLocalDataIfEmpty();
    let goals = JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS) || '[]');
    goals = goals.filter(g => !(g.year === Number(data.year) && g.month === Number(data.month)));
    goals.push(data);
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    return data;
  },
  resetDatabase: () => {
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    initLocalDataIfEmpty();
    return { success: true };
  }
};

// HTTP Request helper with auto-fallback to localApi
async function request(endpoint, options = {}, fallbackFn) {
  const isOnline = await checkBackend();
  if (!isOnline) {
    return fallbackFn();
  }

  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`Backend unreachable on ${endpoint}, falling back to browser storage.`, error);
    return fallbackFn();
  }
}

export const api = {
  // Subjects
  getSubjects: () => request('/subjects', {}, () => localApi.getSubjects()),
  createSubject: (data) => request('/subjects', { method: 'POST', body: JSON.stringify(data) }, () => localApi.createSubject(data)),
  updateSubject: (id, data) => request(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }, () => localApi.updateSubject(id, data)),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: 'DELETE' }, () => localApi.deleteSubject(id)),

  // Sessions
  getSessions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/sessions${qs ? `?${qs}` : ''}`, {}, () => localApi.getSessions(params));
  },
  createSession: (data) => request('/sessions', { method: 'POST', body: JSON.stringify(data) }, () => localApi.createSession(data)),
  updateSession: (id, data) => request(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }, () => localApi.updateSession(id, data)),
  deleteSession: (id) => request(`/sessions/${id}`, { method: 'DELETE' }, () => localApi.deleteSession(id)),
  deleteSessionsByDate: (dateStr) => request(`/sessions/date/${dateStr}`, { method: 'DELETE' }, () => localApi.deleteSessionsByDate(dateStr)),

  // Calendar
  getCalendarData: (year, month) => request(`/calendar?year=${year}&month=${month}`, {}, () => localApi.getCalendarData(year, month)),

  // Stats & Heatmap
  getHeatmapData: (days = 365) => request(`/stats/heatmap?days=${days}`, {}, () => localApi.getHeatmapData(days)),
  getSummaryStats: () => request('/stats/summary', {}, () => localApi.getSummaryStats()),

  // Goals
  getMonthlyGoal: (year, month) => request(`/goals/monthly?year=${year}&month=${month}`, {}, () => localApi.getMonthlyGoal(year, month)),
  saveMonthlyGoal: (data) => request('/goals/monthly', { method: 'POST', body: JSON.stringify(data) }, () => localApi.saveMonthlyGoal(data)),

  // Reset
  resetDatabase: () => request('/reset', { method: 'POST' }, () => localApi.resetDatabase()),
};

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Ensure data folder exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'tracker.sqlite');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT DEFAULT 'BookOpen',
      target_hours_per_week REAL DEFAULT 5.0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL,
      date TEXT NOT NULL, -- YYYY-MM-DD
      duration_minutes INTEGER NOT NULL,
      notes TEXT,
      focus_rating INTEGER DEFAULT 4, -- 1 to 5
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS monthly_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL, -- 1 to 12
      target_hours REAL NOT NULL,
      notes TEXT,
      UNIQUE(year, month)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
    CREATE INDEX IF NOT EXISTS idx_sessions_subject ON sessions(subject_id);
  `);

  seedInitialDataIfEmpty();
}

function seedInitialDataIfEmpty() {
  const subjectCount = db.prepare('SELECT COUNT(*) as count FROM subjects').get().count;
  if (subjectCount > 0) return;

  console.log('🌱 Seeding initial sample subjects and study logs...');

  const insertSubject = db.prepare(`
    INSERT INTO subjects (name, color, icon, target_hours_per_week)
    VALUES (?, ?, ?, ?)
  `);

  const s1 = insertSubject.run('Computer Science & Algorithms', '#3b82f6', 'Code', 10).lastInsertRowid;
  const s2 = insertSubject.run('Applied Mathematics', '#8b5cf6', 'Binary', 8).lastInsertRowid;
  const s3 = insertSubject.run('Machine Learning & AI', '#10b981', 'Cpu', 12).lastInsertRowid;
  const s4 = insertSubject.run('System Design & Architecture', '#f59e0b', 'Layers', 6).lastInsertRowid;
  const s5 = insertSubject.run('Technical Reading & Docs', '#ec4899', 'BookOpen', 4).lastInsertRowid;

  const subjects = [s1, s2, s3, s4, s5];

  // Seed study sessions for the last 45 days
  const insertSession = db.prepare(`
    INSERT INTO sessions (subject_id, date, duration_minutes, notes, focus_rating)
    VALUES (?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const sampleNotes = [
    'Deep focus session on dynamic programming and graphs',
    'Worked on neural network forward & backprop implementations',
    'Distributed systems caching & consensus protocols review',
    'Linear algebra matrix decomposition exercises',
    'Read documentation and built quick micro-benchmarks',
    'Reviewed flashcards and solved 4 LeetCode practice problems',
    'Architecture diagramming and high-level design breakdown',
    'Refactoring algorithm implementations and unit tests'
  ];

  for (let i = 45; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Probability of studying on any given day (~85% active days for a realistic streak)
    const studied = Math.random() < 0.85;
    if (studied) {
      // 1 to 3 sessions per day
      const sessionCount = Math.floor(Math.random() * 3) + 1;
      for (let s = 0; s < sessionCount; s++) {
        const subjectId = subjects[Math.floor(Math.random() * subjects.length)];
        const durations = [30, 45, 60, 75, 90, 120];
        const duration = durations[Math.floor(Math.random() * durations.length)];
        const note = sampleNotes[Math.floor(Math.random() * sampleNotes.length)];
        const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 rating

        insertSession.run(subjectId, dateStr, duration, note, rating);
      }
    }
  }

  // Set current month target goal
  const curYear = today.getFullYear();
  const curMonth = today.getMonth() + 1;
  db.prepare(`
    INSERT OR REPLACE INTO monthly_goals (year, month, target_hours, notes)
    VALUES (?, ?, ?, ?)
  `).run(curYear, curMonth, 80, 'Target: 80 hours of high-focus deep work this month');

  console.log('✅ Sample data seeded successfully.');
}

// Queries & Operations

function getSubjects() {
  const rows = db.prepare(`
    SELECT s.*, 
           COUNT(sess.id) as session_count,
           COALESCE(SUM(sess.duration_minutes), 0) as total_minutes
    FROM subjects s
    LEFT JOIN sessions sess ON s.id = sess.subject_id
    GROUP BY s.id
    ORDER BY s.name ASC
  `).all();
  return rows.map(r => ({ ...r }));
}

function createSubject({ name, color, icon, target_hours_per_week }) {
  const stmt = db.prepare(`
    INSERT INTO subjects (name, color, icon, target_hours_per_week)
    VALUES (?, ?, ?, ?)
  `);
  const res = stmt.run(name, color || '#3b82f6', icon || 'BookOpen', target_hours_per_week || 5);
  return getSubjectById(res.lastInsertRowid);
}

function getSubjectById(id) {
  const row = db.prepare('SELECT * FROM subjects WHERE id = ?').get(id);
  return row ? { ...row } : null;
}

function updateSubject(id, { name, color, icon, target_hours_per_week }) {
  const stmt = db.prepare(`
    UPDATE subjects
    SET name = COALESCE(?, name),
        color = COALESCE(?, color),
        icon = COALESCE(?, icon),
        target_hours_per_week = COALESCE(?, target_hours_per_week)
    WHERE id = ?
  `);
  stmt.run(name, color, icon, target_hours_per_week, id);
  return getSubjectById(id);
}

function deleteSubject(id) {
  const stmt = db.prepare('DELETE FROM subjects WHERE id = ?');
  return stmt.run(id);
}

function getSessions({ startDate, endDate, month, year, subjectId }) {
  let query = `
    SELECT sess.*, s.name as subject_name, s.color as subject_color, s.icon as subject_icon
    FROM sessions sess
    JOIN subjects s ON sess.subject_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (startDate && endDate) {
    query += ' AND sess.date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  } else if (month && year) {
    const padMonth = String(month).padStart(2, '0');
    query += " AND strftime('%Y-%m', sess.date) = ?";
    params.push(`${year}-${padMonth}`);
  }

  if (subjectId) {
    query += ' AND sess.subject_id = ?';
    params.push(subjectId);
  }

  query += ' ORDER BY sess.date DESC, sess.created_at DESC';

  const rows = db.prepare(query).all(...params);
  return rows.map(r => ({ ...r }));
}

function createSession({ subject_id, date, duration_minutes, notes, focus_rating }) {
  const stmt = db.prepare(`
    INSERT INTO sessions (subject_id, date, duration_minutes, notes, focus_rating)
    VALUES (?, ?, ?, ?, ?)
  `);
  const res = stmt.run(
    subject_id,
    date,
    duration_minutes,
    notes || '',
    focus_rating || 4
  );
  return getSessionById(res.lastInsertRowid);
}

function getSessionById(id) {
  const row = db.prepare(`
    SELECT sess.*, s.name as subject_name, s.color as subject_color, s.icon as subject_icon
    FROM sessions sess
    JOIN subjects s ON sess.subject_id = s.id
    WHERE sess.id = ?
  `).get(id);
  return row ? { ...row } : null;
}

function updateSession(id, { subject_id, date, duration_minutes, notes, focus_rating }) {
  const stmt = db.prepare(`
    UPDATE sessions
    SET subject_id = COALESCE(?, subject_id),
        date = COALESCE(?, date),
        duration_minutes = COALESCE(?, duration_minutes),
        notes = COALESCE(?, notes),
        focus_rating = COALESCE(?, focus_rating)
    WHERE id = ?
  `);
  stmt.run(subject_id, date, duration_minutes, notes, focus_rating, id);
  return getSessionById(id);
}

function deleteSession(id) {
  const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
  return stmt.run(id);
}

// Activity Heatmap aggregation (last N days)
function getHeatmapData(daysBack = 365) {
  const rows = db.prepare(`
    SELECT date, 
           SUM(duration_minutes) as total_minutes, 
           COUNT(*) as session_count
    FROM sessions
    WHERE date >= date('now', '-' || ? || ' days')
    GROUP BY date
    ORDER BY date ASC
  `).all(daysBack);

  return rows.map(r => ({ ...r }));
}

// Calendar Month Aggregate data
function getMonthCalendarData(year, month) {
  const padMonth = String(month).padStart(2, '0');
  const monthStr = `${year}-${padMonth}`;

  // Get daily summaries
  const dailySummary = db.prepare(`
    SELECT date, 
           SUM(duration_minutes) as total_minutes, 
           COUNT(*) as session_count
    FROM sessions
    WHERE strftime('%Y-%m', date) = ?
    GROUP BY date
  `).all(monthStr).map(r => ({ ...r }));

  // Get all sessions for that month
  const sessions = getSessions({ month, year });

  // Get monthly goal
  const goal = getMonthlyGoal(year, month);

  return {
    year,
    month,
    dailySummary,
    sessions,
    goal
  };
}

// Stats & Streaks calculation
function getStatsSummary() {
  const today = new Date().toISOString().split('T')[0];

  const totalAllTime = db.prepare(`
    SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes,
           COUNT(*) as total_sessions,
           COUNT(DISTINCT date) as total_days_studied
    FROM sessions
  `).get();

  // Today's total
  const todayRow = db.prepare(`
    SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes,
           COUNT(*) as session_count
    FROM sessions
    WHERE date = ?
  `).get(today);

  // This Week (last 7 days)
  const weekRow = db.prepare(`
    SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes
    FROM sessions
    WHERE date >= date('now', '-7 days')
  `).get();

  // This Month
  const monthRow = db.prepare(`
    SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes
    FROM sessions
    WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
  `).get();

  // Streak calculation: Get distinct dates sorted DESC
  const datesStudied = db.prepare(`
    SELECT DISTINCT date FROM sessions ORDER BY date DESC
  `).all().map(r => r.date);

  const streakInfo = calculateStreaks(datesStudied, today);

  // Subject breakdown for current month
  const subjectBreakdown = db.prepare(`
    SELECT s.id, s.name, s.color, COALESCE(SUM(sess.duration_minutes), 0) as total_minutes
    FROM subjects s
    LEFT JOIN sessions sess ON s.id = sess.subject_id AND strftime('%Y-%m', sess.date) = strftime('%Y-%m', 'now')
    GROUP BY s.id
    ORDER BY total_minutes DESC
  `).all().map(r => ({ ...r }));

  // Recent 5 sessions
  const recentSessions = db.prepare(`
    SELECT sess.*, s.name as subject_name, s.color as subject_color
    FROM sessions sess
    JOIN subjects s ON sess.subject_id = s.id
    ORDER BY sess.date DESC, sess.created_at DESC
    LIMIT 6
  `).all().map(r => ({ ...r }));

  return {
    todayMinutes: todayRow ? todayRow.total_minutes : 0,
    weekMinutes: weekRow ? weekRow.total_minutes : 0,
    monthMinutes: monthRow ? monthRow.total_minutes : 0,
    totalMinutes: totalAllTime ? totalAllTime.total_minutes : 0,
    totalSessions: totalAllTime ? totalAllTime.total_sessions : 0,
    totalDaysStudied: totalAllTime ? totalAllTime.total_days_studied : 0,
    currentStreak: streakInfo.currentStreak,
    longestStreak: streakInfo.longestStreak,
    isStudiedToday: streakInfo.isStudiedToday,
    subjectBreakdown,
    recentSessions
  };
}

function calculateStreaks(dateList, todayStr) {
  if (!dateList || dateList.length === 0) {
    return { currentStreak: 0, longestStreak: 0, isStudiedToday: false };
  }

  const dateSet = new Set(dateList);
  const isStudiedToday = dateSet.has(todayStr);

  // Determine current streak start check
  let checkDate = new Date();
  if (!isStudiedToday) {
    // If not studied today, streak might still be alive if studied yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let currentStreak = 0;
  while (true) {
    const curStr = checkDate.toISOString().split('T')[0];
    if (dateSet.has(curStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak across all recorded days
  let longestStreak = 0;
  let tempStreak = 0;
  if (dateList.length > 0) {
    // Convert to timestamps sorted ascending
    const sortedDates = Array.from(dateSet).sort();
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    isStudiedToday
  };
}

function getMonthlyGoal(year, month) {
  const row = db.prepare(`
    SELECT * FROM monthly_goals WHERE year = ? AND month = ?
  `).get(year, month);
  return row ? { ...row } : null;
}

function setMonthlyGoal(year, month, target_hours, notes) {
  db.prepare(`
    INSERT INTO monthly_goals (year, month, target_hours, notes)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(year, month) DO UPDATE SET
      target_hours = excluded.target_hours,
      notes = excluded.notes
  `).run(year, month, target_hours, notes || '');
  return getMonthlyGoal(year, month);
}

// Reset/reseed utility
function resetDatabase() {
  db.exec(`
    DELETE FROM sessions;
    DELETE FROM subjects;
    DELETE FROM monthly_goals;
  `);
  seedInitialDataIfEmpty();
}

// Auto-run schema initialization
initSchema();

module.exports = {
  db,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getHeatmapData,
  getMonthCalendarData,
  getStatsSummary,
  getMonthlyGoal,
  setMonthlyGoal,
  resetDatabase
};

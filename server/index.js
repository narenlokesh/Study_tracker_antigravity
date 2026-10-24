const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Subjects Endpoints
app.get('/api/subjects', (req, res) => {
  try {
    const subjects = db.getSubjects();
    res.json(subjects);
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ error: 'Failed to retrieve subjects' });
  }
});

app.post('/api/subjects', (req, res) => {
  try {
    const { name, color, icon, target_hours_per_week } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Subject name is required' });
    }
    const newSubject = db.createSubject({
      name: name.trim(),
      color: color || '#3b82f6',
      icon: icon || 'BookOpen',
      target_hours_per_week: Number(target_hours_per_week) || 5
    });
    res.status(201).json(newSubject);
  } catch (err) {
    console.error('Error creating subject:', err);
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

app.put('/api/subjects/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = db.updateSubject(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Subject not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating subject:', err);
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

app.delete('/api/subjects/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    db.deleteSubject(id);
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (err) {
    console.error('Error deleting subject:', err);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// Study Sessions Endpoints
app.get('/api/sessions', (req, res) => {
  try {
    const { startDate, endDate, month, year, subjectId } = req.query;
    const sessions = db.getSessions({
      startDate,
      endDate,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      subjectId: subjectId ? Number(subjectId) : undefined
    });
    res.json(sessions);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ error: 'Failed to retrieve study sessions' });
  }
});

app.post('/api/sessions', (req, res) => {
  try {
    const { subject_id, date, duration_minutes, notes, focus_rating } = req.body;
    if (!subject_id) return res.status(400).json({ error: 'Subject is required' });
    if (!date) return res.status(400).json({ error: 'Date is required (YYYY-MM-DD)' });
    if (!duration_minutes || Number(duration_minutes) <= 0) {
      return res.status(400).json({ error: 'Valid duration in minutes is required' });
    }

    const newSession = db.createSession({
      subject_id: Number(subject_id),
      date,
      duration_minutes: Number(duration_minutes),
      notes: notes || '',
      focus_rating: Number(focus_rating) || 4
    });

    res.status(201).json(newSession);
  } catch (err) {
    console.error('Error logging session:', err);
    res.status(500).json({ error: 'Failed to log study session' });
  }
});

app.put('/api/sessions/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = db.updateSession(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Session not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating session:', err);
    res.status(500).json({ error: 'Failed to update study session' });
  }
});

app.delete('/api/sessions/date/:date', (req, res) => {
  try {
    const { date } = req.params;
    db.deleteSessionsByDate(date);
    res.json({ success: true, message: `All sessions deleted for ${date}` });
  } catch (err) {
    console.error('Error deleting sessions for date:', err);
    res.status(500).json({ error: 'Failed to delete sessions for date' });
  }
});

app.delete('/api/sessions/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    db.deleteSession(id);
    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (err) {
    console.error('Error deleting session:', err);
    res.status(500).json({ error: 'Failed to delete study session' });
  }
});

// Calendar Month Grid Data
app.get('/api/calendar', (req, res) => {
  try {
    const today = new Date();
    const year = req.query.year ? Number(req.query.year) : today.getFullYear();
    const month = req.query.month ? Number(req.query.month) : today.getMonth() + 1;

    const data = db.getMonthCalendarData(year, month);
    res.json(data);
  } catch (err) {
    console.error('Error getting calendar data:', err);
    res.status(500).json({ error: 'Failed to get calendar data' });
  }
});

// Heatmap Data (Contribution grid like GitHub)
app.get('/api/stats/heatmap', (req, res) => {
  try {
    const daysBack = req.query.days ? Number(req.query.days) : 365;
    const data = db.getHeatmapData(daysBack);
    res.json(data);
  } catch (err) {
    console.error('Error getting heatmap data:', err);
    res.status(500).json({ error: 'Failed to get heatmap data' });
  }
});

// Overall Summary & Streaks
app.get('/api/stats/summary', (req, res) => {
  try {
    const summary = db.getStatsSummary();
    res.json(summary);
  } catch (err) {
    console.error('Error getting summary stats:', err);
    res.status(500).json({ error: 'Failed to get summary stats' });
  }
});

// Monthly Goal Endpoints
app.get('/api/goals/monthly', (req, res) => {
  try {
    const today = new Date();
    const year = req.query.year ? Number(req.query.year) : today.getFullYear();
    const month = req.query.month ? Number(req.query.month) : today.getMonth() + 1;
    const goal = db.getMonthlyGoal(year, month);
    res.json(goal || { year, month, target_hours: 0, notes: '' });
  } catch (err) {
    console.error('Error getting monthly goal:', err);
    res.status(500).json({ error: 'Failed to get monthly goal' });
  }
});

app.post('/api/goals/monthly', (req, res) => {
  try {
    const { year, month, target_hours, notes } = req.body;
    if (!year || !month || target_hours === undefined) {
      return res.status(400).json({ error: 'Year, month, and target_hours are required' });
    }
    const saved = db.setMonthlyGoal(Number(year), Number(month), Number(target_hours), notes);
    res.json(saved);
  } catch (err) {
    console.error('Error saving monthly goal:', err);
    res.status(500).json({ error: 'Failed to save monthly goal' });
  }
});

// Database re-seed endpoint
app.post('/api/reset', (req, res) => {
  try {
    db.resetDatabase();
    res.json({ success: true, message: 'Database reset to initial sample data' });
  } catch (err) {
    console.error('Error resetting database:', err);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// Serve static files from React build if available
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Study Tracker API server running on 0.0.0.0:${PORT}`);
  console.log(`📂 Client static directory: ${clientDist} (exists: ${fs.existsSync(clientDist)})`);
});

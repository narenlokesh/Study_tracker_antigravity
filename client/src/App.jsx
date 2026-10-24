import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import CalendarView from './components/CalendarView';
import HeatmapView from './components/HeatmapView';
import SubjectManager from './components/SubjectManager';
import PomodoroTimer from './components/PomodoroTimer';
import SessionLoggerModal from './components/SessionLoggerModal';
import DayDetailsModal from './components/DayDetailsModal';
import { api } from './api';
import { RefreshCw, Database, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Data states
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [calendarData, setCalendarData] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [monthlyGoal, setMonthlyGoal] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logInitialDate, setLogInitialDate] = useState('');
  const [logInitialSubjectId, setLogInitialSubjectId] = useState('');
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  // Fetch all primary dashboard and view data
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const [subjectsRes, statsRes, calendarRes, heatmapRes, goalRes] = await Promise.all([
        api.getSubjects(),
        api.getSummaryStats(),
        api.getCalendarData(year, month),
        api.getHeatmapData(365),
        api.getMonthlyGoal(year, month),
      ]);

      setSubjects(subjectsRes);
      setStats(statsRes);
      setCalendarData(calendarRes);
      setHeatmapData(heatmapRes);
      setMonthlyGoal(goalRes);
    } catch (err) {
      console.error('Failed to load tracker data:', err);
      setError('Unable to connect to the Study Tracker SQLite API server.');
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Session Handlers
  const handleSaveSession = async (sessionData) => {
    try {
      await api.createSession(sessionData);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to save study session');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await api.deleteSession(sessionId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete study session');
    }
  };

  // Subject Handlers
  const handleCreateSubject = async (subjectData) => {
    try {
      await api.createSubject(subjectData);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to create subject');
    }
  };

  const handleUpdateSubject = async (id, subjectData) => {
    try {
      await api.updateSubject(id, subjectData);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update subject');
    }
  };

  const handleDeleteSubject = async (id) => {
    try {
      await api.deleteSubject(id);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete subject');
    }
  };

  // Goal Handler
  const handleSaveMonthlyGoal = async (targetHours) => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      await api.saveMonthlyGoal({
        year,
        month,
        target_hours: targetHours,
      });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update monthly target');
    }
  };

  // Quick action openers
  const openLogForDate = (dateStr, subId) => {
    setLogInitialDate(dateStr);
    setLogInitialSubjectId(subId || '');
    setIsLogModalOpen(true);
  };

  const handleDaySelect = (dateStr) => {
    setSelectedDay(dateStr);
  };

  const handleResetData = async () => {
    if (confirm('Reset database to default sample data? All customized logs will be refreshed.')) {
      try {
        await api.resetDatabase();
        await loadData();
      } catch (err) {
        alert('Failed to reset database: ' + err.message);
      }
    }
  };

  // Sessions for the currently inspected day modal
  const selectedDaySessions = React.useMemo(() => {
    if (!selectedDay || !calendarData?.sessions) return [];
    return calendarData.sessions.filter((s) => s.date === selectedDay);
  }, [selectedDay, calendarData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenLogModal={() => openLogForDate(new Date().toISOString().split('T')[0])}
        onToggleTimer={() => setIsTimerOpen(true)}
        streak={stats?.currentStreak || 0}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error notification banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error} Ensure server is running on port 5000.</span>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Tab Views */}
        {currentTab === 'overview' && (
          <StatsOverview
            stats={stats}
            monthlyGoal={monthlyGoal}
            onSaveMonthlyGoal={handleSaveMonthlyGoal}
            onOpenLogModal={() => openLogForDate(new Date().toISOString().split('T')[0])}
            onNavigateTab={setCurrentTab}
            onSelectDate={handleDaySelect}
          />
        )}

        {currentTab === 'calendar' && (
          <CalendarView
            currentDate={currentDate}
            calendarData={calendarData}
            subjects={subjects}
            onMonthChange={setCurrentDate}
            onSelectDate={handleDaySelect}
            onQuickAddSession={openLogForDate}
          />
        )}

        {currentTab === 'heatmap' && (
          <HeatmapView
            heatmapData={heatmapData}
            stats={stats}
            onSelectDate={handleDaySelect}
          />
        )}

        {currentTab === 'subjects' && (
          <SubjectManager
            subjects={subjects}
            onCreateSubject={handleCreateSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>SQLite Database: <code className="font-mono text-slate-400">server/data/tracker.sqlite</code></span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleResetData}
              className="hover:text-slate-300 transition underline underline-offset-2"
            >
              Reset Sample Data
            </button>
            <span>•</span>
            <span>FocusTrack Full-Stack App</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SessionLoggerModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        subjects={subjects}
        onSaveSession={handleSaveSession}
        initialDate={logInitialDate}
        initialSubjectId={logInitialSubjectId}
      />

      <DayDetailsModal
        dateStr={selectedDay}
        onClose={() => setSelectedDay(null)}
        sessions={selectedDaySessions}
        onDeleteSession={handleDeleteSession}
        onAddSessionForDate={(dateStr) => {
          setSelectedDay(null);
          openLogForDate(dateStr);
        }}
      />

      <PomodoroTimer
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        subjects={subjects}
        onLogCompletedSession={handleSaveSession}
      />
    </div>
  );
}

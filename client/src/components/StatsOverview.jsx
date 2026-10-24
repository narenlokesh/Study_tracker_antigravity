import React, { useState } from 'react';
import { 
  Flame, 
  Clock, 
  Target, 
  Trophy, 
  CalendarDays, 
  TrendingUp, 
  Star, 
  Edit3,
  Check,
  ChevronRight,
  BookOpen
} from 'lucide-react';

function formatMinutes(minutes) {
  if (!minutes || minutes === 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

export default function StatsOverview({ 
  stats, 
  monthlyGoal, 
  onSaveMonthlyGoal, 
  onOpenLogModal,
  onNavigateTab,
  onSelectDate 
}) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalHours, setGoalHours] = useState(monthlyGoal?.target_hours || 60);

  const monthMinutes = stats?.monthMinutes || 0;
  const monthHours = (monthMinutes / 60).toFixed(1);
  const targetGoalHours = monthlyGoal?.target_hours || 60;
  const goalPercentage = Math.min(100, Math.round((monthMinutes / (targetGoalHours * 60)) * 100));

  const handleGoalSubmit = (e) => {
    e.preventDefault();
    onSaveMonthlyGoal(Number(goalHours));
    setIsEditingGoal(false);
  };

  return (
    <div className="space-y-6">
      {/* 4 Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Focus Card */}
        <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today</span>
            <div className={`p-2 rounded-xl ${stats?.todayMinutes > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {formatMinutes(stats?.todayMinutes)}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              {stats?.isStudiedToday ? (
                <span className="text-emerald-400 font-medium">✓ Daily goal active</span>
              ) : (
                <span className="text-amber-400">Pending study session</span>
              )}
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Current Streak Card */}
        <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Streak</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {stats?.currentStreak || 0}
              </span>
              <span className="text-sm font-semibold text-amber-400">Days 🔥</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Record streak: <strong className="text-slate-200">{stats?.longestStreak || 0} days</strong></span>
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Weekly Progress Card */}
        <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Past 7 Days</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {formatMinutes(stats?.weekMinutes)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {stats?.totalSessions || 0} total sessions logged
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Monthly Target Progress Card */}
        <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Target</span>
            <button
              onClick={() => setIsEditingGoal(!isEditingGoal)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Edit monthly goal"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {goalPercentage}%
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {monthHours}h / {targetGoalHours}h
              </span>
            </div>
            {/* Progress Bar */}
            <div className="mt-2.5 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, goalPercentage)}%` }}
              />
            </div>
          </div>

          {/* Inline Goal Editor Modal/Drawer */}
          {isEditingGoal && (
            <form onSubmit={handleGoalSubmit} className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="500"
                value={goalHours}
                onChange={(e) => setGoalHours(e.target.value)}
                className="w-20 px-2 py-1 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-none focus:border-emerald-500"
                placeholder="Hours"
              />
              <span className="text-xs text-slate-400">hours/mo</span>
              <button
                type="submit"
                className="ml-auto p-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded flex items-center"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Grid: Subject Breakdown & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Breakdown Progress (2 cols on lg) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                This Month's Subject Focus
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Time distribution across study categories</p>
            </div>
            <button
              onClick={() => onNavigateTab('subjects')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
            >
              Manage Subjects
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {stats?.subjectBreakdown && stats.subjectBreakdown.length > 0 ? (
              stats.subjectBreakdown.map((subj) => {
                const totalMinutes = stats.subjectBreakdown.reduce((sum, s) => sum + s.total_minutes, 0);
                const percent = totalMinutes > 0 ? Math.round((subj.total_minutes / totalMinutes) * 100) : 0;
                return (
                  <div key={subj.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: subj.color }}
                        />
                        <span className="font-medium text-slate-200">{subj.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-400">{percent}%</span>
                        <span className="text-xs font-mono font-bold text-slate-100">
                          {formatMinutes(subj.total_minutes)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: subj.color,
                          width: `${percent}%`
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">No study sessions recorded yet this month.</p>
            )}
          </div>
        </div>

        {/* Recent Study Sessions */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-teal-400" />
                Recent Logs
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest deep work sessions</p>
            </div>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition"
            >
              Full Calendar
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {stats?.recentSessions && stats.recentSessions.length > 0 ? (
              stats.recentSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectDate(session.date)}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-xl transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: session.subject_color }}
                      />
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition">
                        {session.subject_name}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {formatMinutes(session.duration_minutes)}
                    </span>
                  </div>

                  {session.notes && (
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-1">
                      {session.notes}
                    </p>
                  )}

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{session.date}</span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: session.focus_rating || 4 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-slate-400">No sessions recorded yet.</p>
                <button
                  onClick={onOpenLogModal}
                  className="mt-3 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition"
                >
                  Log Your First Session
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

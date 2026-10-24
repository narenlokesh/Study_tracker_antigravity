import React from 'react';
import { 
  Calendar, 
  Flame, 
  BookOpen, 
  Timer, 
  PlusCircle, 
  BarChart3, 
  Database,
  CheckCircle2
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  onOpenLogModal, 
  onToggleTimer, 
  isTimerRunning,
  streak,
  onResetData
}) {
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'calendar', label: 'Monthly Calendar', icon: Calendar },
    { id: 'heatmap', label: 'Study Heatmap', icon: Flame },
    { id: 'subjects', label: 'Subjects & Goals', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">FocusTrack</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  SQLite
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Monthly Study & Streak Tracker</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 shadow-sm shadow-black/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  {item.label}
                  {item.id === 'heatmap' && streak > 0 && (
                    <span className="ml-0.5 flex items-center text-xs font-bold text-amber-400">
                      {streak}🔥
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Pomodoro Timer Toggle */}
            <button
              onClick={onToggleTimer}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border ${
                isTimerRunning
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700/60 hover:text-white'
              }`}
              title="Open Focus & Pomodoro Timer"
            >
              <Timer className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Timer</span>
            </button>

            {/* Quick Log Session Button */}
            <button
              onClick={onOpenLogModal}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Study</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium ${
                  isActive ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

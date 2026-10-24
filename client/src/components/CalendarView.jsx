import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2,
  CheckCircle,
  Filter,
  Sparkles
} from 'lucide-react';

function formatMinutes(minutes) {
  if (!minutes || minutes === 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({ 
  currentDate, 
  calendarData, 
  subjects,
  onMonthChange, 
  onSelectDate, 
  onQuickAddSession,
  onDeleteDay
}) {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  const todayStr = new Date().toISOString().split('T')[0];

  // Map daily summaries into an easy lookup map by date string "YYYY-MM-DD"
  const dailySummaryMap = React.useMemo(() => {
    const map = new Map();
    if (calendarData?.dailySummary) {
      calendarData.dailySummary.forEach(item => {
        map.set(item.date, item);
      });
    }
    return map;
  }, [calendarData]);

  // Group sessions by date to show subject badges on calendar cells
  const sessionsByDate = React.useMemo(() => {
    const map = new Map();
    if (calendarData?.sessions) {
      calendarData.sessions.forEach(sess => {
        if (!map.has(sess.date)) {
          map.set(sess.date, []);
        }
        map.get(sess.date).push(sess);
      });
    }
    return map;
  }, [calendarData]);

  // Calculate days in the current month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayWeekday = new Date(currentYear, currentMonth - 1, 1).getDay();

  const handlePrevMonth = () => {
    const newDate = new Date(currentYear, currentMonth - 2, 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentYear, currentMonth, 1);
    onMonthChange(newDate);
  };

  const handleGoToday = () => {
    onMonthChange(new Date());
  };

  // Month Statistics
  const totalMonthMinutes = React.useMemo(() => {
    if (!calendarData?.dailySummary) return 0;
    return calendarData.dailySummary.reduce((acc, curr) => acc + (curr.total_minutes || 0), 0);
  }, [calendarData]);

  const activeDaysCount = calendarData?.dailySummary?.length || 0;
  const monthGoalHours = calendarData?.goal?.target_hours || 60;
  const goalProgress = Math.min(100, Math.round((totalMonthMinutes / (monthGoalHours * 60)) * 100));

  // Determine cell intensity class based on minutes studied
  const getIntensityClass = (minutes) => {
    if (!minutes || minutes === 0) return 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/50';
    if (minutes < 60) return 'border-emerald-800/50 bg-emerald-950/30 hover:bg-emerald-900/40';
    if (minutes < 120) return 'border-emerald-700/60 bg-emerald-950/60 hover:bg-emerald-900/60';
    if (minutes < 240) return 'border-emerald-500/70 bg-emerald-900/50 hover:bg-emerald-800/60 shadow-sm shadow-emerald-500/10';
    return 'border-emerald-400 bg-emerald-900/80 hover:bg-emerald-800 shadow-md shadow-emerald-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Month Navigator & Summary Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Month Selector Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 text-base font-bold text-white min-w-[150px] text-center tracking-tight">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleGoToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Today
          </button>
        </div>

        {/* Quick Month Highlights */}
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-xs text-slate-400 block">Total Studied</span>
            <span className="font-bold text-emerald-400 text-base font-mono">
              {formatMinutes(totalMonthMinutes)}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div>
            <span className="text-xs text-slate-400 block">Active Days</span>
            <span className="font-bold text-slate-200 text-base">
              {activeDaysCount} <span className="text-xs text-slate-500 font-normal">/ {daysInMonth}d</span>
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div>
            <span className="text-xs text-slate-400 block">Monthly Target</span>
            <span className="font-bold text-white text-base">
              {goalProgress}% <span className="text-xs text-slate-500 font-normal">({monthGoalHours}h)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        {/* Weekday Header */}
        <div className="grid grid-cols-7 gap-2 mb-3 text-center">
          {WEEKDAY_NAMES.map((name, i) => (
            <div
              key={name}
              className={`text-xs font-bold uppercase tracking-wider py-1 ${
                i === 0 || i === 6 ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Calendar Days Matrix */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayWeekday }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="h-24 sm:h-28 rounded-xl border border-slate-800/30 bg-slate-950/20 opacity-40 pointer-events-none"
            />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const dayNum = index + 1;
            const padMonth = String(currentMonth).padStart(2, '0');
            const padDay = String(dayNum).padStart(2, '0');
            const dateStr = `${currentYear}-${padMonth}-${padDay}`;

            const summary = dailySummaryMap.get(dateStr);
            const totalMinutes = summary?.total_minutes || 0;
            const sessionList = sessionsByDate.get(dateStr) || [];
            const isToday = dateStr === todayStr;

            return (
              <div
                key={dateStr}
                onClick={() => onSelectDate(dateStr)}
                className={`group relative h-24 sm:h-28 rounded-xl border p-2 flex flex-col justify-between transition-all duration-150 cursor-pointer ${getIntensityClass(
                  totalMinutes
                )} ${isToday ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950' : ''}`}
              >
                {/* Cell Header: Day Number + Quick Actions */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      isToday
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                        : totalMinutes > 0
                        ? 'text-white'
                        : 'text-slate-400'
                    }`}
                  >
                    {dayNum}
                  </span>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    {/* Quick Add Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAddSession(dateStr);
                      }}
                      className="p-1 rounded-md bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition shadow-sm"
                      title={`Log study session for ${dateStr}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Delete Day Action Button */}
                    {totalMinutes > 0 && onDeleteDay && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete all study logs for ${dateStr}?`)) {
                            onDeleteDay(dateStr);
                          }
                        }}
                        className="p-1 rounded-md bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition shadow-sm"
                        title={`Delete all logs for ${dateStr}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Center / Study Duration Badge */}
                {totalMinutes > 0 ? (
                  <div className="my-auto text-left">
                    <span className="inline-block text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30 shadow-xs">
                      {formatMinutes(totalMinutes)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                      {sessionList.length} {sessionList.length === 1 ? 'session' : 'sessions'}
                    </span>
                  </div>
                ) : (
                  <div className="my-auto opacity-0 group-hover:opacity-100 transition text-[11px] text-slate-500 text-center">
                    + Log
                  </div>
                )}

                {/* Subject Colored Dots / Badges */}
                <div className="flex items-center gap-1 overflow-hidden h-3">
                  {sessionList.slice(0, 4).map((sess, idx) => (
                    <span
                      key={sess.id || idx}
                      className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: sess.subject_color }}
                      title={`${sess.subject_name}: ${sess.duration_minutes}m`}
                    />
                  ))}
                  {sessionList.length > 4 && (
                    <span className="text-[9px] text-slate-400 font-bold leading-none">
                      +{sessionList.length - 4}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend / Info footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Intensity:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-900 border border-slate-800" title="0 mins" />
              <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-800" title="< 1 hr" />
              <span className="w-3 h-3 rounded bg-emerald-900 border border-emerald-700" title="1 - 2 hrs" />
              <span className="w-3 h-3 rounded bg-emerald-800 border border-emerald-500" title="2 - 4 hrs" />
              <span className="w-3 h-3 rounded bg-emerald-700 border border-emerald-400 shadow-sm" title="4+ hrs" />
            </div>
            <span className="text-slate-500">0h → 4h+</span>
          </div>

          <p className="text-slate-500 italic">
            Click on any day to view session details, edit, or log new study hours.
          </p>
        </div>
      </div>
    </div>
  );
}

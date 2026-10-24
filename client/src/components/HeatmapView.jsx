import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Trophy, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  HelpCircle,
  Sparkles,
  Layers
} from 'lucide-react';

function formatMinutes(minutes) {
  if (!minutes || minutes === 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

export default function HeatmapView({ 
  heatmapData = [], 
  stats, 
  onSelectDate 
}) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [viewWeeks, setViewWeeks] = useState(52); // 52 weeks (1 year) or 26 weeks (6 months)

  // Map database heatmap rows by date string "YYYY-MM-DD"
  const heatmapMap = useMemo(() => {
    const map = new Map();
    if (heatmapData) {
      heatmapData.forEach((item) => {
        map.set(item.date, item);
      });
    }
    return map;
  }, [heatmapData]);

  // Generate continuous calendar matrix for the past N weeks ending on today's week
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const totalDays = viewWeeks * 7;
    const resultWeeks = [];
    const months = [];

    // End date is upcoming Saturday to align full weeks
    const endDate = new Date(today);
    const dayOfWeek = endDate.getDay(); // 0 is Sun, 6 is Sat
    const daysUntilEndOfWeek = 6 - dayOfWeek;
    endDate.setDate(endDate.getDate() + daysUntilEndOfWeek);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - totalDays + 1);

    let currentDay = new Date(startDate);
    let lastMonth = -1;

    for (let w = 0; w < viewWeeks; w++) {
      const currentWeekDays = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = currentDay.toISOString().split('T')[0];
        const isFuture = currentDay > today;
        const data = heatmapMap.get(dateStr);

        currentWeekDays.push({
          date: dateStr,
          dayNumber: currentDay.getDate(),
          month: currentDay.getMonth(),
          year: currentDay.getFullYear(),
          dayOfWeek: d,
          isFuture,
          totalMinutes: data ? data.total_minutes : 0,
          sessionCount: data ? data.session_count : 0,
        });

        if (d === 0) {
          const m = currentDay.getMonth();
          if (m !== lastMonth) {
            months.push({
              weekIndex: w,
              label: currentDay.toLocaleDateString('en-US', { month: 'short' }),
            });
            lastMonth = m;
          }
        }

        currentDay.setDate(currentDay.getDate() + 1);
      }
      resultWeeks.push(currentWeekDays);
    }

    return { weeks: resultWeeks, monthLabels: months };
  }, [heatmapMap, viewWeeks]);

  const getHeatmapColor = (minutes, isFuture) => {
    if (isFuture) return 'bg-slate-900/30 border border-transparent opacity-20';
    if (!minutes || minutes === 0) return 'bg-slate-800/60 border border-slate-700/40 hover:border-slate-500';
    if (minutes < 60) return 'bg-emerald-900/80 border border-emerald-700/60 hover:border-emerald-400';
    if (minutes < 120) return 'bg-emerald-700 border border-emerald-500/80 hover:border-emerald-300';
    if (minutes < 240) return 'bg-emerald-500 border border-emerald-400 hover:border-emerald-200';
    return 'bg-emerald-400 border border-emerald-300 shadow-sm shadow-emerald-400/40 hover:scale-125';
  };

  return (
    <div className="space-y-6">
      {/* Heatmap Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
        {/* Header with Title and Range switch */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-4 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Study Activity Heatmap</h2>
                <p className="text-xs text-slate-400">Continuous daily contribution & streak visualization</p>
              </div>
            </div>
          </div>

          {/* Range Buttons */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewWeeks(26)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                viewWeeks === 26
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => setViewWeeks(52)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                viewWeeks === 52
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              12 Months
            </button>
          </div>
        </div>

        {/* Heatmap Grid Visualizer */}
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[760px] inline-block">
            {/* Month Labels */}
            <div className="flex text-[11px] font-semibold text-slate-400 pl-8 mb-2 h-4 relative">
              {monthLabels.map((m, idx) => (
                <span
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${m.weekIndex * 15 + 32}px`,
                  }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            {/* Day row labels + Heatmap columns */}
            <div className="flex gap-2">
              {/* Day Labels (Mon, Wed, Fri) */}
              <div className="flex flex-col justify-between text-[10px] font-bold text-slate-500 h-[105px] pt-0.5 select-none pr-1">
                <span>Sun</span>
                <span>Tue</span>
                <span>Thu</span>
                <span>Sat</span>
              </div>

              {/* The Grid Columns */}
              <div className="flex gap-[3px]">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px]">
                    {week.map((day) => {
                      return (
                        <div
                          key={day.date}
                          onMouseEnter={() => !day.isFuture && setHoveredCell(day)}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => !day.isFuture && onSelectDate(day.date)}
                          className={`w-[12px] h-[12px] rounded-[2px] transition-transform duration-100 cursor-pointer ${getHeatmapColor(
                            day.totalMinutes,
                            day.isFuture
                          )}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating / Active Tooltip Info */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
          {/* Active hover info or streak summary */}
          <div className="min-h-[24px] flex items-center">
            {hoveredCell ? (
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 shadow-md">
                <span className="font-semibold text-slate-200">{hoveredCell.date}</span>
                <span className="text-slate-500">•</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatMinutes(hoveredCell.totalMinutes)}
                </span>
                <span className="text-slate-400">
                  ({hoveredCell.sessionCount} {hoveredCell.sessionCount === 1 ? 'session' : 'sessions'})
                </span>
              </div>
            ) : (
              <span className="text-slate-500 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                Hover over any block to preview; click to view session details or add a log.
              </span>
            )}
          </div>

          {/* Color scale legend */}
          <div className="flex items-center gap-2 self-end sm:self-auto text-slate-400">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-[2px] bg-slate-800/60 border border-slate-700/40" />
              <span className="w-3 h-3 rounded-[2px] bg-emerald-900/80 border border-emerald-700/60" />
              <span className="w-3 h-3 rounded-[2px] bg-emerald-700 border border-emerald-500/80" />
              <span className="w-3 h-3 rounded-[2px] bg-emerald-500 border border-emerald-400" />
              <span className="w-3 h-3 rounded-[2px] bg-emerald-400 border border-emerald-300 shadow-xs" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Streak & Consistency Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Streak */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Current Streak</span>
            <div className="text-2xl font-extrabold text-white mt-0.5">
              {stats?.currentStreak || 0} <span className="text-sm font-semibold text-amber-400">Days</span>
            </div>
          </div>
        </div>

        {/* Record Streak */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Longest Streak</span>
            <div className="text-2xl font-extrabold text-white mt-0.5">
              {stats?.longestStreak || 0} <span className="text-sm font-semibold text-emerald-400">Days</span>
            </div>
          </div>
        </div>

        {/* All-time Active Days */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Days Studied</span>
            <div className="text-2xl font-extrabold text-white mt-0.5">
              {stats?.totalDaysStudied || 0} <span className="text-sm font-semibold text-blue-400">Days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

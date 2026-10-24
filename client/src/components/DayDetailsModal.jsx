import React from 'react';
import { 
  X, 
  Clock, 
  Calendar as CalendarIcon, 
  Trash2, 
  Plus, 
  Star,
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

export default function DayDetailsModal({ 
  dateStr, 
  onClose, 
  sessions = [], 
  onDeleteSession, 
  onAddSessionForDate 
}) {
  if (!dateStr) return null;

  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

  // Formatted date string (e.g. Saturday, October 24, 2026)
  const formattedDate = new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
              Day Breakdown
            </span>
            <h3 className="font-bold text-white text-base mt-0.5">{formattedDate}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Total stats strip */}
        <div className="my-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Total Studied</span>
            <span className="font-mono font-extrabold text-2xl text-emerald-400">
              {formatMinutes(totalMinutes)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Logged Sessions</span>
            <span className="font-bold text-lg text-white">
              {sessions.length}
            </span>
          </div>
        </div>

        {/* Sessions list */}
        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session.id}
                className="p-3.5 bg-slate-950/80 border border-slate-800/90 rounded-2xl relative group hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: session.subject_color }}
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">
                        {session.subject_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {formatMinutes(session.duration_minutes)}
                        </span>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: session.focus_rating || 4 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delete session button */}
                  <button
                    onClick={() => {
                      if (confirm('Delete this study log entry?')) {
                        onDeleteSession(session.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition opacity-0 group-hover:opacity-100"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {session.notes && (
                  <p className="text-xs text-slate-400 mt-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    {session.notes}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No study logs recorded on this date.</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => onAddSessionForDate(dateStr)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-600/20 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Session to {dateStr}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

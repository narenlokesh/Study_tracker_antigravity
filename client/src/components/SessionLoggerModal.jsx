import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Star, BookOpen, FileText } from 'lucide-react';

const DURATION_PRESETS = [25, 45, 60, 90, 120, 180];

export default function SessionLoggerModal({ 
  isOpen, 
  onClose, 
  subjects = [], 
  onSaveSession,
  initialDate,
  initialSubjectId
}) {
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [focusRating, setFocusRating] = useState(4);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setDate(initialDate || today);
      setSubjectId(initialSubjectId || subjects[0]?.id || '');
      setDurationMinutes(60);
      setFocusRating(4);
      setNotes('');
    }
  }, [isOpen, initialDate, initialSubjectId, subjects]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subjectId || !date || durationMinutes <= 0) return;

    onSaveSession({
      subject_id: Number(subjectId),
      date,
      duration_minutes: Number(durationMinutes),
      focus_rating: Number(focusRating),
      notes: notes.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white text-base">Log Study Session</h3>
            <p className="text-xs text-slate-400">Record your focus time and track progress</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          {/* Subject & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                Subject
              </label>
              <select
                required
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Duration in Minutes with presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Duration (Minutes)
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m
              </span>
            </div>

            {/* Quick preset pills */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDurationMinutes(preset)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                    durationMinutes === preset
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>

            <input
              type="number"
              min="1"
              max="1440"
              required
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Focus Rating (1-5) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              Focus Level
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFocusRating(lvl)}
                  className={`p-2 rounded-xl transition ${
                    lvl <= focusRating
                      ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                      : 'text-slate-600 bg-slate-950 border border-slate-800 hover:text-slate-400'
                  }`}
                >
                  <Star className={`w-5 h-5 ${lvl <= focusRating ? 'fill-amber-400' : ''}`} />
                </button>
              ))}
              <span className="text-xs text-slate-400 ml-2">
                {focusRating === 5 && '⚡ Maximum Flow State'}
                {focusRating === 4 && '✨ Deep Concentration'}
                {focusRating === 3 && '👍 Good Progress'}
                {focusRating === 2 && '🥱 Some Distractions'}
                {focusRating === 1 && '⚠️ Low Energy'}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              Session Notes / Topics Covered
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Solved 3 graph traversal problems and wrote summary notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Submit & Cancel */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition transform active:scale-95"
            >
              Save Session Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

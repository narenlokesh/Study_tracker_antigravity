import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Check, 
  Volume2, 
  VolumeX, 
  X, 
  Timer as TimerIcon,
  Coffee,
  Brain,
  Minimize2,
  Maximize2
} from 'lucide-react';

const TIMER_MODES = [
  { id: 'pomodoro', label: 'Pomodoro', duration: 25 * 60, icon: Brain },
  { id: 'shortBreak', label: 'Short Break', duration: 5 * 60, icon: Coffee },
  { id: 'longBreak', label: 'Long Break', duration: 15 * 60, icon: Coffee },
  { id: 'stopwatch', label: 'Stopwatch', duration: 0, icon: TimerIcon },
];

export default function PomodoroTimer({ 
  isOpen, 
  onClose, 
  subjects = [], 
  onLogCompletedSession 
}) {
  const [mode, setMode] = useState('pomodoro'); // 'pomodoro' | 'shortBreak' | 'longBreak' | 'stopwatch'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [isMinimized, setIsMinimized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);

  const initialDuration = useRef(25 * 60);

  // Sync selectedSubjectId if subjects change
  useEffect(() => {
    if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // Audio tone generator using Web Audio API (zero external asset dependency!)
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio not allowed or supported', e);
    }
  };

  // Timer Tick Interval
  useEffect(() => {
    let timerId = null;

    if (isRunning) {
      timerId = setInterval(() => {
        if (mode === 'stopwatch') {
          setStopwatchSeconds((prev) => prev + 1);
        } else {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerId);
              setIsRunning(false);
              playAlertSound();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isRunning, mode, soundEnabled]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === 'stopwatch') {
      setStopwatchSeconds(0);
    } else {
      const targetDuration = TIMER_MODES.find((m) => m.id === newMode)?.duration || 25 * 60;
      initialDuration.current = targetDuration;
      setTimeLeft(targetDuration);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'stopwatch') {
      setStopwatchSeconds(0);
    } else {
      setTimeLeft(initialDuration.current);
    }
  };

  const handleAddFiveMinutes = () => {
    if (mode !== 'stopwatch') {
      setTimeLeft((prev) => prev + 300);
      initialDuration.current += 300;
    }
  };

  const formatDisplayTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Log session to database
  const handleSaveToLog = () => {
    const minutesToLog = mode === 'stopwatch' 
      ? Math.max(1, Math.round(stopwatchSeconds / 60))
      : Math.max(1, Math.round((initialDuration.current - timeLeft) / 60));

    onLogCompletedSession({
      subject_id: selectedSubjectId || subjects[0]?.id,
      duration_minutes: minutesToLog,
      notes: `Focus session (${mode === 'stopwatch' ? 'Stopwatch' : 'Pomodoro'}) completed`,
      focus_rating: 5,
      date: new Date().toISOString().split('T')[0]
    });

    // Reset timer
    handleReset();
  };

  if (!isOpen) return null;

  // Minimized floating widget
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 rounded-2xl p-3 shadow-2xl shadow-emerald-500/10 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
        <span className="font-mono text-base font-bold text-white">
          {formatDisplayTime(mode === 'stopwatch' ? stopwatchSeconds : timeLeft)}
        </span>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
          title="Expand"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Calculate percentage for progress circle
  const progressPercent = mode === 'stopwatch'
    ? (stopwatchSeconds % 3600) / 3600
    : timeLeft / (initialDuration.current || 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TimerIcon className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Focus & Pomodoro Timer</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={soundEnabled ? 'Mute sound' : 'Enable sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 my-5">
          {TIMER_MODES.map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => switchMode(m.id)}
                className={`py-2 px-1 text-center rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate w-full">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Subject Selector */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Target Subject
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Timer Circular Display */}
        <div className="flex flex-col items-center justify-center my-6">
          <div className="relative w-56 h-56 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="96"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-800/80"
                fill="transparent"
              />
              <circle
                cx="112"
                cy="112"
                r="96"
                stroke="currentColor"
                strokeWidth="8"
                className="text-emerald-500 transition-all duration-300"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 96}
                strokeDashoffset={2 * Math.PI * 96 * (1 - progressPercent)}
                strokeLinecap="round"
              />
            </svg>

            {/* Time Number */}
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-5xl font-black text-white tracking-tighter">
                {formatDisplayTime(mode === 'stopwatch' ? stopwatchSeconds : timeLeft)}
              </span>
              <span className="text-xs uppercase font-bold tracking-widest text-slate-400 mt-1">
                {isRunning ? 'Focus Mode' : 'Paused'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleReset}
            className="p-3 rounded-2xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/25 transition transform active:scale-95 flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-slate-950" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-slate-950" />
                <span>Start</span>
              </>
            )}
          </button>

          {mode !== 'stopwatch' && (
            <button
              onClick={handleAddFiveMinutes}
              className="p-3 rounded-2xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition text-xs font-bold"
              title="Add 5 minutes"
            >
              +5m
            </button>
          )}
        </div>

        {/* Quick Save to Log button */}
        {((mode === 'stopwatch' && stopwatchSeconds >= 60) || 
          (mode !== 'stopwatch' && initialDuration.current - timeLeft >= 60)) && (
          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={handleSaveToLog}
              className="w-full py-2.5 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Check className="w-4 h-4" />
              Save Elapsed Time to Study Log (
              {mode === 'stopwatch'
                ? Math.round(stopwatchSeconds / 60)
                : Math.round((initialDuration.current - timeLeft) / 60)}{' '}
              mins)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

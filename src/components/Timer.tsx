import React from 'react';
import { useTimer } from '../hooks/useTimer';
import { useAudio } from '../hooks/useAudio';

interface TimerProps {
  onComplete: () => void;
  duration?: number;
  autoStart?: boolean;
}

export const Timer: React.FC<TimerProps> = ({ onComplete, duration = 25, autoStart = false }) => {
  const { status, start, pause, reset, formatTime, progress } = useTimer(duration);
  const { playSound, settings } = useAudio();

  React.useEffect(() => {
    if (status === 'completed') {
      if (settings.enabled) {
        playSound('completion').catch(console.warn);
      }
      onComplete();
    }
  }, [status, onComplete, playSound, settings.enabled]);

  React.useEffect(() => {
    if (autoStart && status === 'idle') {
      start();
    }
  }, [autoStart, status, start]);

  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'text-sage-600';
      case 'paused': return 'text-slate-500';
      case 'completed': return 'text-sage-700';
      default: return 'text-slate-600';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'running': return 'text-sage-500';
      case 'paused': return 'text-slate-400';
      case 'completed': return 'text-sage-600';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="relative w-72 h-72">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-sage-100"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            className={`${getProgressColor()} transition-all duration-1000`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-5xl font-bold ${getStatusColor()}`}>
            {formatTime}
          </span>
        </div>
      </div>

      <div className="flex space-x-4">
        {status === 'idle' || status === 'paused' ? (
          <button
            onClick={start}
            className="px-8 py-3 bg-sage-500 text-white rounded-xl hover:bg-sage-600 focus:bg-sage-600 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-lg"
          >
            {status === 'paused' ? 'Resume' : 'Start'}
          </button>
        ) : (
          <button
            onClick={pause}
            className="px-8 py-3 bg-slate-400 text-white rounded-xl hover:bg-slate-500 focus:bg-slate-500 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-lg"
          >
            Pause
          </button>
        )}

        <button
          onClick={reset}
          className="px-8 py-3 bg-slate-300 text-slate-700 rounded-xl hover:bg-slate-400 hover:text-white focus:bg-slate-400 focus:text-white transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-lg"
        >
          Reset
        </button>
      </div>

      <div className="text-center">
        <p className={`text-xl font-semibold ${getStatusColor()}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </p>
      </div>
    </div>
  );
};
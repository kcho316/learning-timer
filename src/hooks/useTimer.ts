import { useState, useEffect, useCallback } from 'react';
import type { TimerStatus } from '../types';

export const useTimer = (initialMinutes: number = 25) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [isActive, setIsActive] = useState(false);

  const start = useCallback(() => {
    setStatus('running');
    setIsActive(true);
  }, []);

  const pause = useCallback(() => {
    setStatus('paused');
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setIsActive(false);
    setTimeLeft(initialMinutes * 60);
  }, [initialMinutes]);

  const complete = useCallback(() => {
    setStatus('completed');
    setIsActive(false);
    setTimeLeft(0);
  }, []);

  useEffect(() => {
    let interval: number | null = null;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setStatus('completed');
            setIsActive(false);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else if (!isActive && timeLeft !== 0) {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timeLeft,
    status,
    isActive,
    start,
    pause,
    reset,
    complete,
    formatTime: formatTime(timeLeft),
    progress: ((initialMinutes * 60 - timeLeft) / (initialMinutes * 60)) * 100,
  };
};
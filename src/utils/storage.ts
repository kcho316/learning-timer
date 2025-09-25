import type { Session } from '../types';

const SESSIONS_KEY = 'learning-timer-sessions';

export const saveSessions = (sessions: Session[]): void => {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

export const loadSessions = (): Session[] => {
  const stored = localStorage.getItem(SESSIONS_KEY);
  if (!stored) return [];

  try {
    const sessions = JSON.parse(stored);
    return sessions.map((session: Session & { startTime: string; endTime?: string }) => ({
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined,
    }));
  } catch {
    return [];
  }
};

export const addSession = (session: Session): void => {
  const sessions = loadSessions();
  sessions.push(session);
  saveSessions(sessions);
};

export const getSessionStats = (): { daily: number; weekly: number; monthly: number } => {
  const sessions = loadSessions().filter(s => s.completed);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    daily: sessions.filter(s => s.startTime >= today).length,
    weekly: sessions.filter(s => s.startTime >= weekAgo).length,
    monthly: sessions.filter(s => s.startTime >= monthAgo).length,
  };
};
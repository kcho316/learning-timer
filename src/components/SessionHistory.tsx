import React from 'react';
import type { Session } from '../types';

interface SessionHistoryProps {
  sessions: Session[];
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({ sessions }) => {
  const recentSessions = sessions
    .filter(session => session.completed)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    .slice(0, 10);

  if (recentSessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-sage-100 p-8">
        <h2 className="text-2xl font-bold text-slate-700 mb-6">Recent Sessions</h2>
        <p className="text-slate-500 text-center text-lg">No completed sessions yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-sage-100 p-8">
      <h2 className="text-2xl font-bold text-slate-700 mb-6">Recent Sessions</h2>
      <div className="space-y-4">
        {recentSessions.map((session) => (
          <div
            key={session.id}
            className="flex justify-between items-center p-4 bg-sage-50 rounded-xl hover:bg-sage-100 transition-colors duration-200"
          >
            <div>
              <p className="font-semibold text-slate-700 text-lg">{session.subject}</p>
              <p className="text-slate-500 mt-1">
                {session.startTime.toLocaleDateString()} at{' '}
                {session.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-sage-600 text-lg">
                {session.duration} min
              </p>
              <p className="text-slate-500">Completed</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { Timer } from './components/Timer';
import { SessionForm } from './components/SessionForm';
import { Stats } from './components/Stats';
import { SessionHistory } from './components/SessionHistory';
import type { Session, SessionStats } from './types';
import { addSession, getSessionStats, loadSessions } from './utils/storage';

function App() {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats>({ daily: 0, weekly: 0, monthly: 0 });

  useEffect(() => {
    const loadedSessions = loadSessions();
    setSessions(loadedSessions);
    setStats(getSessionStats());
  }, []);

  const handleStartSession = (subject: string) => {
    const newSession: Session = {
      id: Date.now().toString(),
      subject,
      duration: 25,
      startTime: new Date(),
      completed: false,
    };
    setCurrentSession(newSession);
  };

  const handleSessionComplete = () => {
    if (currentSession) {
      const completedSession: Session = {
        ...currentSession,
        endTime: new Date(),
        completed: true,
      };

      addSession(completedSession);
      setSessions(prev => [...prev, completedSession]);
      setStats(getSessionStats());
      setCurrentSession(null);
    }
  };

  const handleCancelSession = () => {
    setCurrentSession(null);
  };

  return (
    <div className="min-h-screen bg-sage-50">
      <div className="container mx-auto px-6 py-12">
        <header className="text-center mb-16">
          <h1 className="text-6xl font-bold text-slate-800 mb-4 tracking-tight">Learning Timer</h1>
          <p className="text-xl text-slate-600 font-medium">Stay focused with 25-minute Pomodoro sessions</p>
        </header>

        <div className="max-w-5xl mx-auto">
          {currentSession ? (
            <div className="text-center mb-16">
              <h2 className="text-3xl font-semibold text-slate-700 mb-8">
                Working on: {currentSession.subject}
              </h2>
              <Timer onComplete={handleSessionComplete} autoStart={true} />
              <button
                onClick={handleCancelSession}
                className="mt-8 px-6 py-3 bg-slate-400 text-white rounded-xl hover:bg-slate-500 transition-all duration-200 font-medium"
              >
                Cancel Session
              </button>
            </div>
          ) : (
            <div className="flex justify-center mb-16">
              <SessionForm onStartSession={handleStartSession} />
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            <Stats stats={stats} />
            <SessionHistory sessions={sessions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

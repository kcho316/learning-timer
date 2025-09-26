import { useState, useEffect } from 'react';
import { Timer } from './components/Timer';
import { SessionForm } from './components/SessionForm';
import { Stats } from './components/Stats';
import { SessionHistory } from './components/SessionHistory';
import { AudioControls } from './components/AudioControls';
import { SettingsModal } from './components/SettingsModal';
import type { Session, SessionStats } from './types';
import { addSession, getSessionStats, loadSessions } from './utils/enhancedStorage';

function App() {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats>({ daily: 0, weekly: 0, monthly: 0 });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const loadedSessions = loadSessions();
    setSessions(loadedSessions);
    setStats(getSessionStats());
  }, []);

  const refreshData = () => {
    const loadedSessions = loadSessions();
    setSessions(loadedSessions);
    setStats(getSessionStats());
  };

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
      refreshData();
      setCurrentSession(null);
    }
  };

  const handleCancelSession = () => {
    setCurrentSession(null);
  };

  return (
    <div className="min-h-screen bg-sage-50">
      <div className="container mx-auto px-6 py-12">
        <header className="relative text-center mb-20">
          <h1 className="text-6xl font-bold text-slate-800 mb-4 tracking-tight">Learning Timer</h1>
          <p className="text-xl text-slate-600 font-medium">Stay focused with 25-minute Pomodoro sessions</p>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="absolute top-0 right-0 flex items-center space-x-2 px-4 py-2 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-sm font-normal">Settings</span>
          </button>
        </header>

        <div className="max-w-5xl mx-auto">
          {currentSession ? (
            <div className="text-center mb-20">
              <h2 className="text-3xl font-semibold text-slate-700 mb-10">
                Working on: {currentSession.subject}
              </h2>
              <Timer onComplete={handleSessionComplete} autoStart={true} />
              <button
                onClick={handleCancelSession}
                className="mt-10 px-6 py-3 bg-slate-400 text-white rounded-xl hover:bg-slate-500 transition-all duration-200 font-medium"
              >
                Cancel Session
              </button>
            </div>
          ) : (
            <div className="flex justify-center mb-20">
              <SessionForm onStartSession={handleStartSession} />
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-10 mb-12">
            <Stats stats={stats} />
            <SessionHistory sessions={sessions} />
          </div>

          <div className="max-w-md mx-auto">
            <AudioControls />
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onDataChange={refreshData}
        />
      )}
    </div>
  );
}

export default App;

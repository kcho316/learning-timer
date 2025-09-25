import React, { useState } from 'react';

interface SessionFormProps {
  onStartSession: (subject: string) => void;
  disabled?: boolean;
}

export const SessionForm: React.FC<SessionFormProps> = ({ onStartSession, disabled = false }) => {
  const [subject, setSubject] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim()) {
      onStartSession(subject.trim());
      setSubject('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg">
      <div className="space-y-6">
        <div>
          <label htmlFor="subject" className="block text-2xl font-semibold text-slate-700 mb-4">
            What are you working on?
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Math homework, React tutorial, Reading..."
            className="w-full px-6 py-4 text-lg border-2 border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-400 focus:border-sage-400 transition-all duration-200 bg-white placeholder-slate-400"
            disabled={disabled}
            required
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !subject.trim()}
          className="w-full px-6 py-4 text-lg font-semibold bg-sage-500 text-white rounded-xl hover:bg-sage-600 focus:bg-sage-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Start 25-minute Session
        </button>
      </div>
    </form>
  );
};
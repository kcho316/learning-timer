import React from 'react';
import { useAudio } from '../hooks/useAudio';
import type { SoundType } from '../utils/audioUtils';

interface AudioControlsProps {
  className?: string;
}

export const AudioControls: React.FC<AudioControlsProps> = ({ className = '' }) => {
  const {
    settings,
    isLoading,
    isPlaying,
    error,
    toggleEnabled,
    setVolume,
    setSoundType,
    testSound
  } = useAudio();

  const soundTypeOptions: { value: SoundType; label: string }[] = [
    { value: 'meditation-bell', label: 'Meditation Bell' },
    { value: 'soft-piano', label: 'Soft Piano' },
    { value: 'nature-chime', label: 'Nature Chime' }
  ];

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-sage-100 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Audio Settings</h3>
        <button
          onClick={toggleEnabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.enabled ? 'bg-sage-500' : 'bg-slate-300'
          }`}
          disabled={isLoading}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {settings.enabled && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Volume
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                disabled={isLoading}
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${settings.volume * 100}%, #e2e8f0 ${settings.volume * 100}%, #e2e8f0 100%)`
                }}
              />
              <span className="text-sm text-slate-500 w-8">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Sound Type
            </label>
            <select
              value={settings.soundType}
              onChange={(e) => setSoundType(e.target.value as SoundType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-slate-700"
              disabled={isLoading}
            >
              {soundTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <button
              onClick={testSound}
              disabled={isLoading || isPlaying}
              className="px-4 py-2 bg-sage-100 text-sage-700 rounded-lg hover:bg-sage-200 focus:bg-sage-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlaying ? 'Playing...' : 'Test Sound'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
import React, { useState } from 'react';
import { AudioControls } from './AudioControls';
import { DataManager } from './DataManager';

interface SettingsModalProps {
  onClose: () => void;
  onDataChange: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onDataChange }) => {
  const [activeSection, setActiveSection] = useState<'audio' | 'data'>('audio');

  const handleDataChange = () => {
    onDataChange();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-800">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveSection('audio')}
            className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeSection === 'audio'
                ? 'border-sage-500 text-sage-600 bg-sage-50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Audio & Notifications
          </button>
          <button
            onClick={() => setActiveSection('data')}
            className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeSection === 'data'
                ? 'border-sage-500 text-sage-600 bg-sage-50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Data Management
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeSection === 'audio' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-700 mb-4">Audio Settings</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Configure notification sounds that play when your timer sessions complete.
                </p>
              </div>

              <AudioControls className="shadow-none border-0 bg-transparent p-0" />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-700 mb-4">Data Management</h3>
                <p className="text-sm text-slate-600 mb-6">
                  View statistics, export your data, import sessions from other sources, and manage your learning history.
                </p>
              </div>

              <DataManager
                className="shadow-none border-0 bg-transparent p-0"
                onDataChange={handleDataChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import type { SessionStats } from '../types';

interface StatsProps {
  stats: SessionStats;
}

export const Stats: React.FC<StatsProps> = ({ stats }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-700 mb-6">Session Statistics</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-sage-100 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="text-center">
          <div className="text-4xl font-bold text-sage-600 mb-2">{stats.daily}</div>
          <div className="text-lg font-medium text-slate-600">sessions completed today</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-sage-100 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="text-center">
          <div className="text-4xl font-bold text-sage-600 mb-2">{stats.weekly}</div>
          <div className="text-lg font-medium text-slate-600">sessions completed this week</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-sage-100 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="text-center">
          <div className="text-4xl font-bold text-sage-600 mb-2">{stats.monthly}</div>
          <div className="text-lg font-medium text-slate-600">sessions completed this month</div>
        </div>
      </div>
    </div>
  );
};
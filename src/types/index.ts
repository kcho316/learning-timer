export interface Session {
  id: string;
  subject: string;
  duration: number; // in minutes
  startTime: Date;
  endTime?: Date;
  completed: boolean;
}

export interface SessionStats {
  daily: number;
  weekly: number;
  monthly: number;
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';